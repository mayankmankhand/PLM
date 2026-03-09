// LLM tools for sub-requirement mutations.
// Sub-requirements belong to a product requirement and a team.

import { tool } from "ai";
import { z } from "zod";
import type { RequestContext } from "@/lib/request-context";
import {
  createSubRequirement,
  updateSubRequirement,
  publishSubRequirement,
  obsoleteSubRequirement,
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

    // -- Publish a draft sub-requirement --
    publishSubRequirement: tool({
      description:
        "Publish a sub-requirement, changing its status from DRAFT to PUBLISHED. " +
        "The parent product requirement must already be PUBLISHED. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the sub-requirement to publish"),
        confirmPublish: z.literal(true).describe("Must be true to confirm publishing"),
      }),
      execute: async (args) => {
        try {
          const result = await publishSubRequirement(args.id, ctx);
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

    // -- Obsolete a published sub-requirement --
    obsoleteSubRequirement: tool({
      description:
        "Mark a published sub-requirement as obsolete. " +
        "Only PUBLISHED sub-requirements can be obsoleted. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the sub-requirement to obsolete"),
        confirmObsolete: z.literal(true).describe("Must be true to confirm obsoleting"),
      }),
      execute: async (args) => {
        try {
          const result = await obsoleteSubRequirement(args.id, ctx);
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
