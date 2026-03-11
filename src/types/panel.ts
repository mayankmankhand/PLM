// Panel payload types for the context panel.
// Uses a Zod-backed discriminated union so the same shapes
// can validate tool output and type-narrow in React renderers.

import { z } from "zod";

// -- Detail payload: shows a single entity with its fields and related items --
export const DetailPayloadSchema = z.object({
  type: z.literal("detail"),
  entityType: z.enum([
    "ProductRequirement",
    "SubRequirement",
    "TestProcedure",
    "TestProcedureVersion",
    "TestCase",
  ]),
  title: z.string(),
  // Key-value fields to display (e.g. status, description, createdAt).
  // Values are stringified for display - keeps the schema simple.
  fields: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    }),
  ),
  // Optional list of related entities (e.g. sub-requirements under a requirement).
  relatedEntities: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        status: z.string(),
        entityType: z.string(),
      }),
    )
    .optional(),
});

// -- Table payload: shows rows and columns (query results, search results) --
export const TablePayloadSchema = z.object({
  type: z.literal("table"),
  title: z.string(),
  columns: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
    }),
  ),
  rows: z
    .array(z.record(z.string(), z.unknown()))
    .max(15, "Tables are capped at 15 rows in V1"),
});

// -- Diagram payload: Mermaid syntax string for visual rendering --
export const DiagramPayloadSchema = z.object({
  type: z.literal("diagram"),
  title: z.string(),
  mermaidSyntax: z.string(),
});

// -- Audit payload: shows a timeline of audit log entries for an entity --
export const AuditChangeItemSchema = z.object({
  field: z.string(),
  old: z.string().optional(),
  new: z.string().optional(),
});

export const AuditEntrySchema = z.object({
  id: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  actor: z.object({ name: z.string() }),
  createdAt: z.string(),
  changes: z.array(AuditChangeItemSchema).max(10).default([]),
});

export const AuditPayloadSchema = z.object({
  type: z.literal("audit"),
  title: z.string(),
  entries: z.array(AuditEntrySchema).max(50, "Audit entries capped at 50"),
});

// -- Discriminated union of all panel content types --
export const PanelContentSchema = z.discriminatedUnion("type", [
  DetailPayloadSchema,
  TablePayloadSchema,
  DiagramPayloadSchema,
  AuditPayloadSchema,
]);

// -- Error state (not part of the discriminated union - separate concern) --
export const PanelErrorSchema = z.object({
  type: z.literal("error"),
  toolName: z.string(),
  message: z.string(),
});

// TypeScript types derived from Zod schemas
export type DetailPayload = z.infer<typeof DetailPayloadSchema>;
export type TablePayload = z.infer<typeof TablePayloadSchema>;
export type DiagramPayload = z.infer<typeof DiagramPayloadSchema>;
export type PanelContent = z.infer<typeof PanelContentSchema>;
export type AuditChangeItem = z.infer<typeof AuditChangeItemSchema>;
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type AuditPayload = z.infer<typeof AuditPayloadSchema>;
export type PanelError = z.infer<typeof PanelErrorSchema>;

// The panel can show content or an error state
export type PanelState = PanelContent | PanelError;
