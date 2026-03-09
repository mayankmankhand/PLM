// Chat endpoint - streams LLM responses with tool execution.
// Uses Vercel AI SDK streamText with stopWhen for automatic ReAct looping.

import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getRequestContext } from "@/lib/request-context";
import { handleApiError } from "@/lib/api-utils";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { createAllTools } from "@/lib/ai/tools";
import { createTraceLogger } from "@/lib/ai/trace-logger";

// Validates the chat request body.
// Vercel AI SDK sends messages as an array of { role, content } objects.
const ChatRequestBody = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().min(1),
    })
  ).min(1, "At least one message is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Build RequestContext from middleware headers (same pattern as other routes).
    // This identifies which demo user is chatting.
    const ctx = getRequestContext(request);

    // Parse and validate the messages array from the request body.
    const body = await request.json();
    const { messages } = ChatRequestBody.parse(body);

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
      messages,
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
