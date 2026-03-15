# Product Lifecycle Management Tool via Claude Desktop and MCP
**Working solution summary and technical design**
**Status:** Draft working specification  
**Purpose:** Capture the problem statement, what we built in this chat, why we built it that way, issues encountered, and the proposed solution.

---

# 1. Problem statement

The goal is to create a local, single user Product Lifecycle Management, PLM, style workflow that lets a user query and edit structured lifecycle data through Claude Desktop using Model Context Protocol, MCP.

The user wanted to manage structured engineering and validation data for:
- people
- system categories
- requirements
- test procedures
- test cases

The desired experience was:
- ask Claude in natural language
- Claude reads and edits local structured data
- data persists locally between sessions
- the system stays local, with no exposure to the broader network
- Claude can guide creation workflows for new records
- users can trust what Claude changed

The user explicitly wanted:
- a single user local setup
- Windows support
- a custom MCP server
- natural language querying
- filtering, joining, reporting, and validations
- real time writes
- support for read, create, update, delete
- local only operation with no cloud requirement for the data store

---

# 2. Product context

This is effectively a lightweight PLM and validation management layer for product requirements and verification artifacts.

The data model supports:
- defining requirements
- associating requirements to categories and owners
- defining test procedures that verify requirements
- recording test case executions against procedures and requirements
- tracking lifecycle status
- preserving auditability and traceability

This is especially useful for product teams managing requirement verification, test readiness, and execution history without needing a large enterprise PLM platform.

---

# 3. Core user jobs to be done

The workflow we designed addresses these jobs:

1. **Create and manage requirements**
   - Add new requirements with the correct default fields
   - Track owner, category, lifecycle, and resources

2. **Create verification artifacts**
   - Add test procedures that verify requirements
   - Add test cases that execute procedures

3. **Enforce process rules**
   - Prevent invalid downstream data creation
   - Ensure published entities only spawn allowed child artifacts

4. **Query and inspect data in natural language**
   - Ask Claude for rows, filters, joins, and summaries

5. **Trust and verify edits**
   - Show clear confirmation after inserts, updates, and deletes
   - Show before and after values for updates
   - Keep a write history

---

# 4. Data model and structure

## 4.1 Tables

### people
Stores identities used for ownership and execution.

Fields:
- `person_id`
- `name`

### system_categories
Controlled vocabulary for subsystem grouping.

Fields:
- `system_category_id`
- `name`

### requirements
Primary requirement records.

Representative fields:
- `requirement_id`
- `title`
- `req_type`
- `required_value`
- `version`
- `status`
- `created_at`
- `updated_at`
- `resources`
- `system_category_id`
- `owner_person_id`

### test_procedures
Verification methods tied to exactly one requirement.

Representative fields:
- `test_procedure_id`
- `requirement_id`
- `name`
- `description`
- `equipment`
- `expected_results`
- `version`
- `status`
- `created_at`
- `updated_at`
- `resources`

### test_cases
Concrete execution records tied to a procedure and requirement.

Representative fields:
- `test_case_id`
- `test_procedure_id`
- `requirement_id`
- `measured_value`
- `pass_fail`
- `hw_version`
- `fw_version`
- `duration`
- `tester_id`
- `notes`
- `version`
- `status`
- `created_at`
- `updated_at`
- `resources`

### audit_log
Added later to improve trust and change traceability.

Fields:
- `audit_id`
- `ts`
- `actor`
- `action`
- `table_name`
- `pk_name`
- `pk_value`
- `before_json`
- `after_json`

---

## 4.2 Relationships

- One category to many requirements
- One person to many owned requirements
- One requirement to many test procedures
- One requirement to many test cases
- One test procedure to many test cases
- One person to many executed test cases

---

## 4.3 Lifecycle model

Shared lifecycle states:
- `draft`
- `published`
- `obsolete`

Timestamps:
- `created_at` defaults on insert
- `updated_at` is maintained via triggers on update

---

# 5. Architecture

## 5.1 Chosen architecture

We implemented a local architecture with:

- **Claude Desktop** as the conversational client
- **Custom MCP server** written in Node.js
- **SQLite database** stored as a local file, `app.db`
- **MCP stdio transport** for local process based communication

