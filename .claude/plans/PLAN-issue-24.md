# Feature Implementation Plan

**Overall Progress:** `0%`

## TLDR
Enrich `showTable` queries with cross-entity data (creators, parent context, team info, aggregations) so panel tables can answer questions that span multiple entities. Tool-layer only - no panel UI changes needed since `TablePayload` already supports arbitrary columns.

## Goal State
**Current State:** Each `showTable` query type fetches fields from a single entity (plus 1-2 levels of parent/child names). Users asking "show requirements with who created them" or "pass/fail summary by procedure" get chat text or diagram workarounds instead of rich tables.

**Goal State:** Existing query types return richer columns (creator, team, parent status, executor). New query types support aggregations and date-filtered views. The LLM's system prompt guides it to use these capabilities. All 20 identified use cases produce useful panel tables.

## Critical Decisions
- **Enrich existing queries, not add parallel ones** - `allRequirements` always includes creator, rather than a separate `requirementsWithCreator` query. Simpler for the LLM to reason about.
- **Tool-layer only** - `TablePayload` already accepts arbitrary columns/rows. No panel component changes.
- **Audit joins via separate query** - AuditLog has no FK to entities (string-based entityType+entityId), so "Created By" requires a Prisma query on AuditLog, not a relation include. We'll batch-fetch audit entries and merge in the tool.
- **New query types for aggregations** - Aggregation queries (pass/fail counts, coverage by team) need new `queryType` enum values since they produce fundamentally different column shapes.

## Use Cases (reference)

**Tier 1 (high impact):** #1 Requirements+creator, #4 Test cases+full lineage, #7 Pass/fail summary, #18 All TCs for a requirement, #9 Activity+entity names
**Tier 2 (valuable):** #3 TCs+executor, #5 SRs+parent status, #6 Open SRs by team, #10 Approved in date range, #14 Coverage by team, #11 Requirements fully passing
**Tier 3 (nice to have):** #2, #8, #12, #13, #15, #16, #17, #19, #20

## Tasks

- [ ] 🟥 **Step 1: Enrich existing "all*" queries with cross-entity columns** `[parallel]` -> delivers: richer default columns for 5 existing query types
  - [ ] 🟥 `allRequirements`: add `createdBy` (from AuditLog CREATE action), `createdAt`
  - [ ] 🟥 `allSubRequirements`: add `parentStatus` (PR status), `createdBy` (from AuditLog)
  - [ ] 🟥 `allTestProcedures`: add `requirement` (SR's parent PR title), `team` (SR's team name), `createdBy`
  - [ ] 🟥 `allTestCases`: add `requirement` (SR title via TPV->TP->SR), `executedBy`, `executedAt`
  - [ ] 🟥 `uncoveredSubRequirements`: add `parentStatus` (PR status), `team`
  - [ ] 🟥 `untestedProcedures`: add `requirement` (SR title), `team`
  - [ ] 🟥 Helper function: `batchFetchCreators(entityType, entityIds)` - queries AuditLog for CREATE actions and returns a map of entityId -> actorName

- [ ] 🟥 **Step 2: Add new aggregation query types** `[parallel]` -> delivers: new queryType enum values for aggregated/filtered views
  - [ ] 🟥 `testResultSummary`: pass/fail/blocked/pending counts grouped by procedure (use cases #7, #11)
  - [ ] 🟥 `coverageByTeam`: SR count, TP count, uncovered count per team (use cases #6, #14)
  - [ ] 🟥 `testCasesForRequirement`: flattened TC list for a given PR ID, skipping intermediate layers (use case #18). Add `requirementId` optional input param.
  - [ ] 🟥 `recentApprovals`: entities approved within N days, with entity title + approver (use case #10). Add `days` optional input param.
  - [ ] 🟥 `userActivity`: recent audit entries enriched with entity titles instead of raw IDs (use cases #9, #19). Add `actorName` optional input param.

- [ ] 🟥 **Step 3: Update system prompt** `[sequential]` -> depends on: Steps 1, 2
  - [ ] 🟥 Document new query types and their purpose in the system prompt's tool guidance section
  - [ ] 🟥 Add examples of when to use aggregation queries vs. enriched list queries
  - [ ] 🟥 Guide the LLM to prefer panel tables over chat text for cross-entity questions

- [ ] 🟥 **Step 4: Manual testing against use cases** `[sequential]` -> depends on: Steps 1, 2, 3
  - [ ] 🟥 Test Tier 1 use cases (5 scenarios) in the chat UI
  - [ ] 🟥 Test Tier 2 use cases (6 scenarios)
  - [ ] 🟥 Verify existing queries still work (no regressions)
  - [ ] 🟥 Document any use cases that still fall short

## Outcomes
<!-- Fill in after execution -->
