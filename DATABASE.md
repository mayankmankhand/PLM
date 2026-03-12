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
| RequirementStatus | `DRAFT`, `APPROVED`, `CANCELED` |
| ProcedureStatus | `ACTIVE`, `CANCELED` |
| ProcedureVersionStatus | `DRAFT`, `APPROVED` |
| TestCaseStatus | `PENDING`, `PASSED`, `FAILED`, `BLOCKED`, `SKIPPED` |
| TestCaseResult | `PASS`, `FAIL`, `BLOCKED`, `SKIPPED` |
| AuditAction | `CREATE`, `UPDATE`, `APPROVE`, `CANCEL`, `SKIP`, `ADD_ATTACHMENT`, `REMOVE_ATTACHMENT`, `CREATE_VERSION`, `RECORD_RESULT` |
| AttachmentStatus | `ACTIVE`, `REMOVED` |
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
| created_by | UUID (FK) | References User |
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
| created_by | UUID (FK) | References User |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

### TestProcedure

| Column | Type | Notes |
|--------|------|-------|
| id | UUID (PK) | Auto-generated |
| title | String | |
| status | ProcedureStatus | Default: ACTIVE |
| sub_requirement_id | UUID (FK) | References SubRequirement |
| created_by | UUID (FK) | References User |
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
| created_by | UUID (FK) | References User |
| created_at | DateTime | Auto-set |
| updated_at | DateTime | Auto-updated |

**Unique constraint**: (test_procedure_id, version_number) - no duplicate version numbers per procedure.

**Partial unique index**: Only one DRAFT version per procedure - `WHERE status = 'DRAFT'`.

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
| executed_by | UUID? (FK) | References User (nullable) |
| executed_at | DateTime? | When the test was run |
| created_by | UUID (FK) | References User |
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
| status | AttachmentStatus | Default: ACTIVE. Soft-delete sets to REMOVED. |
| product_requirement_id | UUID? (FK) | Exactly one of these four FKs is non-null |
| sub_requirement_id | UUID? (FK) | (enforced by DB CHECK constraint) |
| test_procedure_id | UUID? (FK) | |
| test_case_id | UUID? (FK) | |
| uploaded_by | UUID (FK) | References User |
| created_at | DateTime | Auto-set |

**CHECK constraint**: Exactly one parent FK must be non-null (exclusive arc enforced at DB level).

**Soft-delete**: `removeAttachment()` sets `status: REMOVED` instead of deleting the row. All queries filter by `status: ACTIVE`.

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

## Custom Database Constraints

Prisma's schema language cannot express partial unique indexes or CHECK constraints. These protections exist in the database but are maintained outside the Prisma schema file.

### What Prisma Can't Model

| Constraint | Type | Purpose |
|-----------|------|---------|
| `test_procedure_versions_single_draft` | Partial unique index (`WHERE status = 'DRAFT'`) | Enforces at most one DRAFT version per test procedure |
| `attachments_exclusive_parent` | CHECK constraint | Ensures exactly one parent FK is non-null (exclusive arc) |

### How They Are Applied

- **Dev database**: Applied manually via `prisma db execute` after `prisma db push`
- **Test database**: Applied automatically by `vitest.global-setup.ts` (idempotent `IF NOT EXISTS` guards)
- **New environments**: Must run the SQL below after initial schema setup

### SQL for New Environments

```sql
-- Single-draft-per-procedure (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS "test_procedure_versions_single_draft"
  ON "test_procedure_versions" ("test_procedure_id")
  WHERE status = 'DRAFT';

-- Exclusive arc for attachments (exactly one parent FK non-null)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attachments_exclusive_parent'
  ) THEN
    ALTER TABLE "attachments" ADD CONSTRAINT "attachments_exclusive_parent"
      CHECK (
        (
          CASE WHEN product_requirement_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN sub_requirement_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN test_procedure_id IS NOT NULL THEN 1 ELSE 0 END +
          CASE WHEN test_case_id IS NOT NULL THEN 1 ELSE 0 END
        ) = 1
      );
  END IF;
END $$;
```

### Verifying Constraints Exist

```sql
-- Check partial unique index
SELECT indexname FROM pg_indexes
WHERE tablename = 'test_procedure_versions'
  AND indexname = 'test_procedure_versions_single_draft';

-- Check exclusive arc constraint
SELECT conname FROM pg_constraint
WHERE conname = 'attachments_exclusive_parent';
```

### Soft-Delete Convention

All attachment read paths must filter by `status: ACTIVE` to exclude soft-deleted records. Use the shared `ACTIVE_ATTACHMENT_FILTER` constant from `src/lib/prisma.ts`:

