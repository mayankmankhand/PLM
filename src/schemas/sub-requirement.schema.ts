import { z } from "zod";

// ─── Create ────────────────────────────────────────────
// Links to a parent ProductRequirement and a responsible Team.

export const CreateSubRequirementInput = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  productRequirementId: z.string().uuid("Must be a valid UUID"),
  teamId: z.string().uuid("Must be a valid UUID"),
});

export type CreateSubRequirementInput = z.infer<
  typeof CreateSubRequirementInput
>;

// ─── Update ────────────────────────────────────────────
// Partial update - at least one field must be provided.

export const UpdateSubRequirementInput = z
  .object({
    title: z.string().min(1, "Title cannot be empty").max(255).optional(),
    description: z
      .string()
      .min(1, "Description cannot be empty")
      .optional(),
  })
  .refine((data) => data.title !== undefined || data.description !== undefined, {
    message: "At least one field (title or description) must be provided",
  });

export type UpdateSubRequirementInput = z.infer<
  typeof UpdateSubRequirementInput
>;

// ─── Publish ───────────────────────────────────────────

export const PublishSubRequirementInput = z.object({
  confirmPublish: z.literal(true, {
    errorMap: () => ({ message: "confirmPublish must be true" }),
  }),
});

export type PublishSubRequirementInput = z.infer<
  typeof PublishSubRequirementInput
>;

// ─── Obsolete ──────────────────────────────────────────

export const ObsoleteSubRequirementInput = z.object({
  confirmObsolete: z.literal(true, {
    errorMap: () => ({ message: "confirmObsolete must be true" }),
  }),
});

export type ObsoleteSubRequirementInput = z.infer<
  typeof ObsoleteSubRequirementInput
>;
