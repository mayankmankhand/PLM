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

// 50KB cap - prevents oversized payloads from burning LLM tokens.
const MAX_BODY_BYTES = 51_200;

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

    // Fast-path: reject obviously oversized payloads via Content-Length header.
    // This is cheap (no body read) but advisory - the header can be spoofed.
    const contentLength = parseInt(request.headers.get("content-length") ?? "0", 10);
    if (contentLength > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request too large. Maximum size is 50KB." }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build RequestContext from middleware headers (same pattern as other routes).
    // This identifies which demo user is chatting.
    const ctx = { ...getRequestContext(request), source: "chat" as const };

    // Real enforcement: read body as text and check actual byte length.
    // Catches cases where Content-Length is missing, spoofed, or stripped by proxies.
    // Uses TextEncoder to measure UTF-8 bytes (not JS string length, which counts
    // UTF-16 code units and would undercount multi-byte characters).
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return new Response(
        JSON.stringify({ error: "Request too large. Maximum size is 50KB." }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }

    // Parse the request body. The Vercel AI SDK's useChat sends UIMessages
    // with a `parts` array (text, tool calls, tool results). We use
    // convertToModelMessages() to transform them into the format streamText expects.
    // No custom Zod validation here - the SDK handles the message contract.
    const body = JSON.parse(rawBody);
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
      // Model is configurable via ANTHROPIC_MODEL env var in .env.local.
      // Defaults to Haiku 4.5 - swap to Sonnet 4.6 when ready.
      model: anthropic(process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001"),
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