## 5.2 Why this architecture

This was chosen because it is:
- local first
- simple to set up
- easy to inspect
- persistent
- compatible with structured relational data
- suitable for a single user workflow

SQLite was a strong fit because:
- it is file based
- it persists automatically
- it supports triggers and foreign keys
- it works well for low volume local applications

MCP was chosen because it lets Claude Desktop call structured tools rather than pretending files are free form text.

---

# 6. Key technical choices and rationale

## 6.1 SQLite instead of spreadsheets or flat files
Why:
- relational integrity mattered
- the workflow needed joins and validation logic
- lifecycle and references are easier to enforce in SQL than in CSV

## 6.2 Node.js MCP server
Why:
- Claude Desktop MCP support is designed for local server tools
- Node has an official MCP SDK
- a single server file was enough for the first version

## 6.3 ESM module format
Why:
- the installed MCP SDK version expected modern ESM style imports
- CommonJS created repeated failures with `require`

## 6.4 Trigger based rules in SQLite
Why:
- SQLite does not support all forms of CHECK logic needed here
- business rules referenced parent rows
- triggers were the simplest way to enforce cross table lifecycle rules

## 6.5 Receipt based write tools
Why:
- users need visible confirmation after edits
- “updated successfully” is not enough for trust
- showing before and after improves confidence and reviewability

---

# 7. Challenges encountered and how they were addressed

This section captures the real implementation obstacles from the chat.

## 7.1 PowerShell and inline Node quoting issues
Problem:
- Running inline `node -e` commands caused quoting and parsing failures on Windows

Why it happened:
- multi line JavaScript embedded in PowerShell is fragile

Resolution:
- moved initialization logic into real `.js` files instead of inline snippets

---

## 7.2 SQLite CHECK constraint limitation
Problem:
- SQLite rejected subqueries inside CHECK constraints

Why it happened:
- SQLite does not allow subqueries in CHECK expressions

Resolution:
- replaced enum table based validation with direct value checks
- used triggers for business rules that depend on related rows

---

## 7.3 CommonJS vs ESM failures
Problem:
- `require is not defined in ES module scope`
- package export path errors

Why it happened:
- the project was set to `"type": "module"`
- initial scripts still used CommonJS syntax

Resolution:
- converted server and helper scripts to ESM
- used proper SDK import paths

---

## 7.4 MCP SDK API drift
Problem:
- `server.tool is not a function`
- import path confusion
- unsupported directory import errors

Why it happened:
- the installed MCP SDK version differed from older examples

Resolution:
- switched to `McpServer`
- used `registerTool(...)`
- used current documented import paths

---

## 7.5 Claude config JSON failures
Problem:
- Claude Desktop could not load settings due to malformed JSON

Why it happened:
- Windows path escaping and JSON formatting issues

Resolution:
- rewrote config file from scratch as minimal valid JSON
- validated it in PowerShell before reopening Claude

---

## 7.6 Tool name validation failure
Problem:
- Claude rejected tool names like `db.query`

Why it happened:
- tool names must match the allowed pattern and cannot contain dots

Resolution:
- renamed tools to underscore based names:
  - `db_query`
  - `db_insert`
  - `db_update`
  - `db_delete`

---

## 7.7 Empty database confusion
Problem:
- Claude connected, but the server appeared to see an empty database

Why it happened:
- relative path resolution or wrong working directory created or opened a different `app.db`

Resolution:
- changed the server to use an absolute path derived from `server.js`
- wrote `started.flag` with diagnostics including actual DB path

---

## 7.8 Lack of visible proof after writes
Problem:
- adopters may not trust that Claude actually changed the record correctly

Why it mattered:
- conversational systems need stronger evidence than silent success messages

Resolution:
- introduced audit logging
- added receipt based write tools
- returned inserted rows, diffs, and summaries

---

# 8. Business rules implemented

## 8.1 Lifecycle rules

### Rule 1
A test procedure can only be created if its linked requirement is `published`.

Implemented with:
- before insert trigger on `test_procedures`
- before update of `requirement_id` trigger on `test_procedures`

