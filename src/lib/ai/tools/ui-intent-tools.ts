// UI intent tools - these open the context panel in the chat UI.
// Unlike read tools (which fetch data silently for LLM reasoning),
// UI intent tools return structured payloads that the frontend
// renders in the context panel for the user to see.
//
// 4 tools: showEntityDetail, showTable, showDiagram, showAuditLog

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatToolError } from "./tool-wrapper";
import { AuditEntityTypeEnum } from "@/schemas/query.schema";
import {
  fetchProductRequirement,
  fetchSubRequirement,
  fetchTestProcedure,
  fetchTestProcedureVersion,
  fetchTestCase,
  fetchAuditLogForPanel,
} from "./shared-queries";
import type { DetailPayload, TablePayload, DiagramPayload, AuditPayload } from "@/types/panel";

// Helper to format dates for display
function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Normalize raw changes JSON from the database into typed change items.
// The changes column stores freeform JSON - this extracts field/old/new
// pairs and caps at 10 items. Malformed data collapses to empty array.
// Safely convert a value to a display string.
// Objects/arrays get JSON-stringified; null/undefined become "(none)".
function toDisplayString(value: unknown): string {
  if (value === null || value === undefined) return "(none)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function normalizeChanges(raw: unknown): Array<{ field: string; old?: string; new?: string }> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];

  try {
    const entries = Object.entries(raw as Record<string, unknown>);
    return entries.slice(0, 10).map(([key, value]) => {
      // Handle { before: X, after: Y } shape (used by some services)
      if (value && typeof value === "object" && !Array.isArray(value) && ("before" in value || "after" in value)) {
        const v = value as Record<string, unknown>;
        return {
          field: key,
          ...(v.before !== undefined ? { old: toDisplayString(v.before) } : {}),
          ...(v.after !== undefined ? { new: toDisplayString(v.after) } : {}),
        };
      }
      // Simple key-value: treat as a new value
      return { field: key, new: toDisplayString(value) };
    });
  } catch {
    return [];
  }
}