```ts
import { ACTIVE_ATTACHMENT_FILTER } from "@/lib/prisma";

// In Prisma include/where clauses:
attachments: { where: ACTIVE_ATTACHMENT_FILTER }
```

### Known Limitation

The Prisma migration history does not include these custom constraints. The schema was applied via `prisma db push` (not `prisma migrate dev`) due to checksum drift on a prior migration. This means `prisma migrate deploy` alone will not create a complete database. See Issue #19 for the planned resolution.

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

### Users (6, Friends cast)

| Name | Email | Role | Team |
|------|-------|------|------|
| Monica Geller | monica@example.com | engineer | Hardware |
| Ross Geller | ross@example.com | engineer | Algorithm |
| Rachel Green | rachel@example.com | engineer | App |
| Chandler Bing | chandler@example.com | engineer | Electrical |
| Joey Tribbiani | joey@example.com | engineer | Mechanical |
| Phoebe Buffay | phoebe@example.com | engineer | Testing |

### Requirement Hierarchy

```
PR1: Continuous Heart Rate Monitoring [APPROVED]
  SR1.1: HR Sensor Hardware Integration [APPROVED] -> Hardware (Monica)
    TP1: Sensor Data Availability [ACTIVE]
      TPV1 v1 [APPROVED] -> TC1: HR samples continuously [PASSED]
      TPV1B v2 [DRAFT] -> TC19: Sensor warmup 10s [PENDING]
  SR1.2: HR Calculation Algorithm [APPROVED] -> Algorithm (Ross)
    TP2: Algorithm Accuracy Validation [ACTIVE]
      TPV2 [APPROVED] -> TC2: HR accuracy tolerance [PASSED]

PR2: Outdoor Activity GPS Tracking [APPROVED]
  SR2.1: GPS Hardware Receiver [APPROVED] -> Electrical (Chandler)
    TP3: GPS Signal Acquisition [ACTIVE]
      TPV3 [APPROVED] -> TC3: GPS lock 60s [PASSED]
  SR2.2: Workout Route Recording [APPROVED] -> App (Rachel)
    TP4: Route Recording Verification [ACTIVE]
      TPV4 [APPROVED] -> TC4: Route displayed [PENDING]

PR3: Battery Life [APPROVED]
  SR3.1: Battery Capacity and Power Delivery [APPROVED] -> Electrical (Chandler)
    TP5: Battery Runtime Test [ACTIVE]
      TPV5 [APPROVED] -> TC5: Battery 24hr [FAILED]
                       -> TC20: GPS power draw [PENDING]
  SR3.2: Power Management Firmware [APPROVED] -> Algorithm (Ross)
    TP6: Power Management Validation [ACTIVE]
      TPV6 [APPROVED] -> TC6: Power draw idle [PASSED]

PR4: Water Resistance [APPROVED]
  SR4.1: Waterproof Mechanical Sealing [APPROVED] -> Mechanical (Joey)
    TP7: Water Pressure Test [ACTIVE]
      TPV7 [APPROVED] -> TC7: Water 50m [PASSED]
  SR4.2: Button and Crown Seal [APPROVED] -> Mechanical (Joey)
    TP8: Button Seal Integrity Test [ACTIVE]
      TPV8 [APPROVED] -> TC8: Button seal [PENDING]

PR5: Smartphone Notification Mirroring [CANCELED]
  SR5.1: Notification Delivery and Display [CANCELED] -> App (Rachel)
    TP9: Notification Delivery Test [CANCELED]
      TPV9 [APPROVED] -> TC9: Notification 3s [SKIPPED]

PR6: Sleep Tracking and Analysis [APPROVED]
  SR6.1: Sleep Stage Detection Algorithm [APPROVED] -> Algorithm (Ross)
    TP10: Sleep Stage Accuracy Test [ACTIVE]
      TPV10 [APPROVED] -> TC10: Sleep stages [PASSED]
  SR6.2: Sleep Data Visualization [APPROVED] -> App (Rachel)
    TP11: Sleep Dashboard Rendering Test [ACTIVE]
      TPV11 [APPROVED] -> TC11: Sleep dashboard [PENDING]

PR7: ECG Heart Rhythm Detection [DRAFT]
  SR7.1: ECG Sensor Hardware [DRAFT] -> Hardware (Monica) -- no TP
  SR7.2: ECG Signal Processing [DRAFT] -> Algorithm (Ross) -- no TP

PR8: NFC Contactless Payments [APPROVED]
  SR8.1: NFC Antenna and Controller [APPROVED] -> Electrical (Chandler)
    TP12: NFC Range and Reliability Test [ACTIVE]
      TPV12 [APPROVED] -> TC12: NFC range 4cm [PASSED]
  SR8.2: Payment App Integration [APPROVED] -> App (Rachel)
    TP13: Payment End-to-End Flow Test [ACTIVE]
      TPV13 [APPROVED] -> TC13: Payment e2e [BLOCKED]

PR9: Fall Detection and Emergency SOS [APPROVED]
  SR9.1: Accelerometer Calibration [APPROVED] -> Hardware (Monica)
    TP14: Drop Test Calibration [ACTIVE]
      TPV14 [APPROVED] -> TC14: Drop test [PASSED]
  SR9.2: Fall Detection Algorithm [APPROVED] -> Algorithm (Ross)
    TP15: Fall Detection Sensitivity Test [ACTIVE]
      TPV15 [APPROVED] -> TC15: Fall detection [FAILED]
  SR9.3: Emergency SOS UI [APPROVED] -> App (Rachel)
    TP16: SOS Alert Trigger Test [ACTIVE]
      TPV16 [APPROVED] -> TC16: SOS alert [PENDING]

PR10: Ambient Light and UV Sensor [APPROVED]
  SR10.1: Light Sensor Module [APPROVED] -> Hardware (Monica)
    TP17: Light Sensor Linearity Test [ACTIVE]
      TPV17 [APPROVED] -> TC17: Light sensor [PASSED]
  SR10.2: UV Index Calculation [APPROVED] -> Algorithm (Ross)
    TP18: UV Index Validation Test [ACTIVE]
      TPV18 [DRAFT] -> TC18: UV index [PENDING]
  SR10.3: Auto-Brightness Controller [DRAFT] -> Electrical (Chandler)
    (no TP - coverage gap)
```

