-- Rename status enum values across all enums.
-- Strategy: drop defaults, convert columns to text, drop old enums,
-- update text data, create new enums, cast back, restore defaults.

-- Step 1: Drop column defaults (they reference the enum types)
ALTER TABLE "product_requirements" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "sub_requirements" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "test_procedures" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "test_procedure_versions" ALTER COLUMN status DROP DEFAULT;
ALTER TABLE "test_cases" ALTER COLUMN status DROP DEFAULT;

-- Step 2: Convert all enum columns to text
ALTER TABLE "product_requirements" ALTER COLUMN status TYPE text;
ALTER TABLE "sub_requirements" ALTER COLUMN status TYPE text;
ALTER TABLE "test_procedures" ALTER COLUMN status TYPE text;
ALTER TABLE "test_procedure_versions" ALTER COLUMN status TYPE text;
ALTER TABLE "test_cases" ALTER COLUMN status TYPE text;
ALTER TABLE "audit_logs" ALTER COLUMN action TYPE text;

-- Step 3: Drop old enum types (now safe, no dependencies)
DROP TYPE "RequirementStatus";
DROP TYPE "ProcedureStatus";
DROP TYPE "ProcedureVersionStatus";
DROP TYPE "TestCaseStatus";
DROP TYPE "AuditAction";

-- Step 4: Update text values to new names
UPDATE "product_requirements" SET status = 'APPROVED' WHERE status = 'PUBLISHED';
UPDATE "product_requirements" SET status = 'CANCELED' WHERE status = 'OBSOLETE';

UPDATE "sub_requirements" SET status = 'APPROVED' WHERE status = 'PUBLISHED';
UPDATE "sub_requirements" SET status = 'CANCELED' WHERE status = 'OBSOLETE';

UPDATE "test_procedures" SET status = 'CANCELED' WHERE status = 'OBSOLETE';

UPDATE "test_procedure_versions" SET status = 'APPROVED' WHERE status = 'PUBLISHED';

UPDATE "test_cases" SET status = 'SKIPPED' WHERE status = 'INVALIDATED';

UPDATE "audit_logs" SET action = 'APPROVE' WHERE action = 'PUBLISH';
UPDATE "audit_logs" SET action = 'CANCEL' WHERE action = 'OBSOLETE';
UPDATE "audit_logs" SET action = 'SKIP' WHERE action = 'INVALIDATE';

-- Step 5: Create new enum types with renamed values
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELED');
CREATE TYPE "ProcedureStatus" AS ENUM ('ACTIVE', 'CANCELED');
CREATE TYPE "ProcedureVersionStatus" AS ENUM ('DRAFT', 'APPROVED');
CREATE TYPE "TestCaseStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'APPROVE', 'CANCEL', 'SKIP', 'ADD_ATTACHMENT', 'REMOVE_ATTACHMENT', 'CREATE_VERSION', 'RECORD_RESULT');

-- Step 6: Cast text columns back to enum types and restore defaults
ALTER TABLE "product_requirements" ALTER COLUMN status TYPE "RequirementStatus" USING status::"RequirementStatus";
ALTER TABLE "product_requirements" ALTER COLUMN status SET DEFAULT 'DRAFT'::"RequirementStatus";

ALTER TABLE "sub_requirements" ALTER COLUMN status TYPE "RequirementStatus" USING status::"RequirementStatus";
ALTER TABLE "sub_requirements" ALTER COLUMN status SET DEFAULT 'DRAFT'::"RequirementStatus";

ALTER TABLE "test_procedures" ALTER COLUMN status TYPE "ProcedureStatus" USING status::"ProcedureStatus";
ALTER TABLE "test_procedures" ALTER COLUMN status SET DEFAULT 'ACTIVE'::"ProcedureStatus";

ALTER TABLE "test_procedure_versions" ALTER COLUMN status TYPE "ProcedureVersionStatus" USING status::"ProcedureVersionStatus";
ALTER TABLE "test_procedure_versions" ALTER COLUMN status SET DEFAULT 'DRAFT'::"ProcedureVersionStatus";

ALTER TABLE "test_cases" ALTER COLUMN status TYPE "TestCaseStatus" USING status::"TestCaseStatus";
ALTER TABLE "test_cases" ALTER COLUMN status SET DEFAULT 'PENDING'::"TestCaseStatus";

ALTER TABLE "audit_logs" ALTER COLUMN action TYPE "AuditAction" USING action::"AuditAction";
