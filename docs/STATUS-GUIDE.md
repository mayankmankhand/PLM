# Status Guide

How statuses and lifecycle transitions work in the PLM system.

## Requirements (Product Requirements & Sub-Requirements)

| Status | Meaning | What you can do |
|--------|---------|-----------------|
| **DRAFT** | Work in progress, not yet finalized | Edit freely, then approve when ready |
| **APPROVED** | Finalized and locked for edits | Create sub-requirements or test procedures against it. Cancel if no longer needed |
| **CANCELED** | No longer relevant | Nothing - this is a terminal state |

**Flow:** DRAFT -> APPROVED -> CANCELED

**Rules:**
- Sub-requirements can only be approved when their parent product requirement is already approved
- You cannot edit a requirement after it's approved - create a new one instead
- Canceling is permanent and cannot be undone

## Test Procedures

Test procedures use **two-entity versioning**: a logical procedure (the container) and immutable version snapshots (the content).

### Procedure (container)

| Status | Meaning |
|--------|---------|
| **ACTIVE** | The procedure is in use |
| **CANCELED** | The procedure is retired |

### Procedure Version (content snapshot)

| Status | Meaning | What you can do |
|--------|---------|-----------------|
| **DRAFT** | Version is being written | Edit description and steps, then approve when ready |
| **APPROVED** | Version is locked and ready for testing | Create test cases against it. Cannot be edited |

**Flow:** DRAFT -> APPROVED (per version)

**Rules:**
- Only one draft version is allowed per procedure at a time
- Approving a version locks it permanently - to make changes, create a new version
- You cannot create versions on a canceled procedure

## Test Cases

| Status | Meaning | What you can do |
|--------|---------|-----------------|
| **PENDING** | Waiting to be executed | Record a result (PASS or FAIL) or skip it |
| **PASSED** | Test executed successfully | Done |
| **FAILED** | Test found a defect | Done |
| **BLOCKED** | Cannot execute due to external dependency | Record a result when unblocked |
| **SKIPPED** | Intentionally not executed | Nothing - this is a terminal state |

**Rules:**
- Test cases can only be created against approved procedure versions
- Recording a result (PASS/FAIL) changes the status automatically
- Skipping a test case is permanent

## Audit Actions

Every change in the system is logged. Here's what each audit action means:

| Action | When it's logged |
|--------|-----------------|
| CREATE | A new entity is created |
| UPDATE | A draft entity is edited |
| APPROVE | A draft is approved (locked) |
| CANCEL | An entity is canceled (retired) |
| SKIP | A test case is skipped |
| CREATE_VERSION | A new version is created on a test procedure |
| RECORD_RESULT | A test result (PASS/FAIL) is recorded |
| ADD_ATTACHMENT | A file is attached to an entity |
| REMOVE_ATTACHMENT | A file attachment is removed |