### Rule 2
A test case can only be created if its linked test procedure is `published`.

Implemented with:
- before insert trigger on `test_cases`
- before update of `test_procedure_id` trigger on `test_cases`

### Rule 3
Publishing should also respect the same parent lifecycle constraints.

Implemented with:
- before update of `status` on `test_procedures`
- before update of `status` on `test_cases`

This prevents users from creating a draft child and then publishing it later while the parent is still not published.

---

# 9. Workflow improvements added

## 9.1 Guided requirement creation
When the user says “add a new requirement”, Claude can:

1. fetch the next `requirement_id`
2. prefill:
   - `version = 1`
   - `status = draft`
3. rely on DB defaults for:
   - `created_at`
   - `updated_at`
4. ask only for:
   - `title`
   - `req_type`
   - `required_value`
   - `resources`
   - `system_category_id`
   - `owner_person_id`

Implemented as tool:
- `requirements_next`

---

## 9.2 Guided test procedure creation
When the user wants to add a test procedure, Claude can:

1. fetch the next `test_procedure_id`
2. prefill:
   - `version = 1`
   - `status = draft`
3. ask for:
   - `requirement_id`
   - `name`
   - `description`
   - `equipment`
   - `expected_results`
   - `resources`

Implemented as tool:
- `test_procedures_next`

---

## 9.3 Guided test case creation
When the user wants to add a test case, Claude can:

1. fetch the next `test_case_id`
2. ask for:
   - `test_procedure_id`
   - `measured_value`
   - `pass_fail`
   - `hw_version`
   - `fw_version`
   - `duration`
   - `tester_id`
   - `notes`
   - `resources`
3. derive `requirement_id` automatically from the chosen `test_procedure_id`
4. prefill:
   - `version = 1`
   - `status = draft`

Implemented as tool:
- `test_cases_next`

---

# 10. Final MCP tool set

## 10.1 Planning and workflow helpers
- `requirements_next`
- `test_procedures_next`
- `test_cases_next`

## 10.2 Query and CRUD tools
- `db_query`
- `db_insert`
- `db_update`
- `db_delete`

## 10.3 Trust and receipt tools
- `db_insert_receipt`
- `db_update_receipt`
- `db_delete_receipt`
- `audit_recent`

---

# 11. How trust was improved

Trust was a major product concern. The solution was not just “make writes possible.” It was “make writes understandable and reviewable.”

## 11.1 Receipt pattern
After inserts or updates, Claude can show:
- a one line summary
- the affected row
- before and after values for updates
- changed fields
- stable identifiers like table name and primary key

## 11.2 Audit trail
Every write action can be recorded in `audit_log` with:
- timestamp
- actor
- action
- before JSON
- after JSON

## 11.3 Startup diagnostics
The server writes `started.flag` on launch, including:
- launch timestamp
- process working directory
- actual database file path

This makes it easier to debug environment or path issues.

---

# 12. Proposed user experience

## Example: Add a requirement
User:
> Add a new requirement

Claude flow:
1. call `requirements_next`
2. tell the user the next id
3. ask only for missing fields
4. call `db_insert_receipt`
5. show the inserted row and timestamps

## Example: Publish a requirement
User:
> Publish requirement 4

Claude flow:
1. call `db_update_receipt`
2. show before and after diff
3. show updated row
4. optionally show related validation status

## Example: Add a test case
User:
> Add a new test case for procedure 18

Claude flow:
1. call `test_cases_next`
2. derive requirement id from procedure 18
3. ask only for remaining fields
4. call `db_insert_receipt`
5. show inserted row and summary

---

# 13. Proposed solution summary

The proposed solution is a lightweight, local PLM style data management tool using Claude Desktop as the interaction layer, SQLite as the persistent store, and a custom MCP server as the structured operations layer.

It supports:
- requirement management
- test procedure management
- test case management
- lifecycle validations
- guided record creation
- trusted read and write feedback
- durable local persistence

This avoids the complexity of a larger PLM platform while still delivering:
- traceability
- guardrails
- local control
- conversational UX

---

# 14. Risks and limitations

