// Lightweight LLM trace logging for debugging.
// Logs tool call sequences as structured JSON to console.
// Designed to hook into Vercel AI SDK's onStepFinish callback.

/**
 * Truncates a string to maxLen characters, appending "..." if truncated.
 */
function truncate(value: unknown, maxLen = 100): string {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (!str) return "";
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

/**
 * Extracts loggable fields from tool call args.
 * Keeps IDs and short fields, truncates long text content.
 */
function summarizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.length > 100) {
      summary[key] = truncate(value);
    } else {
      summary[key] = value;
    }
  }
  return summary;
}

/**
 * Extracts entity IDs and error info from a tool result.
 */
function summarizeResult(result: unknown): { entityId?: string; error?: string } {
  if (!result || typeof result !== "object") return {};

  const obj = result as Record<string, unknown>;

  // Check for error response from our tool wrapper
  if (typeof obj.error === "string") {
    return { error: truncate(obj.error, 200) };
  }

  // Extract entity ID if present
  if (typeof obj.id === "string") {
    return { entityId: obj.id };
  }

  return {};
}

interface TraceLogEntry {
  timestamp: string;
  requestId: string;
  userId: string;
  stepNumber: number;
  toolCalls: Array<{
    toolName: string;
    args: Record<string, unknown>;
    entityId?: string;
    error?: string;
  }>;
  finishReason: string;
  elapsedMs?: number;
}

/**
 * Creates a trace logger bound to a specific request.
 * Returns an onStepFinish callback for streamText.
 *
 * Usage:
 *   const tracer = createTraceLogger(ctx.requestId, ctx.userId);
 *   streamText({ ..., onStepFinish: tracer.onStepFinish });
 */
export function createTraceLogger(requestId: string, userId: string) {
  const startTime = Date.now();

  return {
    // Hook into streamText's onStepFinish callback.
    // Called after each LLM call + tool execution round.
    // Uses the StepResult type from Vercel AI SDK - we access fields
    // that exist on all StepResult variants.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onStepFinish(event: any) {
      const stepNumber: number = event.stepNumber ?? 0;
      const finishReason: string = event.finishReason ?? "unknown";

      // toolCalls is an array of { toolName, args } objects
      const toolCalls: Array<{ toolName: string; args: Record<string, unknown> }> =
        event.toolCalls ?? [];

      // Only log steps that include tool calls (skip pure text responses)
      if (toolCalls.length === 0) return;

      // toolResults is an array of { toolName, result } objects
      const toolResults: Array<{ toolName: string; result: unknown }> =
        event.toolResults ?? [];

      // Build a results map for quick lookup by tool name
      const resultsMap = new Map<string, unknown>();
      for (const tr of toolResults) {
        resultsMap.set(tr.toolName, tr.result);
      }

      const entry: TraceLogEntry = {
        timestamp: new Date().toISOString(),
        requestId,
        userId,
        stepNumber,
        toolCalls: toolCalls.map((tc) => {
          const resultSummary = summarizeResult(resultsMap.get(tc.toolName));
          return {
            toolName: tc.toolName,
            args: summarizeArgs(tc.args),
            ...resultSummary,
          };
        }),
        finishReason,
        elapsedMs: Date.now() - startTime,
      };

      console.log("[llm-trace]", JSON.stringify(entry));
    },
  };
}
