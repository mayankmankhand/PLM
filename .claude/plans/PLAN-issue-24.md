# Feature Implementation Plan

**Overall Progress:** `100%`

## TLDR
Enrich `showTable` queries with cross-entity data (creators, parent context, team info, aggregations) so panel tables can answer questions that span multiple entities. Tool-layer only - no panel UI changes needed since `TablePayload` already supports arbitrary columns.

## Goal State
**Current State:** Each `showTable` query type fetches fields from a single entity (plus 1-2 levels of parent/child names). Users asking "show requirements with who created them" or "pass/fail summary by procedure" get chat text or diagram workarounds instead of rich tables.

**Goal State:** Existing query types return richer columns (creator, team, parent status, executor). New query types support aggregations and date-filtered views. The LLM's system prompt guides it to use these capabilities. All 20 identified use cases produce useful panel tables.

## Critical Decisions
- **Enrich existing queries, not add parallel ones** - `allRequirements` always includes creator, rather than a separate `requirementsWithCreator` query. Simpler for the LLM to reason about.
- **Tool-layer only** - `TablePayload` already accepts arbitrary columns/rows. No panel component changes.
- **Use creator FK, not AuditLog** - Every entity has a `createdBy` FK + `creator` relation to User. Simpler and faster than querying AuditLog for CREATE actions. Dropped the planned `batchFetchCreators` helper.
- **New query types for aggregations** - Aggregation queries (pass/fail counts, coverage by team) need new `queryType` enum values since they produce fundamentally different column shapes.
- **Defer recentApprovals and userActivity** - Overlap with existing `showAuditLog` tool; different fetch pattern needed. Deferred to V2.
- **Fetch-16-return-15 truncation** - `isTruncated: boolean` optional field on TablePayload for backward compatibility.

## Use Cases (reference)

**Tier 1 (high impact):** #1 Requirements+creator, #4 Test cases+full lineage, #7 Pass/fail summary, #18 All TCs for a requirement, #9 Activity+entity names
**Tier 2 (valuable):** #3 TCs+executor, #5 SRs+parent status, #6 Open SRs by team, #10 Approved in date range, #14 Coverage by team, #11 Requirements fully passing
**Tier 3 (nice to have):** #2, #8, #12, #13, #15, #16, #17, #19, #20

## Tasks

- [x] 🟩 **Step 1: Enrich existing "all*" queries with cross-entity columns** `[parallel]`
  - [x] 🟩 `allRequirements`: added `createdBy` (via creator relation), `createdAt`
  - [x] 🟩 `allSubRequirements`: added `parentStatus`, `createdBy`, team filter
  - [x] 🟩 `allTestProcedures`: added `productRequirement`, `team`, `createdBy`, team filter
  - [x] 🟩 `allTestCases`: added `subRequirement`, `executedBy`, `executedAt`
  - [x] 🟩 `uncoveredSubRequirements`: added `parentStatus`, `team`
  - [x] 🟩 `untestedProcedures`: added `subRequirement`, `team`
  - [x] 🟩 `searchResults`: added isTruncated flag
  - ~Helper function `batchFetchCreators`~ - dropped (used creator FK relation instead)

- [x] 🟩 **Step 2: Add new aggregation query types** `[parallel]`
  - [x] 🟩 `testResultSummary`: pass/fail/blocked/skipped/pending counts by ACTIVE procedure
  - [x] 🟩 `coverageByTeam`: SR count, TP count, uncovered count per team
  - [x] 🟩 `testCasesForRequirement`: flattened TC list for a given PR ID
  - ~`recentApprovals`~ - deferred to V2 (overlaps with showAuditLog)
  - ~`userActivity`~ - deferred to V2 (overlaps with showAuditLog)

- [x] 🟩 **Step 3: Update system prompt** `[sequential]`
  - [x] 🟩 Documented new query types with categories (list, gap, search, aggregation, filter)
  - [x] 🟩 Added rules for showTable preference, name-to-ID resolution, isTruncated handling

- [x] 🟩 **Step 4: Tests and review fixes** `[sequential]`
  - [x] 🟩 4 schema validation tests (isTruncated, enriched columns, aggregation numerics)
  - [x] 🟩 14 integration tests for aggregation queries
  - [x] 🟩 Review fix: separated SKIPPED from PENDING in testResultSummary
  - [x] 🟩 Review fix: added `take: 16` to coverageByTeam for consistent truncation
  - [x] 🟩 Review fix: added ACTIVE-only inline comment

## Outcomes
- **Changed vs planned:** Used creator FK relations instead of AuditLog queries (simpler). Deferred recentApprovals and userActivity to V2. Added team filter param and isTruncated flag (not in original plan). Separated SKIPPED from PENDING after 3-model review.
- **Key decisions:** Enriching existing queries (not adding parallel ones) proved correct - 10 queryType values is already the upper bound of what the LLM can reason about.
- **Test coverage:** 101 total tests (87 existing + 14 new integration tests for aggregation queries).
- **Files changed:** 4 source files + 2 test files + plan + lessons.