## Current limitations
- single user only
- local machine only
- no authentication or role based access
- no rich UI beyond Claude chat
- no advanced reporting UI
- no transaction review screen outside the chat
- resources are stored as JSON text in a single column, not normalized

## Risks
- if the wrong DB path is configured, Claude may write to an unexpected file
- write trust still depends on users reviewing receipts
- concurrent usage is not a target scenario
- natural language ambiguity may still require explicit follow up questions

---

# 15. Recommended next steps

## Product
1. define the exact preferred conversational flows for create, edit, publish, and delete
2. decide which receipt format users trust most
3. define the minimum reporting views users want in chat
4. clarify whether resources should become a separate table later

## Technical
1. add dry run support for updates and inserts
2. add stronger validation for IDs and enumerations in helper tools
3. add richer query helper tools for joins and summaries
4. add backward lifecycle guards, for example blocking a requirement from returning to draft if published procedures already exist
5. add export tools for markdown, CSV, or JSON summaries

---

# 16. Final note

This solution was not created as a generic database demo. It was shaped around a real product workflow need:

- local control
- structured lifecycle data
- natural language access
- durable edits
- confidence in what changed

The resulting design is intentionally simple, inspectable, and extensible.


# Suggested PRD for Local PLM Workflow via Claude Desktop and MCP
**Document type:** Suggested PRD style companion  
**Status:** Proposed only, not final  
**Purpose:** Suggest user stories, use cases, workflows, and product requirements based on the work completed in this chat.

---

# 1. Important note

This document is a **set of suggestions** based on the requirements, implementation choices, and workflows discussed in the chat. It is **not** an approved or finalized PRD.

It should be treated as:
- a starting point for discussion
- a candidate specification
- a planning artifact for future iteration

---

# 2. Product summary

## Proposed product name
Local PLM Assistant for Claude Desktop

## Proposed vision
Enable a product or validation owner to manage requirements, test procedures, and test cases in a local structured database through natural language in Claude Desktop, while preserving process rules and user trust.

## Proposed target user
A single technical or product user managing product verification data locally on Windows.

---

# 3. Problem to solve

Users need a lightweight way to manage structured product lifecycle and validation data without using a heavy enterprise system or manually editing spreadsheets.

Current alternatives have problems:
- spreadsheets are hard to validate and join
- raw SQL is inaccessible for many users
- traditional PLM tools may be too heavy for a single user local workflow
- generic chat alone does not guarantee persistence, rules, or traceability

The proposed solution lets the user talk naturally to Claude while Claude operates on real structured local data through MCP tools.

---

# 4. Goals

## Suggested goals
1. Let users query lifecycle data in natural language
2. Let users create and edit data with real persistence
3. Enforce key lifecycle relationships and validation rules
4. Reduce data entry friction with guided creation workflows
5. Improve trust with explicit write receipts and audit history

## Suggested non goals
1. Multi user collaboration
2. Web based deployment
3. Enterprise grade permissions
4. External network exposure
5. Full replacement of a large PLM suite

---

# 5. Suggested personas

## Persona 1: Product manager
Needs:
- add and update requirements
- assign owners and categories
- understand status and progress

Pain points:
- structured tools are too technical
- data entry is repetitive
- trust in AI generated edits is low without evidence

## Persona 2: Validation or test engineer
Needs:
- define test procedures against requirements
- execute and log test cases
- preserve traceability and outcomes

Pain points:
- maintaining linkage manually is tedious
- invalid child records are easy to create without guardrails

## Persona 3: Single user system owner
Needs:
- local control
- no remote exposure
- easy debugging and inspection

Pain points:
- configuration errors
- hidden state
- uncertainty about whether Claude changed real data

---

# 6. Suggested user stories

## 6.1 Requirement management

### Story R1
As a product manager, I want Claude to prepare the next requirement id automatically so I do not have to look it up manually.

### Story R2
As a product manager, I want Claude to ask me only for the fields that are still missing when creating a requirement so data entry is faster.

### Story R3
As a product manager, I want version and draft status to be filled automatically for new requirements so records are created consistently.

