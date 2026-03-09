// Barrel export - creates all LLM tools as a flat object.
// Pass a RequestContext to bind mutation tools to the current user.

import type { RequestContext } from "@/lib/request-context";
import { createProductRequirementTools } from "./product-requirement-tools";
import { createSubRequirementTools } from "./sub-requirement-tools";
import { createTestProcedureTools } from "./test-procedure-tools";
import { createTestCaseTools } from "./test-case-tools";
import { createReadTools } from "./read-tools";
import { createQueryTools } from "./query-tools";

/**
 * Creates all LLM tools, bound to the given RequestContext.
 *
 * Mutation tools use the context for auth and audit logging.
 * Read/query tools don't need context (they use Prisma directly).
 *
 * Returns a flat object suitable for passing to Vercel AI SDK's streamText().
 */
export function createAllTools(ctx: RequestContext) {
  return {
    ...createProductRequirementTools(ctx),
    ...createSubRequirementTools(ctx),
    ...createTestProcedureTools(ctx),
    ...createTestCaseTools(ctx),
    ...createReadTools(),
    ...createQueryTools(),
  };
}

// Re-export individual creators for cases where only a subset is needed
export { createProductRequirementTools } from "./product-requirement-tools";
export { createSubRequirementTools } from "./sub-requirement-tools";
export { createTestProcedureTools } from "./test-procedure-tools";
export { createTestCaseTools } from "./test-case-tools";
export { createReadTools } from "./read-tools";
export { createQueryTools } from "./query-tools";
