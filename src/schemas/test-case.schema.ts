import { z } from "zod";

// ─── Create ────────────────────────────────────────────
// A test case is tied to a specific TestProcedureVersion.

export const CreateTestCaseInput = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
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

// ─── Invalidate ────────────────────────────────────────
// Marks a test case as invalid (e.g., the procedure version changed).

export const InvalidateTestCaseInput = z.object({
  confirmInvalidate: z.literal(true, {
    errorMap: () => ({ message: "confirmInvalidate must be true" }),
  }),
});

export type InvalidateTestCaseInput = z.infer<typeof InvalidateTestCaseInput>;