### Story R4
As a product manager, I want created and updated timestamps handled automatically so I do not manage system fields myself.

### Story R5
As a product manager, I want to see a receipt after inserting or updating a requirement so I trust what changed.

---

## 6.2 Test procedure management

### Story TP1
As a validation owner, I want Claude to prepare the next test procedure id automatically so I do not have to check the database myself.

### Story TP2
As a validation owner, I want Claude to ask for the linked requirement, name, description, equipment, expected results, and resources when creating a procedure so the record is complete.

### Story TP3
As a validation owner, I want the system to block procedure creation if the linked requirement is not published so verification artifacts follow process rules.

### Story TP4
As a validation owner, I want Claude to show me the inserted procedure after creation so I can verify it is correct.

---

## 6.3 Test case management

### Story TC1
As a test engineer, I want Claude to prepare the next test case id automatically so I do not have to track IDs manually.

### Story TC2
As a test engineer, I want Claude to derive the requirement id from the chosen test procedure so I do not risk linking the wrong requirement.

### Story TC3
As a test engineer, I want Claude to ask me for measured value, pass or fail, hardware version, firmware version, duration, tester, notes, and resources so the execution record is complete.

### Story TC4
As a test engineer, I want the system to block test case creation if the linked procedure is not published so execution only happens on approved procedures.

### Story TC5
As a test engineer, I want a clear receipt after logging a test case so I can trust the database was actually updated.

---

## 6.4 Query and trust

### Story Q1
As a user, I want to ask natural language questions about my data so I do not have to write SQL.

### Story Q2
As a user, I want Claude to return the exact row after a write so I can verify the final state.

### Story Q3
As a user, I want updates to show before and after values so I can review changes clearly.

### Story Q4
As a user, I want an audit history of recent writes so I can inspect what was changed over time.

---

# 7. Suggested use cases

## Use case 1: Add a requirement
Trigger:
- user says “add a new requirement”

Expected flow:
1. Claude calls `requirements_next`
2. Claude gets the next id and defaults
3. Claude asks for missing fields only
4. Claude inserts the row using a receipt tool
5. Claude shows the inserted row and summary

Success criteria:
- row exists in `requirements`
- version is 1
- status is draft
- timestamps are populated
- user sees receipt

---

## Use case 2: Add a test procedure
Trigger:
- user says “add a new test procedure”

Expected flow:
1. Claude calls `test_procedures_next`
2. Claude asks for linked requirement and remaining fields
3. Claude inserts the row
4. database enforces the published requirement rule
5. Claude shows receipt

Success criteria:
- insert succeeds only if parent requirement is published
- user sees the created procedure row

---

## Use case 3: Add a test case
Trigger:
- user says “add a new test case for procedure 18”

Expected flow:
1. Claude calls `test_cases_next`
2. Claude derives requirement id from procedure 18
3. Claude asks for missing execution details
4. Claude inserts the row
5. database enforces the published procedure rule
6. Claude shows receipt

Success criteria:
- requirement id is derived correctly
- insert is blocked if the procedure is not published
- user sees a final receipt and row

---

## Use case 4: Update lifecycle status
Trigger:
- user says “publish requirement 4”

Expected flow:
1. Claude calls `db_update_receipt`
2. Claude updates the row
3. Claude shows before and after values and changed fields

Success criteria:
- updated row persists
- user sees clear diff
- `updated_at` changes

---

## Use case 5: Review recent changes
Trigger:
- user asks “what changed recently”

Expected flow:
1. Claude calls `audit_recent`
2. Claude returns recent audit log entries
3. Claude summarizes inserts, updates, and deletes

Success criteria:
- recent writes are visible with timestamps and affected rows

---

# 8. Suggested product requirements

## 8.1 Functional requirements

### FR1
The system shall allow natural language querying of local relational data through Claude Desktop.

### FR2
The system shall support reads, inserts, updates, and deletes for:
- requirements
- test procedures
- test cases
- people
- system categories

### FR3
The system shall support helper tools that prepare default templates for new:
- requirements
- test procedures
- test cases

### FR4
The system shall automatically assign the next primary key value for helper generated creation flows.

