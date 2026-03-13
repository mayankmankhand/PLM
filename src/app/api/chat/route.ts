// Chat endpoint - streams LLM responses with tool execution.
// Uses Vercel AI SDK streamText with stopWhen for automatic ReAct looping.

import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { getRequestContext } from "@/lib/request-context";
import { handleApiError } from "@/lib/api-utils";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createAllTools } from "@/lib/ai/tools";
import { createTraceLogger } from "@/lib/ai/trace-logger";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP before doing any real work.
    // Protects the Anthropic API bill from abuse.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: `Too many requests. Please try again in ${rateCheck.retryAfter} seconds.`,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rateCheck.retryAfter),
          },
        },
      );
    }

    // Build RequestContext from middleware headers (same pattern as other routes).
    // This identifies which demo user is chatting.
    const ctx = getRequestContext(request);

    // Parse the request body. The Vercel AI SDK's useChat sends UIMessages
    // with a `parts` array (text, tool calls, tool results). We use
    // convertToModelMessages() to transform them into the format streamText expects.
    // No custom Zod validation here - the SDK handles the message contract.
    const body = await request.json();
    const { messages: uiMessages } = body;

    if (!Array.isArray(uiMessages) || uiMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Convert UIMessages (with parts) to ModelMessages (with content/tool_calls)
    // that streamText can process. This handles the format difference between
    // what useChat sends and what the LLM expects.
    const modelMessages = await convertToModelMessages(uiMessages);

    // Create all tools bound to the current user's context.
    // Mutation tools use ctx for auth and audit logging.
    const tools = createAllTools(ctx);

    // Create a trace logger for this request.
    // Logs tool call sequences as structured JSON for debugging.
    const tracer = createTraceLogger(ctx.requestId, ctx.userId);

    // Stream the response with automatic tool execution.
    // stopWhen: stepCountIs(10) allows up to 10 tool-call rounds per message.
    // For example, "create a requirement and publish it" needs 2 steps.
    // Default is stepCountIs(1) which would stop after one tool call.
    const result = streamText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: buildSystemPrompt(),
      messages: modelMessages,
      tools,
      stopWhen: stepCountIs(10),
      onStepFinish: tracer.onStepFinish,
    });

    // Return the streaming response in Vercel AI SDK UIMessage stream format.
    // This format supports tool call/result streaming for frontend consumption.
    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
