-- Rename status enum values across all enums.
-- PostgreSQL requires: add new value, update rows, remove old value.

-- RequirementStatus: PUBLISHED -> APPROVED, OBSOLETE -> CANCELED
ALTER TYPE "RequirementStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "RequirementStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

-- ProcedureStatus: OBSOLETE -> CANCELED
ALTER TYPE "ProcedureStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

-- ProcedureVersionStatus: PUBLISHED -> APPROVED
ALTER TYPE "ProcedureVersionStatus" ADD VALUE IF NOT EXISTS 'APPROVED';

-- TestCaseStatus: INVALIDATED -> SKIPPED
ALTER TYPE "TestCaseStatus" ADD VALUE IF NOT EXISTS 'SKIPPED';

-- AuditAction: PUBLISH -> APPROVE, OBSOLETE -> CANCEL, INVALIDATE -> SKIP
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'APPROVE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'CANCEL';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SKIP';

-- Update existing data to use new values (using actual table names from @@map)
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

-- Now remove old values by recreating enums without them.
-- PostgreSQL doesn't support DROP VALUE, so we recreate the type.

-- RequirementStatus
ALTER TYPE "RequirementStatus" RENAME TO "RequirementStatus_old";
CREATE TYPE "RequirementStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELED');
ALTER TABLE "product_requirements" ALTER COLUMN status TYPE "RequirementStatus" USING status::text::"RequirementStatus";
ALTER TABLE "sub_requirements" ALTER COLUMN status TYPE "RequirementStatus" USING status::text::"RequirementStatus";
ALTER TABLE "product_requirements" ALTER COLUMN status SET DEFAULT 'DRAFT'::"RequirementStatus";
ALTER TABLE "sub_requirements" ALTER COLUMN status SET DEFAULT 'DRAFT'::"RequirementStatus";
DROP TYPE "RequirementStatus_old";

-- ProcedureStatus
ALTER TYPE "ProcedureStatus" RENAME TO "ProcedureStatus_old";
CREATE TYPE "ProcedureStatus" AS ENUM ('ACTIVE', 'CANCELED');
ALTER TABLE "test_procedures" ALTER COLUMN status TYPE "ProcedureStatus" USING status::text::"ProcedureStatus";
ALTER TABLE "test_procedures" ALTER COLUMN status SET DEFAULT 'ACTIVE'::"ProcedureStatus";
DROP TYPE "ProcedureStatus_old";

-- ProcedureVersionStatus
ALTER TYPE "ProcedureVersionStatus" RENAME TO "ProcedureVersionStatus_old";
CREATE TYPE "ProcedureVersionStatus" AS ENUM ('DRAFT', 'APPROVED');
ALTER TABLE "test_procedure_versions" ALTER COLUMN status TYPE "ProcedureVersionStatus" USING status::text::"ProcedureVersionStatus";
ALTER TABLE "test_procedure_versions" ALTER COLUMN status SET DEFAULT 'DRAFT'::"ProcedureVersionStatus";
DROP TYPE "ProcedureVersionStatus_old";

-- TestCaseStatus
ALTER TYPE "TestCaseStatus" RENAME TO "TestCaseStatus_old";
CREATE TYPE "TestCaseStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED');
ALTER TABLE "test_cases" ALTER COLUMN status TYPE "TestCaseStatus" USING status::text::"TestCaseStatus";
ALTER TABLE "test_cases" ALTER COLUMN status SET DEFAULT 'PENDING'::"TestCaseStatus";
DROP TYPE "TestCaseStatus_old";

-- AuditAction
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'APPROVE', 'CANCEL', 'SKIP', 'ADD_ATTACHMENT', 'REMOVE_ATTACHMENT', 'CREATE_VERSION', 'RECORD_RESULT');
ALTER TABLE "audit_logs" ALTER COLUMN action TYPE "AuditAction" USING action::text::"AuditAction";
DROP TYPE "AuditAction_old";
