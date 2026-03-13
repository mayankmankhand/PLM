import { z } from "zod";

// ─── Create ────────────────────────────────────────────
// A test case is tied to a specific TestProcedureVersion.

export const CreateTestCaseInput = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required"),
  testProcedureVersionId: z.string().uuid("Must be a valid UUID"),
});

export type CreateTestCaseInput = z.infer<typeof CreateTestCaseInput>;

// ─── Record Result ─────────────────────────────────────
// Records a pass/fail/blocked/skipped result on a test case.
// These values match the TestCaseResult enum in Prisma.

export const RecordTestResultInput = z.object({
  result: z.enum(["PASS", "FAIL", "BLOCKED", "SKIPPED"]),
  notes: z.string().optional(),
});

export type RecordTestResultInput = z.infer<typeof RecordTestResultInput>;

// ─── Skip ──────────────────────────────────────────────
// Marks a test case as skipped (e.g., the procedure version changed).

export const SkipTestCaseInput = z.object({
  confirmSkip: z.literal(true, {
    errorMap: () => ({ message: "confirmSkip must be true" }),
  }),
});

export type SkipTestCaseInput = z.infer<typeof SkipTestCaseInput>;
