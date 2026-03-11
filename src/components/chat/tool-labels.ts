// Human-readable labels for LLM tool names.
// Used by the tool call visualization to show friendly descriptions
// instead of camelCase function names.

const TOOL_LABELS: Record<string, string> = {
  // Product Requirement mutations
  createProductRequirement: "Creating product requirement",
  updateProductRequirement: "Updating product requirement",
  publishProductRequirement: "Publishing product requirement",
  obsoleteProductRequirement: "Marking product requirement as obsolete",

  // Sub-Requirement mutations
  createSubRequirement: "Creating sub-requirement",
  updateSubRequirement: "Updating sub-requirement",
  publishSubRequirement: "Publishing sub-requirement",
  obsoleteSubRequirement: "Marking sub-requirement as obsolete",

  // Test Procedure mutations
  createTestProcedure: "Creating test procedure",
  createTestProcedureVersion: "Creating test procedure version",
  obsoleteTestProcedure: "Marking test procedure as obsolete",

  // Test Case mutations
  createTestCase: "Creating test case",
  recordTestResult: "Recording test result",
  invalidateTestCase: "Invalidating test case",

  // Read tools
  getProductRequirement: "Looking up product requirement",
  getSubRequirement: "Looking up sub-requirement",
  getTestProcedure: "Looking up test procedure",
  getTestProcedureVersion: "Looking up test procedure version",
  getTestCase: "Looking up test case",

  // Query tools
  getTraceabilityChain: "Tracing requirement chain",
  getUncoveredSubRequirements: "Checking coverage gaps",
  getProceduresWithoutTestCases: "Finding procedures without test cases",
  getRecentAuditLog: "Fetching audit log",

  // Search
  searchByTitle: "Searching by title",

  // UI intent tools (open context panel)
  showEntityDetail: "Showing in panel",
  showTable: "Showing table in panel",
  showDiagram: "Showing diagram in panel",
};

// UI intent tool names - these open the context panel.
// Used by message-bubble to render compact summaries instead of raw JSON.
export const UI_INTENT_TOOLS = new Set([
  "showEntityDetail",
  "showTable",
  "showDiagram",
]);

/**
 * Returns a human-readable label for a tool name.
 * Falls back to a formatted version of the tool name if not mapped.
 */
export function getToolLabel(toolName: string): string {
  if (TOOL_LABELS[toolName]) {
    return TOOL_LABELS[toolName];
  }
  // Fallback: convert camelCase to spaced words (e.g. "someNewTool" -> "Some new tool")
  const spaced = toolName.replace(/([A-Z])/g, " $1").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
