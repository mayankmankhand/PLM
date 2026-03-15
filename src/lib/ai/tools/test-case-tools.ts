// LLM tools for test case mutations.
// Test cases belong to a specific TestProcedureVersion.

import { tool } from "ai";
import { z } from "zod";
import type { RequestContext } from "@/lib/request-context";
import {
  createTestCase,
  updateTestCase,
  recordTestResult,
  skipTestCase,
} from "@/services/test-case.service";
import { formatToolError } from "./tool-wrapper";

export function createTestCaseTools(ctx: RequestContext) {
  return {
    // -- Create a new test case --
    createTestCase: tool({
      description:
        "Create a new test case linked to a test procedure version. " +
        "Starts in PENDING status with no result.",
      inputSchema: z.object({
        title: z.string().trim().min(1).max(255).describe("Short title for the test case"),
        description: z.string().trim().min(1).describe("What this test case verifies"),
        testProcedureVersionId: z.string().uuid().describe("ID of the parent test procedure version"),
      }),
      execute: async (args) => {
        try {
          const result = await createTestCase(
            {
              title: args.title,
              description: args.description,
              testProcedureVersionId: args.testProcedureVersionId,
            },
            ctx
          );
          return {
            id: result.id,
            title: result.title,
            status: result.status,
            testProcedureVersionId: result.testProcedureVersionId,
            createdAt: result.createdAt,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Update a pending test case --
    updateTestCase: tool({
      description:
        "Update a test case that is still in PENDING status. " +
        "Once a result has been recorded or the test case has been skipped, it cannot be edited. " +
        "At least one of title or description must be provided.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the test case to update"),
        title: z.string().trim().min(1).max(255).optional().describe("New title (optional)"),
        description: z.string().trim().min(1).optional().describe("New description (optional)"),
      }).refine(
        (data) => data.title !== undefined || data.description !== undefined,
        { message: "At least one of title or description must be provided" }
      ),
      execute: async (args) => {
        try {
          const input: { title?: string; description?: string } = {};
          if (args.title !== undefined) input.title = args.title;
          if (args.description !== undefined) input.description = args.description;

          const result = await updateTestCase(args.id, input, ctx);
          return {
            id: result.id,
            title: result.title,
            description: result.description,
            status: result.status,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Record a test result --
    recordTestResult: tool({
      description:
        "Record a result (PASS, FAIL, BLOCKED, or SKIPPED) on a test case. " +
        "The parent procedure version must be APPROVED. " +
        "SKIPPED returns the test case to PENDING so it can be re-run later.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the test case"),
        result: z.enum(["PASS", "FAIL", "BLOCKED", "SKIPPED"]).describe("Test result"),
        notes: z.string().trim().optional().describe("Optional notes about the result"),
      }),
      execute: async (args) => {
        try {
          const updated = await recordTestResult(
            args.id,
            { result: args.result, notes: args.notes },
            ctx
          );
          return {
            id: updated.id,
            title: updated.title,
            status: updated.status,
            result: updated.result,
            notes: updated.notes,
            executedAt: updated.executedAt,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Skip a test case --
    skipTestCase: tool({
      description:
        "Mark a test case as skipped. Cannot record results after this. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the test case to skip"),
        confirmSkip: z.literal(true).describe("Must be true to confirm skipping"),
      }),
      execute: async (args) => {
        try {
          const result = await skipTestCase(args.id, ctx);
          return {
            id: result.id,
            title: result.title,
            status: result.status,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),
  };
}
