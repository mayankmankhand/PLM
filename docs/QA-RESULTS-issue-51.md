# Manual DB Integration Walkthrough - Results

**Issue:** #51
**Date:** 2026-03-16
**Method:** User runs operations in chat UI, Claude verifies DB state via Prisma queries
**Baseline:** Seed data reset before starting (10 PRs, 21 SRs, 18 TPs, 19 TPVs, 20 TCs, 6 attachments, 155 audit entries)

---

## Summary

| Metric | Value |
|--------|-------|
| Scenarios executed | 10 |
| Total DB checks | 93 |
| Checks passed | 92 |
| Checks failed | 1 |
| Bugs found | 3 |
| Issues filed | 4 (#57, #58, #60, #61) |

---

## Scenario Results

### Scenario 1: Full Lifecycle Happy Path - ALL PASS

**What was tested:** Create PR -> 3 SRs -> 3 TPs (with versions) -> 3 TCs -> approve chain -> execute TCs

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| PR created and APPROVED | APPROVED | APPROVED | PASS |
| 3 SRs created, all APPROVED | 3 APPROVED | 3 APPROVED | PASS |
| 3 TPs created, all ACTIVE | 3 ACTIVE | 3 ACTIVE | PASS |
| E2E TPV v1 APPROVED, others DRAFT | 1 APPROVED, 2 DRAFT | match | PASS |
| TC results: 1 PASS, 1 FAIL, 1 BLOCKED | match | match | PASS |
| Audit: PR (CREATE+UPDATE+APPROVE=3) | 3 | 3 | PASS |
| Audit: SRs (3xCREATE+3xAPPROVE=6) | 6 | 6 | PASS |
| Audit: TPs (3xCREATE=3) | 3 | 3 | PASS |
| Audit: TPVs (1xAPPROVE=1) | 1 | 1 | PASS |
| Audit: TCs (3xCREATE+3xRECORD=6) | 6 | 6 | PASS |

**Learning:** Initial TPV creation is audited under the TestProcedure entity (action: CREATE), not as a separate TPV entry. CREATE_VERSION only appears for v2+.

---

### Scenario 2: Editing at Every Status - ALL PASS

**What was tested:** Edit DRAFT entity, edit APPROVED entity, attempt edit on CANCELED entity (blocked), reactivate + edit + approve

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| DRAFT edit (ECG PR description) | updated | updated | PASS |
| APPROVED edit (Hindi PR description) | updated | updated | PASS |
| CANCELED edit blocked | refused | refused | PASS |
| Reactivated PR title/description updated | updated | updated | PASS |
| Reactivated PR now APPROVED | APPROVED | APPROVED | PASS |
| Cascade reactivation of child SR | DRAFT | DRAFT | PASS |
| Audit: full lifecycle trail | CREATE->APPROVE->CANCEL->REACTIVATE->UPDATE->APPROVE | match | PASS |

---

### Scenario 3: Version Management - ALL PASS (1 bug found)

**What was tested:** Update existing draft v2, approve v2 (locks steps), create v3, edit approved v2 description (works), edit approved v2 steps (blocked)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Single-draft rule enforced | blocked new v2 | offered update instead | PASS |
| v2 updated and approved | APPROVED | APPROVED | PASS |
| v3 created as new draft | DRAFT | DRAFT | PASS |
| Approved v2 description editable | updated to "B2" | updated | PASS |
| Approved v2 steps locked | blocked | blocked | PASS |

**BUG:** User said "No, cancel" (meaning "nevermind"), AI interpreted it as "cancel the entity" and canceled the entire test procedure with cascade. Filed as **#57**.

---

### Scenario 4: Cancel with Cascade - ALL PASS

**What was tested:** Cancel APPROVED PR "Outdoor Activity GPS Tracking", verify full cascade

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| PR CANCELED | CANCELED | CANCELED | PASS |
| 2 SRs CANCELED | all CANCELED | all CANCELED | PASS |
| 2 TPs CANCELED | all CANCELED | all CANCELED | PASS |
| 2 TCs SKIPPED | all SKIPPED | all SKIPPED | PASS |
| TPVs unchanged (immutable) | APPROVED | APPROVED | PASS |
| Audit: CANCEL on PR + 2 SRs + 2 TPs | present | present | PASS |
| Audit: SKIP on 2 TCs | present | present | PASS |

---

### Scenario 5: Reactivate with Cascade - 10/11 PASS (1 bug found)

**What was tested:** Reactivate the canceled PR from S4, verify cascade restoration

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| PR -> DRAFT | DRAFT | DRAFT | PASS |
| 2 SRs -> DRAFT | all DRAFT | all DRAFT | PASS |
| 2 TPs -> ACTIVE | all ACTIVE | all ACTIVE | PASS |
| 2 TCs -> PENDING | all PENDING | all PENDING | PASS |
| TC result cleared | null | PASS (stale!) | **FAIL** |
| Audit: REACTIVATE on all entities | present | present | PASS |

**BUG:** Reactivation resets TC status to PENDING but does NOT clear the previous `result` field. A PENDING TC with result=PASS is a data inconsistency. Filed as **#58**.

---

### Scenario 6: Re-parent Operations - ALL PASS

**What was tested:** Move SR to different PR, move TP to different SR

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| APPROVED SR -> DRAFT PR blocked | refused | correctly refused | PASS |
| SR moved to ECG PR | ECG PR ID | match | PASS |
| SR status preserved | APPROVED | APPROVED | PASS |
| SR team preserved | Hardware | Hardware | PASS |
| Source PR lost SR | 2 remaining | 2 remaining | PASS |
| TP moved to Voice Input SR | Voice Input SR ID | match | PASS |
| TP status preserved | ACTIVE | ACTIVE | PASS |
| Source SR lost TP | 2 remaining | 2 remaining | PASS |
| Audit: RE_PARENT with from/to changes | present | present | PASS |

---

### Scenario 7: Test Case Recovery - ALL PASS

**What was tested:** Correct result, re-execute, update notes

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Correct: FAIL -> PASS with notes | PASSED, PASS, notes set | match | PASS |
| Re-execute: FAIL -> PENDING (all fields cleared) | PENDING, null result/notes/executor/executedAt | all cleared | PASS |
| Update notes: status/result unchanged, notes set | PASSED, PASS, notes set | match | PASS |
| Audit: CORRECT_RESULT | present | present | PASS |
| Audit: RE_EXECUTE | present | present | PASS |
| Audit: UPDATE_NOTES | present | present | PASS |

**Observation:** Re-execute properly clears ALL execution fields. This is the correct behavior that reactivation (#58) is missing.

---

### Scenario 8: Attachments - ALL PASS

**What was tested:** Add attachments to PR and TC, remove attachment (soft-delete), attach to CANCELED entity (blocked)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Attachment on PR: REMOVED (soft-delete) | REMOVED, record exists | match | PASS |
| Attachment on TC: ACTIVE | ACTIVE on correct TC | match | PASS |
| Attachment on TP: ACTIVE | ACTIVE | ACTIVE | PASS |
| CANCELED entity attachment blocked | refused | refused | PASS |
| Exclusive arc: 1 FK per attachment | 1 each | 1 each | PASS |
| Audit: 3 ADD_ATTACHMENT + 1 REMOVE_ATTACHMENT | present | present | PASS |
| Totals: 9 attachments (8 ACTIVE, 1 REMOVED) | match | match | PASS |

---

### Scenario 9: Blocked Operations (Negative Tests) - 2/2 PASS, 2 deferred

**What was tested:** Approve SR under DRAFT PR (blocked), cancel DRAFT PR with children (blocked)

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Approve SR under DRAFT PR | blocked | blocked | PASS |
| Cancel DRAFT PR with children | blocked | blocked | PASS |
| Edit SKIPPED TC | blocked | not tested | deferred |
| Re-parent CANCELED entity | blocked | not tested | deferred |

**BUG:** AI got stuck in a response loop when explaining the SR approval block, generating duplicate message IDs. Filed as **#60**.
**Follow-up:** 2 untested negative cases filed as **#61** (depends on #60).

---

### Scenario 10: Mixed Realistic Workflow - ALL PASS

**What was tested:** Full fast-track lifecycle: create PR -> approve -> create SR -> approve -> create TP -> approve TPV -> create TC -> record FAIL -> correct to PASS

| Check | Expected | Actual | Result |
|-------|----------|--------|--------|
| Full entity chain created | all present | all present | PASS |
| TC: FAILED then corrected to PASSED | PASSED, PASS | match | PASS |
| Corrected notes | "82%" | present | PASS |
| Audit: CREATE->RECORD_RESULT->CORRECT_RESULT | match | match | PASS |
| PR audit: CREATE->APPROVE | match | match | PASS |

---

## Bugs Filed

| Issue | Severity | Description |
|-------|----------|-------------|
| [#57](https://github.com/mayankmankhand/PLM/issues/57) | High | AI misinterprets conversational "cancel" as domain cancel command |
| [#58](https://github.com/mayankmankhand/PLM/issues/58) | Medium | Reactivation does not clear stale test result on TCs |
| [#60](https://github.com/mayankmankhand/PLM/issues/60) | Medium | Duplicate React keys in message-list during AI response loops |
| [#61](https://github.com/mayankmankhand/PLM/issues/61) | Low | 2 untested negative cases (deferred, depends on #60) |

## Final DB State

| Entity | Baseline | Final | Delta |
|--------|----------|-------|-------|
| Product Requirements | 10 | 12 | +2 |
| Sub-Requirements | 21 | 25 | +4 |
| Test Procedures | 18 | 22 | +4 |
| Test Procedure Versions | 19 | 24 | +5 |
| Test Cases | 20 | 24 | +4 |
| Attachments | 6 | 9 | +3 |
| Audit Entries | 155 | 222 | +67 |