### Demo Scenarios

| Scenario | Where to find it |
|----------|-----------------|
| Multi-version procedure | TP1 has v1 (APPROVED) + v2 (DRAFT) |
| Coverage gap | SR7.1, SR7.2 (DRAFT PR), SR10.3 (no TP) |
| Failed test | TC5 (battery 18.5hr vs 24hr), TC15 (fall detection false positives) |
| Blocked test | TC13 (waiting on bank sandbox) |
| Skipped test | TC9 (parent PR canceled) |
| Cancellation cascade | PR5 -> SR5.1 -> TP9 -> TC9 |
| Multiple TCs per version | TPV5 has TC5 + TC20 |
| Attachments | 6 files across PR, SR, TP, TC entities |

### Status Distribution

| Entity Type | Status Counts |
|-------------|--------------|
| Product Requirements (10) | 7 APPROVED, 1 CANCELED, 2 DRAFT |
| Sub-Requirements (21) | 15 APPROVED, 1 CANCELED, 5 DRAFT |
| Test Procedures (18) | 17 ACTIVE, 1 CANCELED |
| Procedure Versions (19) | 16 APPROVED, 3 DRAFT |
| Test Cases (20) | 8 PASSED, 2 FAILED, 7 PENDING, 1 BLOCKED, 1 SKIPPED |

### Audit Log Timeline

Anchor date: 2026-02-01. All 6 users participate across the timeline.

| Days | Actors | Activity |
|------|--------|----------|
| 0-2 | Monica, Chandler, Joey, Rachel, Ross | Create and approve 10 product requirements |
| 3-6 | All 6 | Create and approve 21 sub-requirements |
| 7-10 | Phoebe, Joey, Chandler, Ross, Rachel, Monica | Create 18 test procedures and 19 versions |
| 11-13 | All 6 | Create 20 test cases |
| 14-18 | All 6 | Execute tests (8 PASS, 2 FAIL, 1 BLOCKED, 1 SKIP) |
| 19 | Monica, Phoebe | Cancel PR5 cascade (PR -> SR -> TP -> TC) |
| 20 | Phoebe, Chandler | Create TP1 v2 (DRAFT) + investigation TC for battery failure |

Total: 155 audit log entries.

### Attachments (6)

| File | Type | Attached to |
|------|------|-------------|
| hr-sensor-datasheet.pdf | DOCUMENT | PR1 (Heart Rate) |
| gps-test-route-map.png | IMAGE | TC3 (GPS lock) |
| battery-test-results.xlsx | SPREADSHEET | TC5 (Battery failure) |
| waterproof-seal-diagram.png | IMAGE | SR4.1 (Waterproof Sealing) |
| nfc-certification-report.pdf | DOCUMENT | TP12 (NFC Range) |
| fall-detection-false-positives.xlsx | SPREADSHEET | TC15 (Fall detection failure) |
