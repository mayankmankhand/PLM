// LLM tools for product requirement mutations.
// Each tool wraps a service function and never throws.

import { tool } from "ai";
import { z } from "zod";
import type { RequestContext } from "@/lib/request-context";
import {
  createProductRequirement,
  updateProductRequirement,
  publishProductRequirement,
  obsoleteProductRequirement,
} from "@/services/product-requirement.service";
import { formatToolError } from "./tool-wrapper";

export function createProductRequirementTools(ctx: RequestContext) {
  return {
    // -- Create a new product requirement (starts as DRAFT) --
    createProductRequirement: tool({
      description:
        "Create a new product requirement. It starts in DRAFT status. " +
        "Requires a title and description.",
      inputSchema: z.object({
        title: z.string().min(1).max(255).describe("Short title for the requirement"),
        description: z.string().min(1).describe("Detailed description of what is required"),
      }),
      execute: async (args) => {
        try {
          const result = await createProductRequirement(
            { title: args.title, description: args.description },
            ctx
          );
          return {
            id: result.id,
            title: result.title,
            status: result.status,
            createdAt: result.createdAt,
          };
        } catch (error) {
          return { error: formatToolError(error) };
        }
      },
    }),

    // -- Update a draft product requirement --
    updateProductRequirement: tool({
      description:
        "Update a product requirement that is still in DRAFT status. " +
        "At least one of title or description must be provided.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the product requirement to update"),
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

          const result = await updateProductRequirement(args.id, input, ctx);
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

    // -- Publish a draft product requirement --
    publishProductRequirement: tool({
      description:
        "Publish a product requirement, changing its status from DRAFT to PUBLISHED. " +
        "This is irreversible. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the product requirement to publish"),
        confirmPublish: z.literal(true).describe("Must be true to confirm publishing"),
      }),
      execute: async (args) => {
        try {
          const result = await publishProductRequirement(args.id, ctx);
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

    // -- Obsolete a published product requirement --
    obsoleteProductRequirement: tool({
      description:
        "Mark a published product requirement as obsolete. " +
        "Only PUBLISHED requirements can be obsoleted. " +
        "IMPORTANT: Only call this tool after the user has explicitly confirmed this action in their last message.",
      inputSchema: z.object({
        id: z.string().uuid().describe("ID of the product requirement to obsolete"),
        confirmObsolete: z.literal(true).describe("Must be true to confirm obsoleting"),
      }),
      execute: async (args) => {
        try {
          const result = await obsoleteProductRequirement(args.id, ctx);
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
