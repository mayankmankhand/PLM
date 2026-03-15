# Status Guide

How statuses and lifecycle transitions work in the PLM system, and *why* each rule exists.

## Requirements (Product Requirements & Sub-Requirements)

| Status | Meaning | What you can do | Rationale |
|--------|---------|-----------------|-----------|
| **DRAFT** | Work in progress, not yet finalized | Edit freely, then approve when ready | Allows iteration before committing to a baseline |
| **APPROVED** | Finalized and locked for edits | Create sub-requirements or test procedures against it. Cancel if no longer needed | Locks the baseline so downstream work (tests, sub-requirements) builds on a stable foundation |
| **CANCELED** | No longer relevant | Nothing - this is a terminal state | Preserves history instead of deleting, so audit trail stays intact |

**Flow:** DRAFT -> APPROVED -> CANCELED

**Rules:**

| Rule | Rationale |
|------|-----------|
| Sub-requirements can only be approved when their parent product requirement is already approved | Prevents finalizing child work against a requirement that might still change |
| You cannot edit a requirement after it's approved - create a new one instead | Protects downstream test procedures and test cases that depend on the approved text |
| Canceling is permanent and cannot be undone | Prevents flip-flopping that would confuse downstream status tracking |
| Only APPROVED requirements can be canceled (not DRAFT) | DRAFT requirements haven't been committed to yet - just edit them directly |

## Test Procedures

Test procedures use **two-entity versioning**: a logical procedure (the container) and immutable version snapshots (the content).

### Procedure (container)

| Status | Meaning | Rationale |
|--------|---------|-----------|
| **ACTIVE** | The procedure is in use | Default state - the procedure exists and can hold versions |
| **CANCELED** | The procedure is retired | Soft-retirement preserves history while signaling the procedure should not be used |

### Procedure Version (content snapshot)

| Status | Meaning | What you can do | Rationale |
|--------|---------|-----------------|-----------|
| **DRAFT** | Version is being written | Edit description and steps, then approve when ready | Allows iteration on test steps before they become the official procedure |
| **APPROVED** | Version is locked and ready for testing | Create test cases against it. Cannot be edited | Ensures test cases execute against a fixed set of steps - no moving target |

**Flow:** DRAFT -> APPROVED (per version)

**Rules:**

| Rule | Rationale |
|------|-----------|
| Only one draft version is allowed per procedure at a time | Prevents confusion about which draft is "current" and avoids merge conflicts between parallel edits |
| Approving a version locks it permanently - to make changes, create a new version | Guarantees test results can always be traced back to the exact steps that were executed |
| You cannot create versions on a canceled procedure | A retired procedure should not accumulate new work - create a new procedure instead |

## Test Cases

| Status | Meaning | What you can do | Rationale |
|--------|---------|-----------------|-----------|
| **PENDING** | Waiting to be executed | Record a result (PASS, FAIL, BLOCKED, or SKIPPED) or skip it | Default state for newly created test cases |
| **PASSED** | Test executed successfully | Done | Records a positive result against the procedure version |
| **FAILED** | Test found a defect | Done | Flags the defect for follow-up without losing the test record |
| **BLOCKED** | Cannot execute due to external dependency | Record a result when unblocked | Distinguishes "can't test yet" from "chose not to test" (SKIPPED) |
| **SKIPPED** | Intentionally not executed | Cannot record results, but attachments can still be added | Permanent opt-out so skipped tests don't show up as incomplete work |

**Rules:**

| Rule | Rationale |
|------|-----------|
| Test cases can only be created against approved procedure versions | Prevents running tests against steps that might still change |
| Recording a result (PASS/FAIL/BLOCKED) changes the status automatically | Keeps status in sync with the actual outcome - no manual status management needed |
| Recording a SKIPPED result returns the test case to PENDING | Temporary deferment ("not right now") vs. the permanent `skipTestCase` action ("never running this") |
| Results can only be recorded when the parent procedure version is APPROVED | Same reason as creation - results must trace back to a locked set of steps |
| Skipping a test case is permanent | Prevents gaming metrics by skipping failures and then un-skipping later |
| You cannot record results on a skipped test case | Once a test is opted out, its status should not change - create a new test case if needed |
| BLOCKED is re-executable (not terminal) | A blocked test should eventually be run once the blocker is resolved |

## Attachments

Attachments are files linked to any entity. They use **soft-delete** instead of hard-delete.

| Status | Meaning | What you can do | Rationale |
|--------|---------|-----------------|-----------|
| **ACTIVE** | File is visible and linked | Remove it (soft-delete) | Default state for attached files |
| **REMOVED** | Soft-deleted, hidden from all queries | Nothing - the record is preserved but invisible | Keeps the audit trail intact while hiding the file from normal views |

