# PLM Database Structure & Seed Data

## Entity Relationship

```
Team
 └── User (many)
 └── SubRequirement (many)

ProductRequirement
 └── SubRequirement (many)
      └── TestProcedure (many)
           └── TestProcedureVersion (many)
                └── TestCase (many)

Attachment (Exclusive Arc - exactly one parent FK is non-null)
 ├── ProductRequirement?
 ├── SubRequirement?
 ├── TestProcedure?
 └── TestCase?

AuditLog
 └── User (actor)
```

---

## Enums

| Enum | Values |
|------|--------|
| RequirementStatus | `DRAFT`, `PUBLISHED`, `OBSOLETE` |
| ProcedureStatus | `ACTIVE`, `OBSOLETE` |
| ProcedureVersionStatus | `DRAFT`, `PUBLISHED` |
| TestCaseStatus | `PENDING`, `PASSED`, `FAILED`, `BLOCKED`, `INVALIDATED` |
| TestCaseResult | `PASS`, `FAIL`, `BLOCKED`, `SKIPPED` |
| AuditAction | `CREATE`, `UPDATE`, `PUBLISH`, `OBSOLETE`, `INVALIDATE`, `ADD_ATTACHMENT`, `REMOVE_ATTACHMENT`, `CREATE_VERSION`, `RECORD_RESULT` |
| AttachmentType | `DOCUMENT`, `IMAGE`, `SPREADSHEET`, `OTHER` |

---

## Models

### Team

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | String | Unique |
| created_at | DateTime | Auto-set |

### User

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| name | String | |
| email | String | Unique |
| role | String | e.g. "pm", "engineer", "qa_lead" |
| team_id | UUID (FK) | References Team |
| created_at | DateTime | Auto-set |

### ProductRequirement

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| title | String | |
| description | String | |
| status | RequirementStatus | Default: DRAFT |
| created_by | String | User ID who created it |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

### SubRequirement

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| title | String | |
| description | String | |
| status | RequirementStatus | Default: DRAFT |
| product_requirement_id | UUID (FK) | References ProductRequirement |
| team_id | UUID (FK) | References Team |
| created_by | String | User ID who created it |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

### TestProcedure

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| title | String | |
| status | ProcedureStatus | Default: ACTIVE |
| sub_requirement_id | UUID (FK) | References SubRequirement |
| created_by | String | User ID who created it |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

### TestProcedureVersion

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| version_number | Int | |
| description | String | |
| steps | String | Plain text (newline-separated steps) |
| status | ProcedureVersionStatus | Default: DRAFT |
| test_procedure_id | UUID (FK) | References TestProcedure |
| created_by | String | User ID who created it |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

**Unique constraint**: (test_procedure_id, version_number) - no duplicate version numbers per procedure.

### TestCase

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| title | String | |
| description | String | |
| status | TestCaseStatus | Default: PENDING |
| result | TestCaseResult? | Nullable - set when executed |
| notes | String? | Optional execution notes |
| test_procedure_version_id | UUID (FK) | References TestProcedureVersion |
| executed_by | String? | User ID who ran the test |
| executed_at | DateTime? | When the test was run |
| created_by | String | User ID who created it |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

### Attachment (Exclusive Arc)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| file_name | String | |
| file_url | String | |
| file_type | AttachmentType | |
| file_size_bytes | Int? | Optional |
| product_requirement_id | UUID? (FK) | Exactly one of these four FKs is non-null |
| sub_requirement_id | UUID? (FK) | (enforced by Zod at app layer) |
| test_procedure_id | UUID? (FK) | |
| test_case_id | UUID? (FK) | |
| uploaded_by | String | User ID who uploaded |
| created_at | DateTime | Auto-set |

### AuditLog

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| actor_id | UUID (FK) | References User |
| action | AuditAction | |
| entity_type | String | e.g. "ProductRequirement", "TestCase" |
| entity_id | String | UUID of the affected entity |
| source | String | Default: "api" (could be "chat" or "table") |
| request_id | String? | Optional request correlation ID |
| changes | JSON? | Diff of what changed |
| created_at | DateTime | Auto-set |

