import { z } from "zod";

// ─── Create ────────────────────────────────────────────
// Used when creating a new product requirement (starts as DRAFT).

export const CreateProductRequirementInput = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
});

export type CreateProductRequirementInput = z.infer<
  typeof CreateProductRequirementInput
>;

// ─── Update ────────────────────────────────────────────
// Partial update - at least one field must be provided.

export const UpdateProductRequirementInput = z
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

export type UpdateProductRequirementInput = z.infer<
  typeof UpdateProductRequirementInput
>;

// ─── Publish ───────────────────────────────────────────
// Transitions DRAFT -> PUBLISHED. The literal(true) forces the caller
// to explicitly confirm, preventing accidental publishes.

export const PublishProductRequirementInput = z.object({
  confirmPublish: z.literal(true, {
    errorMap: () => ({ message: "confirmPublish must be true" }),
  }),
});

export type PublishProductRequirementInput = z.infer<
  typeof PublishProductRequirementInput
>;

// ─── Obsolete ──────────────────────────────────────────
// Transitions PUBLISHED -> OBSOLETE. Same confirmation pattern.

export const ObsoleteProductRequirementInput = z.object({
  confirmObsolete: z.literal(true, {
    errorMap: () => ({ message: "confirmObsolete must be true" }),
  }),
});

export type ObsoleteProductRequirementInput = z.infer<
  typeof ObsoleteProductRequirementInput
>;
