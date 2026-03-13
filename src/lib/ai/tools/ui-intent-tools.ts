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

// Map Prisma attachment rows to the DetailPayload attachment shape.
function mapAttachments(
  attachments: Array<{ id: string; fileName: string; fileType: string; createdAt: Date; uploader: { name: string } }>
): Array<{ id: string; fileName: string; fileType: string; uploadedBy: string; createdAt: string }> {
  return attachments.map((a) => ({
    id: a.id,
    fileName: a.fileName,
    fileType: a.fileType,
    uploadedBy: a.uploader.name,
    createdAt: formatDate(a.createdAt),
  }));
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
                attachments: mapAttachments(data.attachments),
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
                attachments: mapAttachments(data.attachments),
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
                attachments: mapAttachments(data.attachments),
              };
            }

            // No attachments - TPV has no attachment FK (attachments belong to parent TestProcedure)
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
                attachments: mapAttachments(data.attachments),
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
        "search results, aggregations, or any entity list the user asks to see. " +
        "Results are capped at 15 rows. If isTruncated is true, tell the user more results exist " +
        "and suggest narrowing with filters (e.g. team).",
      inputSchema: z.object({
        queryType: z.enum([
          "uncoveredSubRequirements",
          "untestedProcedures",
          "allRequirements",
          "allSubRequirements",
          "allTestProcedures",
          "allTestCases",
          "searchResults",
          "testResultSummary",
          "coverageByTeam",
          "testCasesForRequirement",
        ]).describe("Which query to run"),
        searchQuery: z.string().optional()
          .describe("Search term (only for searchResults queryType)"),
        entityType: z
          .enum(["ProductRequirement", "SubRequirement", "TestProcedure", "TestCase"])
          .optional()
          .describe("Entity type filter (only for searchResults queryType)"),
        team: z.string().optional()
          .describe("Team name filter (for allSubRequirements, allTestProcedures)"),
        requirementId: z.string().uuid().optional()
          .describe("Product requirement ID (required for testCasesForRequirement). Use searchByTitle first if user gives a name."),
      }),
      execute: async (args): Promise<TablePayload | { error: string }> => {
        try {
          switch (args.queryType) {
            // ─── Existing queries (enriched with cross-entity columns) ───

            case "uncoveredSubRequirements": {
              const data = await prisma.subRequirement.findMany({
                where: { testProcedures: { none: {} } },
                select: {
                  id: true,
                  title: true,
                  status: true,
                  team: { select: { name: true } },
                  productRequirement: { select: { title: true, status: true } },
                },
                take: 16, // Fetch one extra to detect truncation
                orderBy: { createdAt: "desc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);
              return {
                type: "table" as const,
                title: "Uncovered Sub-Requirements",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "team", label: "Team" },
                  { key: "productRequirement", label: "Product Requirement" },
                  { key: "parentStatus", label: "PR Status" },
                ],
                rows: rows.map((d) => ({
                  title: d.title,
                  status: d.status,
                  team: d.team.name,
                  productRequirement: d.productRequirement.title,
                  parentStatus: d.productRequirement.status,
                })),
                isTruncated,
              };
            }

            case "untestedProcedures": {
              const data = await prisma.testProcedureVersion.findMany({
                where: { status: "APPROVED", testCases: { none: {} } },
                select: {
                  id: true,
                  versionNumber: true,
                  testProcedure: {
                    select: {
                      title: true,
                      subRequirement: {
                        select: {
                          title: true,
                          team: { select: { name: true } },
                        },
                      },
                    },
                  },
                },
                take: 16,
                orderBy: { createdAt: "desc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);
              return {
                type: "table" as const,
                title: "Untested Procedure Versions",
                columns: [
                  { key: "procedure", label: "Procedure" },
                  { key: "version", label: "Version" },
                  { key: "subRequirement", label: "Sub-Requirement" },
                  { key: "team", label: "Team" },
                ],
                rows: rows.map((d) => ({
                  procedure: d.testProcedure.title,
                  version: `v${d.versionNumber}`,
                  subRequirement: d.testProcedure.subRequirement.title,
                  team: d.testProcedure.subRequirement.team.name,
                })),
                isTruncated,
              };
            }

            case "allRequirements": {
              const data = await prisma.productRequirement.findMany({
                select: {
                  id: true,
                  title: true,
                  status: true,
                  createdAt: true,
                  creator: { select: { name: true } },
                },
                take: 16,
                orderBy: { createdAt: "desc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);
              return {
                type: "table" as const,
                title: "Product Requirements",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "created", label: "Created" },
                  { key: "createdBy", label: "Created By" },
                ],
                rows: rows.map((d) => ({
                  title: d.title,
                  status: d.status,
                  created: formatDate(d.createdAt),
                  createdBy: d.creator.name,
                })),
                isTruncated,
              };
            }

            case "allSubRequirements": {
              // Optional team filter - case-insensitive partial match
              const where = args.team
                ? { team: { name: { contains: args.team, mode: "insensitive" as const } } }
                : {};
              const data = await prisma.subRequirement.findMany({
                where,
                select: {
                  id: true,
                  title: true,
                  status: true,
                  team: { select: { name: true } },
                  productRequirement: { select: { title: true, status: true } },
                  creator: { select: { name: true } },
                },
                take: 16,
                orderBy: { createdAt: "desc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);
              return {
                type: "table" as const,
                title: args.team ? `Sub-Requirements - ${args.team}` : "Sub-Requirements",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "team", label: "Team" },
                  { key: "productRequirement", label: "Product Requirement" },
                  { key: "parentStatus", label: "PR Status" },
                  { key: "createdBy", label: "Created By" },
                ],
                rows: rows.map((d) => ({
                  title: d.title,
                  status: d.status,
                  team: d.team.name,
                  productRequirement: d.productRequirement.title,
                  parentStatus: d.productRequirement.status,
                  createdBy: d.creator.name,
                })),
                isTruncated,
              };
            }

            case "allTestProcedures": {
              // Optional team filter via sub-requirement's team
              const where = args.team
                ? { subRequirement: { team: { name: { contains: args.team, mode: "insensitive" as const } } } }
                : {};
              const data = await prisma.testProcedure.findMany({
                where,
                select: {
                  id: true,
                  title: true,
                  status: true,
                  creator: { select: { name: true } },
                  subRequirement: {
                    select: {
                      title: true,
                      team: { select: { name: true } },
                      productRequirement: { select: { title: true } },
                    },
                  },
                },
                take: 16,
                orderBy: { createdAt: "desc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);
              return {
                type: "table" as const,
                title: args.team ? `Test Procedures - ${args.team}` : "Test Procedures",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "subRequirement", label: "Sub-Requirement" },
                  { key: "team", label: "Team" },
                  { key: "productRequirement", label: "Product Requirement" },
                  { key: "createdBy", label: "Created By" },
                ],
                rows: rows.map((d) => ({
                  title: d.title,
                  status: d.status,
                  subRequirement: d.subRequirement.title,
                  team: d.subRequirement.team.name,
                  productRequirement: d.subRequirement.productRequirement.title,
                  createdBy: d.creator.name,
                })),
                isTruncated,
              };
            }

            case "allTestCases": {
              const data = await prisma.testCase.findMany({
                select: {
                  id: true,
                  title: true,
                  status: true,
                  result: true,
                  executedAt: true,
                  executor: { select: { name: true } },
                  testProcedureVersion: {
                    select: {
                      testProcedure: {
                        select: {
                          title: true,
                          subRequirement: { select: { title: true } },
                        },
                      },
                    },
                  },
                },
                take: 16,
                orderBy: { createdAt: "desc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);
              return {
                type: "table" as const,
                title: "Test Cases",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "result", label: "Result" },
                  { key: "procedure", label: "Procedure" },
                  { key: "subRequirement", label: "Sub-Requirement" },
                  { key: "executedBy", label: "Executed By" },
                  { key: "executedAt", label: "Executed" },
                ],
                rows: rows.map((d) => ({
                  title: d.title,
                  status: d.status,
                  result: d.result ?? "-",
                  procedure: d.testProcedureVersion.testProcedure.title,
                  subRequirement: d.testProcedureVersion.testProcedure.subRequirement.title,
                  executedBy: d.executor?.name ?? "-",
                  executedAt: d.executedAt ? formatDate(d.executedAt) : "-",
                })),
                isTruncated,
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
              const allRows: Record<string, unknown>[] = [
                ...reqs.map((d) => ({ type: "Requirement", title: d.title, status: d.status })),
                ...subs.map((d) => ({ type: "Sub-Req", title: d.title, status: d.status })),
                ...procs.map((d) => ({ type: "Procedure", title: d.title, status: d.status })),
                ...cases.map((d) => ({ type: "Test Case", title: d.title, status: d.status })),
              ];
              const isTruncated = allRows.length > 15;

              return {
                type: "table" as const,
                title: `Search: "${args.searchQuery}"`,
                columns: [
                  { key: "type", label: "Type" },
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                ],
                rows: allRows.slice(0, 15),
                isTruncated,
              };
            }

            // ─── New aggregation queries (Issue #24) ─────────────────

            case "testResultSummary": {
              // Pass/fail/blocked/skipped/pending counts grouped by procedure.
              // Only includes ACTIVE procedures (CANCELED ones are excluded).
              // Sorted by failed DESC to surface most-problematic procedures first.
              const procedures = await prisma.testProcedure.findMany({
                where: { status: "ACTIVE" },
                select: {
                  title: true,
                  subRequirement: {
                    select: {
                      title: true,
                      team: { select: { name: true } },
                    },
                  },
                  versions: {
                    select: {
                      testCases: {
                        select: { status: true },
                      },
                    },
                  },
                },
              });

              // Aggregate test case statuses per procedure
              const summaryRows = procedures.map((p) => {
                const counts = { passed: 0, failed: 0, blocked: 0, skipped: 0, pending: 0 };
                for (const v of p.versions) {
                  for (const tc of v.testCases) {
                    if (tc.status === "PASSED") counts.passed++;
                    else if (tc.status === "FAILED") counts.failed++;
                    else if (tc.status === "BLOCKED") counts.blocked++;
                    else if (tc.status === "SKIPPED") counts.skipped++;
                    else counts.pending++;
                  }
                }
                const total = counts.passed + counts.failed + counts.blocked + counts.skipped + counts.pending;
                return {
                  procedure: p.title,
                  subRequirement: p.subRequirement.title,
                  team: p.subRequirement.team.name,
                  passed: counts.passed,
                  failed: counts.failed,
                  blocked: counts.blocked,
                  skipped: counts.skipped,
                  pending: counts.pending,
                  total,
                };
              });

              // Sort by failed count DESC, then total DESC
              summaryRows.sort((a, b) => b.failed - a.failed || b.total - a.total);
              const isTruncated = summaryRows.length > 15;

              return {
                type: "table" as const,
                title: "Test Result Summary by Procedure",
                columns: [
                  { key: "procedure", label: "Procedure" },
                  { key: "subRequirement", label: "Sub-Requirement" },
                  { key: "team", label: "Team" },
                  { key: "passed", label: "Passed" },
                  { key: "failed", label: "Failed" },
                  { key: "blocked", label: "Blocked" },
                  { key: "skipped", label: "Skipped" },
                  { key: "pending", label: "Pending" },
                  { key: "total", label: "Total" },
                ],
                rows: summaryRows.slice(0, 15),
                isTruncated,
              };
            }

            case "coverageByTeam": {
              // SR count, TP count, uncovered count per team.
              // Sorted by uncovered DESC to surface least-covered teams first.
              const teams = await prisma.team.findMany({
                select: {
                  name: true,
                  subRequirements: {
                    select: {
                      id: true,
                      testProcedures: { select: { id: true } },
                    },
                  },
                },
                take: 16, // Fetch one extra to detect truncation
              });

              const coverageRows = teams.map((t) => {
                const srCount = t.subRequirements.length;
                const tpCount = t.subRequirements.reduce(
                  (sum, sr) => sum + sr.testProcedures.length, 0
                );
                const uncovered = t.subRequirements.filter(
                  (sr) => sr.testProcedures.length === 0
                ).length;
                const coveragePercent = srCount > 0
                  ? `${Math.round(((srCount - uncovered) / srCount) * 100)}%`
                  : "-";
                return {
                  team: t.name,
                  subRequirements: srCount,
                  testProcedures: tpCount,
                  uncovered,
                  coveragePercent,
                };
              });

              coverageRows.sort((a, b) => b.uncovered - a.uncovered);
              const isTruncated = coverageRows.length > 15;

              return {
                type: "table" as const,
                title: "Test Coverage by Team",
                columns: [
                  { key: "team", label: "Team" },
                  { key: "subRequirements", label: "Sub-Reqs" },
                  { key: "testProcedures", label: "Procedures" },
                  { key: "uncovered", label: "Uncovered" },
                  { key: "coveragePercent", label: "Coverage" },
                ],
                rows: coverageRows.slice(0, 15),
                isTruncated,
              };
            }

            case "testCasesForRequirement": {
              // Flattened TC list for a given product requirement ID.
              // Skips intermediate layers (SR -> TP -> TPV) for a direct view.
              if (!args.requirementId) {
                return { error: "ValidationError: requirementId is required for testCasesForRequirement. Use searchByTitle first if user gives a name." };
              }

              const data = await prisma.testCase.findMany({
                where: {
                  testProcedureVersion: {
                    testProcedure: {
                      subRequirement: {
                        productRequirementId: args.requirementId,
                      },
                    },
                  },
                },
                select: {
                  title: true,
                  status: true,
                  result: true,
                  executedAt: true,
                  executor: { select: { name: true } },
                  testProcedureVersion: {
                    select: {
                      testProcedure: {
                        select: {
                          title: true,
                          subRequirement: { select: { title: true } },
                        },
                      },
                    },
                  },
                },
                take: 16,
                // Surface pending/failed first (status ASC: BLOCKED, FAILED, PASSED, PENDING, SKIPPED)
                orderBy: { status: "asc" },
              });
              const isTruncated = data.length > 15;
              const rows = data.slice(0, 15);

              return {
                type: "table" as const,
                title: "Test Cases for Requirement",
                columns: [
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "result", label: "Result" },
                  { key: "procedure", label: "Procedure" },
                  { key: "subRequirement", label: "Sub-Requirement" },
                  { key: "executedBy", label: "Executed By" },
                  { key: "executedAt", label: "Executed" },
                ],
                rows: rows.map((d) => ({
                  title: d.title,
                  status: d.status,
                  result: d.result ?? "-",
                  procedure: d.testProcedureVersion.testProcedure.title,
                  subRequirement: d.testProcedureVersion.testProcedure.subRequirement.title,
                  executedBy: d.executor?.name ?? "-",
                  executedAt: d.executedAt ? formatDate(d.executedAt) : "-",
                })),
                isTruncated,
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
        "Use for traceability trees, status overviews, or relationship maps. " +
        "Generate valid Mermaid syntax (flowchart, graph, or stateDiagram). " +
        "Diagram style rules: " +
        "(1) Prefer `flowchart LR` for trees - left-to-right fits the narrow panel better than top-down. " +
        "(2) Short node labels - use ID + brief title (e.g. `PR1[PR-001 Core Features]`), not full descriptions. " +
        "(3) Show status as a short suffix when relevant (e.g. `TC1[TC-001 GPS Power - FAILED]`). " +
        "(4) Do NOT use classDef or style directives - the neutral theme handles colors. " +
        "(5) Do NOT use emoji in node labels. " +
        "(6) Keep labels concise (under ~50 characters per node).",
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