export function createUIIntentTools() {
  return {
    // -- Show a single entity's detail in the context panel --
    showEntityDetail: tool({
      description:
        "Display an entity's details in the context panel. " +
        "Use this when the user says 'show me', 'pull up', or 'display' an entity. " +
        "Do NOT use read tools (getProductRequirement, etc.) for user-facing display - use this instead.",
      inputSchema: z.object({
        entityType: z.enum([
          "ProductRequirement",
          "SubRequirement",
          "TestProcedure",
          "TestProcedureVersion",
          "TestCase",
        ]).describe("Type of entity to display"),
        id: z.string().uuid().describe("ID of the entity"),
      }),
      execute: async (args): Promise<DetailPayload | { error: string }> => {
        try {
          switch (args.entityType) {
            case "ProductRequirement": {
              const data = await fetchProductRequirement(args.id);
              return {
                type: "detail" as const,
                entityType: args.entityType,
                title: data.title,
                fields: [
                  { label: "ID", value: data.id },
                  { label: "Status", value: data.status },
                  { label: "Description", value: data.description },
                  { label: "Created", value: formatDate(data.createdAt) },
                ],
                relatedEntities: data.subRequirements.map((sr) => ({
                  id: sr.id,
                  title: sr.title,
                  status: sr.status,
                  entityType: "SubRequirement",
                })),
              };
            }

            case "SubRequirement": {
              const data = await fetchSubRequirement(args.id);
              return {
                type: "detail" as const,
                entityType: args.entityType,
                title: data.title,
                fields: [
                  { label: "ID", value: data.id },
                  { label: "Status", value: data.status },
                  { label: "Description", value: data.description },
                  { label: "Team", value: data.team.name },
                  { label: "Parent Requirement", value: data.productRequirement.title },
                  { label: "Created", value: formatDate(data.createdAt) },
                ],
                relatedEntities: data.testProcedures.map((tp) => ({
                  id: tp.id,
                  title: tp.title,
                  status: tp.status,
                  entityType: "TestProcedure",
                })),
              };
            }

            case "TestProcedure": {
              const data = await fetchTestProcedure(args.id);
              return {
                type: "detail" as const,
                entityType: args.entityType,
                title: data.title,
                fields: [
                  { label: "ID", value: data.id },
                  { label: "Status", value: data.status },
                  { label: "Parent Sub-Requirement", value: data.subRequirement.title },
                  { label: "Created", value: formatDate(data.createdAt) },
                ],
                relatedEntities: data.versions.map((v) => ({
                  id: v.id,
                  title: `v${v.versionNumber}${v.description ? ` - ${v.description}` : ""}`,
                  status: v.status,
                  entityType: "TestProcedureVersion",
                })),
              };
            }

            case "TestProcedureVersion": {
              const data = await fetchTestProcedureVersion(args.id);
              return {
                type: "detail" as const,
                entityType: args.entityType,
                title: `${data.testProcedure.title} v${data.versionNumber}`,
                fields: [
                  { label: "ID", value: data.id },
                  { label: "Status", value: data.status },
                  { label: "Version", value: String(data.versionNumber) },
                  { label: "Description", value: data.description },
                  { label: "Steps", value: data.steps },
                  { label: "Procedure", value: data.testProcedure.title },
                  { label: "Created", value: formatDate(data.createdAt) },
                ],
                relatedEntities: data.testCases.map((tc) => ({
                  id: tc.id,
                  title: tc.title,
                  status: tc.status,
                  entityType: "TestCase",
                })),
              };
            }

            case "TestCase": {
              const data = await fetchTestCase(args.id);
              const fields = [
                { label: "ID", value: data.id },
                { label: "Status", value: data.status },
                { label: "Description", value: data.description },
                { label: "Procedure", value: data.testProcedureVersion.testProcedure.title },
                { label: "Version", value: `v${data.testProcedureVersion.versionNumber}` },
              ];
              if (data.result) fields.push({ label: "Result", value: data.result });
              if (data.notes) fields.push({ label: "Notes", value: data.notes });
              if (data.executedAt) fields.push({ label: "Executed", value: formatDate(data.executedAt) });

              return {
                type: "detail" as const,
                entityType: args.entityType,
                title: data.title,
                fields,
              };
            }

            default: {
              // Exhaustive check - TypeScript will error if a new enum value is added
              // but not handled above.
              const _exhaustive: never = args.entityType;
              return { error: `ValidationError: Unknown entity type: ${_exhaustive}` };
            }
          }
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Show a table of query results in the context panel --
    showTable: tool({
      description:
        "Display a table of query results in the context panel. " +
        "Use this to show lists like uncovered sub-requirements, untested procedures, " +
        "search results, or any entity list the user asks to see. " +
        "Results are capped at 15 rows.",
      inputSchema: z.object({
        queryType: z.enum([
          "uncoveredSubRequirements",
          "untestedProcedures",
          "allRequirements",
          "allSubRequirements",
          "allTestProcedures",
          "allTestCases",
          "searchResults",
        ]).describe("Which query to run"),
        searchQuery: z.string().optional().describe("Search term (only for searchResults queryType)"),
        entityType: z
          .enum(["ProductRequirement", "SubRequirement", "TestProcedure", "TestCase"])
          .optional()
          .describe("Entity type filter (only for searchResults queryType)"),
      }),
      execute: async (args): Promise<TablePayload | { error: string }> => {
        try {
          switch (args.queryType) {
            case "uncoveredSubRequirements": {
              const data = await prisma.subRequirement.findMany({
                where: { testProcedures: { none: {} } },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  team: { select: { name: true } },
                  productRequirement: { select: { title: true } },
                },
                take: 15,
                orderBy: { createdAt: "desc" },
              });
              return {
                type: "table" as const,
                title: "Uncovered Sub-Requirements",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "team", label: "Team" },
                  { key: "requirement", label: "Requirement" },
                ],
                rows: data.map((d) => ({
                  title: d.title,
                  status: d.status,
                  team: d.team.name,
                  requirement: d.productRequirement.title,
                })),
              };
            }

            case "untestedProcedures": {
              const data = await prisma.testProcedureVersion.findMany({
                where: { status: "APPROVED", testCases: { none: {} } },
                select: {
                  id: true,
                  versionNumber: true,
                  testProcedure: { select: { title: true } },
                },
                take: 15,
                orderBy: { createdAt: "desc" },
              });
              return {
                type: "table" as const,
                title: "Untested Procedure Versions",
                columns: [
                  { key: "procedure", label: "Procedure" },
                  { key: "version", label: "Version" },
                ],
                rows: data.map((d) => ({
                  procedure: d.testProcedure.title,
                  version: `v${d.versionNumber}`,
                })),
              };
            }

            case "allRequirements": {
              const data = await prisma.productRequirement.findMany({
                select: { id: true, title: true, status: true, createdAt: true },
                take: 15,
                orderBy: { createdAt: "desc" },
              });
              return {
                type: "table" as const,
                title: "Product Requirements",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "created", label: "Created" },
                ],
                rows: data.map((d) => ({
                  title: d.title,
                  status: d.status,
                  created: formatDate(d.createdAt),
                })),
              };
            }

            case "allSubRequirements": {
              const data = await prisma.subRequirement.findMany({
                select: {
                  id: true,
                  title: true,
                  status: true,
                  team: { select: { name: true } },
                },
                take: 15,
                orderBy: { createdAt: "desc" },
              });
              return {
                type: "table" as const,
                title: "Sub-Requirements",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "team", label: "Team" },
                ],
                rows: data.map((d) => ({
                  title: d.title,
                  status: d.status,
                  team: d.team.name,
                })),
              };
            }

            case "allTestProcedures": {
              const data = await prisma.testProcedure.findMany({
                select: {
                  id: true,
                  title: true,
                  status: true,
                  subRequirement: { select: { title: true } },
                },
                take: 15,
                orderBy: { createdAt: "desc" },
              });
              return {
                type: "table" as const,
                title: "Test Procedures",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "subRequirement", label: "Sub-Requirement" },
                ],
                rows: data.map((d) => ({
                  title: d.title,
                  status: d.status,
                  subRequirement: d.subRequirement.title,
                })),
              };
            }

            case "allTestCases": {
              const data = await prisma.testCase.findMany({
                select: {
                  id: true,
                  title: true,
                  status: true,
                  result: true,
                  testProcedureVersion: {
                    select: { testProcedure: { select: { title: true } } },
                  },
                },
                take: 15,
                orderBy: { createdAt: "desc" },
              });
              return {
                type: "table" as const,
                title: "Test Cases",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "result", label: "Result" },
                  { key: "procedure", label: "Procedure" },
                ],
                rows: data.map((d) => ({
                  title: d.title,
                  status: d.status,
                  result: d.result ?? "-",
                  procedure: d.testProcedureVersion.testProcedure.title,
                })),
              };
            }

            case "searchResults": {
              if (!args.searchQuery) {
                return { error: "ValidationError: searchQuery is required for searchResults queryType" };
              }
              const filter = {
                title: { contains: args.searchQuery, mode: "insensitive" as const },
              };
              const types = args.entityType
                ? [args.entityType]
                : ["ProductRequirement", "SubRequirement", "TestProcedure", "TestCase"];

              // Run queries in parallel but collect into separate arrays.
              // Then flatten in a fixed type order for deterministic results.
              const [reqs, subs, procs, cases] = await Promise.all([
                types.includes("ProductRequirement")
                  ? prisma.productRequirement.findMany({
                      where: filter,
                      select: { title: true, status: true },
                      take: 5,
                      orderBy: { createdAt: "desc" },
                    })
                  : Promise.resolve([]),
                types.includes("SubRequirement")
                  ? prisma.subRequirement.findMany({
                      where: filter,
                      select: { title: true, status: true },
                      take: 5,
                      orderBy: { createdAt: "desc" },
                    })
                  : Promise.resolve([]),
                types.includes("TestProcedure")
                  ? prisma.testProcedure.findMany({
                      where: filter,
                      select: { title: true, status: true },
                      take: 5,
                      orderBy: { createdAt: "desc" },
                    })
                  : Promise.resolve([]),
                types.includes("TestCase")
                  ? prisma.testCase.findMany({
                      where: filter,
                      select: { title: true, status: true },
                      take: 5,
                      orderBy: { createdAt: "desc" },
                    })
                  : Promise.resolve([]),
              ]);

              // Flatten in fixed order: Requirements, Sub-Reqs, Procedures, Test Cases
              const rows: Record<string, unknown>[] = [
                ...reqs.map((d) => ({ type: "Requirement", title: d.title, status: d.status })),
                ...subs.map((d) => ({ type: "Sub-Req", title: d.title, status: d.status })),
                ...procs.map((d) => ({ type: "Procedure", title: d.title, status: d.status })),
                ...cases.map((d) => ({ type: "Test Case", title: d.title, status: d.status })),
              ].slice(0, 15);

              return {
                type: "table" as const,
                title: `Search: "${args.searchQuery}"`,
                columns: [
                  { key: "type", label: "Type" },
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                ],
                rows,
              };
            }
          }
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Show a Mermaid diagram in the context panel --
    showDiagram: tool({
      description:
        "Display a Mermaid diagram in the context panel. " +
        "Use this to show traceability trees, status overviews, or relationship maps. " +
        "Generate valid Mermaid syntax (flowchart, graph, or stateDiagram). " +
        "Use this when the user asks for a visual overview or diagram.",
      inputSchema: z.object({
        title: z.string().describe("Title for the diagram"),
        mermaidSyntax: z.string().describe("Valid Mermaid diagram syntax"),
      }),
      execute: async (args): Promise<DiagramPayload | { error: string }> => {
        try {
          // Strip markdown code fences if the LLM wrapped the syntax in them.
          // LLMs commonly produce ```mermaid\n...\n``` around diagram code.
          let cleaned = args.mermaidSyntax.trim();
          const fenceMatch = cleaned.match(/^```(?:mermaid)?\s*\n([\s\S]*?)```\s*$/);
          if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
          }

          // Basic validation - mermaid syntax should start with a diagram type
          const trimmed = cleaned;
          const validStarts = ["graph", "flowchart", "sequenceDiagram", "classDiagram", "stateDiagram", "erDiagram", "gantt", "pie", "gitgraph"];
          const startsValid = validStarts.some((s) => trimmed.startsWith(s));

          if (!startsValid) {
            return {
              error: "ValidationError: Mermaid syntax must start with a valid diagram type (graph, flowchart, stateDiagram, etc.)",
            };
          }

          return {
            type: "diagram" as const,
            title: args.title,
            mermaidSyntax: cleaned,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Show audit log entries in the context panel --
    showAuditLog: tool({
      description:
        "Display audit history visually in the context panel. " +
        "Use this when the user asks to see, show, or display audit logs or activity history. " +
        "Do NOT use getRecentAuditLog for user-facing display - use this tool instead.",
      inputSchema: z.object({
        entityType: AuditEntityTypeEnum
          .optional()
          .describe("Filter by entity type"),
        entityId: z
          .string()
          .uuid()
          .optional()
          .describe("Filter by specific entity ID"),
        actorId: z
          .string()
          .uuid()
          .optional()
          .describe("Filter by actor (user) ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(25)
          .describe("Max entries to return (default 25)"),
      }),
      execute: async (args): Promise<AuditPayload | { error: string }> => {
        try {
          const data = await fetchAuditLogForPanel({
            entityType: args.entityType,
            entityId: args.entityId,
            actorId: args.actorId,
            limit: args.limit,
          });

          // Build a descriptive title based on active filters
          let title = "Recent Audit Log";
          if (args.entityType && args.entityId) {
            title = `Audit History - ${args.entityType}`;
          } else if (args.entityType) {
            title = `Audit Log - ${args.entityType}`;
          } else if (args.actorId && data.length > 0) {
            title = `Audit Log - ${data[0].actor.name}`;
          } else if (args.actorId) {
            title = "Audit Log - User Activity";
          }

          return {
            type: "audit" as const,
            title,
            entries: data.map((entry) => ({
              id: entry.id,
              action: entry.action,
              entityType: entry.entityType,
              entityId: entry.entityId,
              actor: { name: entry.actor.name },
              createdAt: entry.createdAt.toISOString(),
              changes: normalizeChanges(entry.changes),
            })),
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),
  };
}
