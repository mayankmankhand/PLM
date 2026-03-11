// LLM tools for sub-requirement mutations.
// Sub-requirements belong to a product requirement and a team.

import { tool } from "ai";
import { z } from "zod";
import type { RequestContext } from "@/lib/request-context";
import {
  createSubRequirement,
  updateSubRequirement,
  approveSubRequirement,
  cancelSubRequirement,
} from "@/services/sub-requirement.service";
import { formatToolError } from "./tool-wrapper";

export function createSubRequirementTools(ctx: RequestContext) {
  return {
    // -- Create a new sub-requirement under a product requirement --
    createSubRequirement: tool({
      description:
        "Create a new sub-requirement linked to a parent product requirement and a team. " +
        "Starts in DRAFT status.",
      inputSchema: z.object({
        title: z.string().min(1).max(255).describe("Short title for the sub-requirement"),
        description: z.string().min(1).describe("Detailed description"),
        productRequirementId: z.string().uuid().describe("ID of the parent product requirement"),
        teamId: z.string().uuid().describe("ID of the team responsible for this sub-requirement"),
      }),
      execute: async (args) => {
        try {
          const result = await createSubRequirement(
            {
              title: args.title,
              description: args.description,
              productRequirementId: args.productRequirementId,
              teamId: args.teamId,
            },
            ctx
          );
          return {
            id: result.id,
            title: result.title,
            status: result.status,
            productRequirementId: result.productRequirementId,
            teamId: result.teamId,
            createdAt: result.createdAt,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Update a draft sub-requirement --
    updateSubRequirement: tool({
      description:
        "Update a sub-requirement that is still in DRAFT status. " +
        "At least one of title or description must be provided.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the sub-requirement to update"),
        title: z.string().min(1).max(255).optional().describe("New title (optional)"),
        description: z.string().min(1).optional().describe("New description (optional)"),
      }).refine(
        (data) => data.title !== undefined || data.description !== undefined,
        { message: "At least one of title or description must be provided" }
      ),
      execute: async (args) => {
        try {
          const input: { title?: string; description?: string } = {};
          if (args.title !== undefined) input.title = args.title;
          if (args.description !== undefined) input.description = args.description;

          const result = await updateSubRequirement(args.id, input, ctx);
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

    // -- Approve a draft sub-requirement --
    approveSubRequirement: tool({
      description:
        "Approve a sub-requirement, changing its status from DRAFT to APPROVED. " +
        "The parent product requirement must already be APPROVED. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the sub-requirement to approve"),
        confirmApprove: z.literal(true).describe("Must be true to confirm approval"),
      }),
      execute: async (args) => {
        try {
          const result = await approveSubRequirement(args.id, ctx);
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

    // -- Cancel an approved sub-requirement --
    cancelSubRequirement: tool({
      description:
        "Mark an approved sub-requirement as canceled. " +
        "Only APPROVED sub-requirements can be canceled. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the sub-requirement to cancel"),
        confirmCancel: z.literal(true).describe("Must be true to confirm canceling"),
      }),
      execute: async (args) => {
        try {
          const result = await cancelSubRequirement(args.id, ctx);
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