**Rules:**

| Rule | Rationale |
|------|-----------|
| Each attachment must have exactly one parent (product requirement, sub-requirement, test procedure, or test case) | The exclusive arc pattern prevents orphaned files and ambiguous ownership |
| You cannot attach files to a CANCELED entity (product requirement, sub-requirement, or test procedure) | Adding files to retired entities creates confusing audit records and suggests work is still happening |
| Removing an attachment sets its status to REMOVED instead of deleting the row | Preserves the audit trail - you can always see what was attached and when it was removed |
| All queries automatically filter out REMOVED attachments | Keeps the UI clean without requiring every caller to remember the filter |

## Cascade Rules

When a parent entity is canceled, its children are automatically canceled or skipped down the chain. This prevents orphaned work from appearing active when its parent is no longer relevant.

| When this happens | Children affected | Child status becomes | Rationale |
|-------------------|-------------------|---------------------|-----------|
| Product Requirement is canceled | All its Sub-Requirements | CANCELED | Sub-requirements lose their purpose when the parent requirement is retired |
| Sub-Requirement is canceled | All its Test Procedures | CANCELED | Test procedures can't validate a canceled requirement |
| Test Procedure is canceled | All its Test Cases | SKIPPED | Test cases can't be executed against a retired procedure - SKIPPED (not CANCELED) because test cases don't have a CANCELED status |

**How cascades work:**
- Cascades skip children that are already in the target terminal state (no duplicate operations)
- Cascade cancellation bypasses the normal status guards - for example, a DRAFT sub-requirement can be cascade-canceled even though direct cancellation requires APPROVED status. This is because the parent's cancellation makes the child's current status irrelevant.
- Cascades run inside the same database transaction as the parent's status change, so either everything succeeds or nothing does

## Database Safety Nets

The service layer enforces lifecycle rules, but the database provides a second line of defense for the most critical constraints.

| Constraint | What it prevents | How it works |
|------------|-----------------|--------------|
| **Single-draft unique index** | Two DRAFT versions existing on the same procedure | A partial unique index on `test_procedure_versions(test_procedure_id) WHERE status = 'DRAFT'` - the database rejects any insert that would create a second draft |
| **Exclusive arc CHECK constraint** | An attachment having zero or multiple parents | A CHECK constraint counts non-null parent FK columns and requires exactly one - the database rejects any insert or update that violates this |
| **Foreign key RESTRICT** | Deleting an entity that has children pointing to it | Most FK relationships use `ON DELETE RESTRICT`, which blocks the delete at the database level |

## Confirmation Pattern

Destructive or hard-to-reverse actions require explicit user confirmation before execution. This applies to both the API (via Zod validation) and the AI chat assistant (via prompt engineering).

**Actions that require confirmation:** approve, cancel, skip, remove attachment

**How it works:**
1. The user requests an action (e.g., "cancel this requirement")
2. The system explains what will happen, including any cascade effects
3. The user explicitly confirms (e.g., "yes", "go ahead")
4. Only then is the action executed with the confirmation flag set to `true`

**Why:** These actions are either irreversible (cancel, skip) or lock content permanently (approve). The confirmation step prevents accidental data loss, especially important when cascade effects would cancel multiple child entities.

## Audit Actions

Every change in the system is logged in the same database transaction as the change itself. This means audit records are never out of sync with the data they describe.

| Action | When it's logged | Which entities | Rationale |
|--------|-----------------|----------------|-----------|
| CREATE | A new entity is created | All entity types | Tracks who created what and when |
| UPDATE | A draft entity is edited | Requirements, Sub-Requirements, Procedure Versions | Records what changed so edits can be reviewed |
| APPROVE | A draft is approved (locked) | Requirements, Sub-Requirements, Procedure Versions | Marks the moment content became the official baseline |
| CANCEL | An entity is canceled (retired) | Requirements, Sub-Requirements, Test Procedures | Records the retirement decision and who made it |
| SKIP | A test case is skipped | Test Cases | Distinguishes intentional skip from incomplete work |
| CREATE_VERSION | A new version is created on a test procedure | Test Procedure Versions | Tracks the version history of a procedure |
| RECORD_RESULT | A test result (PASS/FAIL/BLOCKED) is recorded | Test Cases | Captures the outcome and who executed the test |
| ADD_ATTACHMENT | A file is attached to an entity | Attachments | Records file additions with metadata |
| REMOVE_ATTACHMENT | A file attachment is removed (soft-deleted) | Attachments | Records who removed the file and when |

**Source tracking:** Each audit entry records whether the action came from the API (`"api"`) or the AI chat assistant (`"chat"`), so you can distinguish human-initiated actions from AI-assisted ones.