### FR5
The system shall auto populate version as `1` and status as `draft` for helper generated new records.

### FR6
The system shall populate created and updated timestamps automatically at the database level.

### FR7
The system shall derive `requirement_id` automatically for new test cases when a `test_procedure_id` is supplied.

### FR8
The system shall prevent creation of a test procedure unless its parent requirement is published.

### FR9
The system shall prevent creation of a test case unless its parent test procedure is published.

### FR10
The system shall prevent publishing of child records if the parent publish condition is not met.

### FR11
The system shall provide write receipts for inserts, updates, and deletes.

### FR12
The system shall log writes into an audit table with before and after snapshots where applicable.

---

## 8.2 Non functional requirements

### NFR1
The system shall run locally on Windows.

### NFR2
The system shall use local file based storage only.

### NFR3
The system shall not require external network access for database operations.

### NFR4
The system shall preserve data between sessions.

### NFR5
The system shall make the active database path diagnosable.

### NFR6
The system shall provide human readable outputs for writes so users can build trust in the system.

---

# 9. Suggested UX principles

## Principle 1: Ask only for missing information
Claude should not ask for values it can derive or default.

## Principle 2: Show evidence after every write
Claude should show the inserted or updated row, not just “done.”

## Principle 3: Keep system fields out of user burden
IDs, timestamps, version, and default status should be handled automatically whenever possible.

## Principle 4: Fail with useful messages
If a lifecycle rule blocks an action, the user should get a clear explanation.

## Principle 5: Prefer traceability over magic
Changes should be visible, inspectable, and auditable.

---

# 10. Suggested acceptance criteria

## Requirement creation
- When the user asks to add a requirement, Claude returns the next id and asks only for missing fields.
- After insertion, the row exists with version 1 and draft status.
- Timestamps are populated automatically.
- Claude shows a receipt and the inserted row.

## Test procedure creation
- When the user asks to add a procedure, Claude prepares the next id.
- Claude asks for the associated requirement and missing details.
- Insert fails if the requirement is not published.
- Claude shows a receipt on success.

## Test case creation
- When the user asks to add a test case, Claude prepares the next id.
- If procedure id is provided, requirement id is derived automatically.
- Insert fails if the procedure is not published.
- Claude shows a receipt on success.

## Update trust
- Updates show before and after states.
- Changed fields are explicitly listed.
- `updated_at` changes after a successful update.

## Audit
- Recent writes can be retrieved with an audit tool.
- Audit rows capture actor, action, table, and before and after state where appropriate.

---

# 11. Suggested metrics

## Adoption metrics
- number of successful create flows completed through Claude
- number of successful edits completed through Claude
- share of operations done through helper workflows vs raw commands

## Trust metrics
- percentage of write operations followed by a confirmation query
- frequency of audit log inspection
- frequency of write rollback or correction after a receipt

## Quality metrics
- rate of blocked invalid insert attempts
- rate of foreign key or lifecycle rule violations
- rate of successful derived requirement assignment for test cases

---

# 12. Suggested future enhancements

These are suggestions only.

## Workflow enhancements
- single tool create flows that both prepare and insert after collecting fields
- dry run mode for writes
- suggestion lists for valid owner ids and category ids
- richer join helpers for requirement coverage and pass rate

## Governance enhancements
- prevent backward lifecycle moves when published child artifacts exist
- add explicit approval states if needed later
- normalize resources into a separate table

## UX enhancements
- more compact receipt formatting
- markdown table rendering for changed fields
- recent activity summaries by entity

---

# 13. Suggested open questions

1. Should `resources` remain a JSON text field or become a normalized related table?
2. Should Claude propose valid `system_category_id` and `owner_person_id` values instead of just asking for numeric ids?
3. Should helper tools allow human readable owner and category names and resolve them to ids automatically?
4. Should deletion be restricted for published records?
5. Should the system support “draft first, submit for publish” conversational workflows?

---

# 14. Final note

This PRD style document is intentionally framed as a **suggested** product definition. It is based on the technical and workflow solutioning completed in the chat, but it should still be reviewed, prioritized, and refined before being treated as a final product commitment.