**Indexes**: (entity_type, entity_id), (actor_id), (created_at)

---

## Seeded Demo Data (Smartwatch PLM)

### Teams (6)

| Name |
|------|
| Electrical |
| Mechanical |
| App |
| Algorithm |
| Hardware |
| Testing |

### Users (3)

| Name | Email | Role | Team |
|------|-------|------|------|
| Alice Chen | alice@example.com | pm | Hardware |
| Bob Smith | bob@example.com | engineer | Electrical |
| Carol Davis | carol@example.com | qa_lead | Testing |

### Requirement Hierarchy

```
PR1: Continuous Heart Rate Monitoring [PUBLISHED]
  SR1.1: HR Sensor Hardware Integration [PUBLISHED] -> Hardware
    TP: Sensor Data Availability [ACTIVE]
      TPV1 [PUBLISHED] -> TC: HR samples generated continuously [PENDING]
  SR1.2: HR Calculation Algorithm [PUBLISHED] -> Algorithm
    TP: Algorithm Accuracy Validation [ACTIVE]
      TPV1 [PUBLISHED] -> TC: HR accuracy within tolerance [PENDING]

PR2: Outdoor Activity GPS Tracking [PUBLISHED]
  SR2.1: GPS Hardware Receiver [PUBLISHED] -> Electrical
    TP: GPS Signal Acquisition [ACTIVE]
      TPV1 [PUBLISHED] -> TC: GPS lock acquired [PASSED]
  SR2.2: Workout Route Recording [PUBLISHED] -> App
    TP: Route Recording Verification [ACTIVE]
      TPV1 [PUBLISHED] -> TC: Route displayed correctly [PENDING]

PR3: Smartwatch Battery Life [PUBLISHED]
  SR3.1: Battery Capacity and Power Delivery [PUBLISHED] -> Electrical
    TP: Battery Runtime Test [ACTIVE]
      TPV1 [PUBLISHED] -> TC: Battery runtime meets minimum [FAILED]

PR4: Water Resistance Capability [PUBLISHED]
  SR4.1: Waterproof Mechanical Sealing [PUBLISHED] -> Mechanical
    TP: Water Pressure Test [ACTIVE]
      TPV1 [PUBLISHED] -> TC: Device functional after pressure test [PENDING]

PR5: Smartphone Notification Display [OBSOLETE]
  SR5.1: Notification Delivery and Display [PUBLISHED] -> App
    TP: Notification Delivery Test [ACTIVE]
      TPV1 [PUBLISHED] -> TC: Notification appears within time [PENDING]

PR6: System Functional Verification [PUBLISHED]
  SR6.1: End-to-End System Validation [DRAFT] -> Testing
    TP: System Integration Test [ACTIVE]
      TPV1 [DRAFT] -> TC: All subsystems operate simultaneously [PENDING]
```

### Status Distribution

| Entity Type | Status Counts |
|-------------|--------------|
| Product Requirements | 5 PUBLISHED, 1 OBSOLETE |
| Sub-Requirements | 7 PUBLISHED, 1 DRAFT |
| Test Procedures | 8 ACTIVE |
| Procedure Versions | 7 PUBLISHED, 1 DRAFT |
| Test Cases | 5 PENDING, 1 PASSED, 1 FAILED, 1 PENDING |

### Audit Log Timeline

Anchor date: 2026-02-01. Follows PM (Alice) -> Engineer (Bob) -> QA (Carol) narrative.

| Days | Actor | Activity |
|------|-------|----------|
| 1-2 | Alice | Creates and publishes all 6 product requirements |
| 3-5 | Alice | Creates and publishes sub-requirements, assigns to teams |
| 6-8 | Carol | Creates test procedures, versions, and test cases |
| 9 | Bob | Executes GPS test (PASS) |
| 10 | Bob | Executes battery test (FAIL) |
| 11 | Alice | Obsoletes PR5 (Notification Mirroring) |

Total: 61 audit log entries.

### Attachments

No attachments are seeded.
