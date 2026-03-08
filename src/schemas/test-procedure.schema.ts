import { z } from "zod";

// ─── Create Test Procedure ─────────────────────────────
// Creates the logical procedure AND its first draft version (v1)
// in a single request. This keeps the API simple for callers.

export const CreateTestProcedureInput = z.object({
  title: z.string().min(1, "Title is required").max(255),
  subRequirementId: z.string().uuid("Must be a valid UUID"),
  description: z.string().min(1, "Description is required"),
  steps: z.string().min(1, "Steps are required"),
});

export type CreateTestProcedureInput = z.infer<
  typeof CreateTestProcedureInput
>;

// ─── Create Version ────────────────────────────────────
// Creates a new DRAFT version on an existing procedure.
// The version number is auto-incremented by the service layer.

export const CreateTestProcedureVersionInput = z.object({
  description: z.string().min(1, "Description is required"),
  steps: z.string().min(1, "Steps are required"),
});

export type CreateTestProcedureVersionInput = z.infer<
  typeof CreateTestProcedureVersionInput
>;

// ─── Update Version ────────────────────────────────────
// Only allowed while the version is still in DRAFT status.

export const UpdateTestProcedureVersionInput = z
  .object({
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .optional(),
    steps: z.string().min(1, "Steps cannot be empty").optional(),
  })
  .refine((data) => data.description !== undefined || data.steps !== undefined, {
    message: "At least one field (description or steps) must be provided",
  });

export type UpdateTestProcedureVersionInput = z.infer<
  typeof UpdateTestProcedureVersionInput
>;

// ─── Publish Version ───────────────────────────────────
// Locks the version - no more edits allowed after this.

export const PublishTestProcedureVersionInput = z.object({
  confirmPublish: z.literal(true, {
    errorMap: () => ({ message: "confirmPublish must be true" }),
  }),
});

export type PublishTestProcedureVersionInput = z.infer<
  typeof PublishTestProcedureVersionInput
>;

// ─── Obsolete Procedure ────────────────────────────────
// Marks the entire logical procedure as obsolete.

export const ObsoleteTestProcedureInput = z.object({
  confirmObsolete: z.literal(true, {
    errorMap: () => ({ message: "confirmObsolete must be true" }),
  }),
});

export type ObsoleteTestProcedureInput = z.infer<
  typeof ObsoleteTestProcedureInput
>;
