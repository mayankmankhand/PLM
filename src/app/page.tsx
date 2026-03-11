// Main chat page - dual-panel layout with chat left and context panel right.
// Uses Vercel AI SDK's useChat hook for message state and streaming.
// Sends the selected demo user ID via custom headers on every request.
// Panel is controlled by the AI via UI intent tools (Zustand store).

"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot } from "lucide-react";
import {
  MessageList,
  ChatInput,
  UserPicker,
  DEFAULT_USER_ID,
} from "@/components/chat";
import type { DemoUserId } from "@/components/chat";
import { UI_INTENT_TOOLS } from "@/components/chat/tool-labels";
import { ContextPanel } from "@/components/panel/context-panel";
import { usePanelStore } from "@/stores/panel-store";
import { PanelContentSchema } from "@/types/panel";

export default function ChatPage() {
  // Track which demo user is selected. Changing users resets the chat.
  const [userId, setUserId] = useState<DemoUserId>(DEFAULT_USER_ID);

  // Panel state - reset on user switch
  const resetPanel = usePanelStore((s) => s.reset);

  // Memoize the transport so it only recreates when the user changes.
  // The transport adds the demo user header to every request.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        headers: { "x-demo-user-id": userId },
      }),
    [userId],
  );

  // useChat manages message state, streaming, and API communication.
  // Changing the id resets the conversation (fresh messages).
  const chat = useChat({ id: userId, transport });

  // Local input state (useChat v6 doesn't manage input for us).
  const [input, setInput] = useState("");

  // Send a message via the chat hook.
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    chat.sendMessage({ text });
  }, [input, chat]);

  // Send a specific text message (used by suggestion chips and confirm buttons).
  const handleSendMessage = useCallback(
    (text: string) => {
      chat.sendMessage({ text });
    },
    [chat],
  );

  // Confirmation button handlers inject a message into the chat.
  const handleConfirm = useCallback(() => {
    chat.sendMessage({ text: "Yes, proceed." });
  }, [chat]);

  const handleReject = useCallback(() => {
    chat.sendMessage({ text: "No, cancel." });
  }, [chat]);

  // Switching users clears the conversation and panel.
  const handleUserChange = useCallback(
    (newUserId: DemoUserId) => {
      setUserId(newUserId);
      setInput("");
      resetPanel();
      processedToolCalls.current.clear();
    },
    [resetPanel],
  );

  // Track which tool results we've already processed to avoid duplicates.
  const processedToolCalls = useRef(new Set<string>());

  // Watch chat messages for UI intent tool results.
  // When a UI intent tool completes, push its output to the panel store.
  useEffect(() => {
    const messages = chat.messages;
    if (messages.length === 0) return;

    // Scan all assistant messages (not just the last one) for new tool results.
    // This handles the case where multiple tool calls complete in one turn.
    for (const msg of messages) {
      if (msg.role !== "assistant") continue;

      for (const part of msg.parts) {
        // Tool parts arrive as "tool-{toolName}" (e.g. "tool-showTable").
        // Match the same broad filter used in message-bubble.tsx.
        if (part.type !== "dynamic-tool" && !part.type.startsWith("tool-")) continue;

        const toolPart = part as {
          type: string;
          toolName?: string;
          toolCallId: string;
          state: string;
          output?: unknown;
          errorText?: string;
        };

        // Extract tool name: prefer explicit toolName, fall back to type prefix.
        const toolName = toolPart.toolName ?? toolPart.type.replace("tool-", "");

        // Only process UI intent tools
        if (!UI_INTENT_TOOLS.has(toolName)) continue;

        // Skip if already processed
        if (processedToolCalls.current.has(toolPart.toolCallId)) continue;

        // Handle completed tool results
        if (toolPart.state === "output-available" && toolPart.output) {
          const output = toolPart.output as Record<string, unknown>;

          // Check if the tool returned an error
          if ("error" in output && typeof output.error === "string") {
            usePanelStore.getState().showError(toolName, output.error);
          } else {
            // Validate output against Zod schema before sending to store.
            // Tool output crosses a network boundary (SDK serialization),
            // so we treat it as untrusted and validate at consumption.
            const parsed = PanelContentSchema.safeParse(output);
            if (parsed.success) {
              switch (parsed.data.type) {
                case "detail":
                  usePanelStore.getState().showDetail(parsed.data);
                  break;
                case "table":
                  usePanelStore.getState().showTable(parsed.data);
                  break;
                case "diagram":
                  usePanelStore.getState().showDiagram(parsed.data);
                  break;
              }
            } else {
              usePanelStore.getState().showError(
                toolName,
                "Received malformed panel data from tool",
              );
            }
          }
          processedToolCalls.current.add(toolPart.toolCallId);
        }

        // Handle tool errors
        if (toolPart.state === "output-error" && toolPart.errorText) {
          usePanelStore.getState().showError(toolName, toolPart.errorText);
          processedToolCalls.current.add(toolPart.toolCallId);
        }
      }
    }
  }, [chat.messages]);

  // Chat is not ready to accept input while streaming or submitting.
  const isBusy = chat.status === "streaming" || chat.status === "submitted";

  return (
    <div className="flex h-dvh bg-background">
      {/* Chat column - compresses when panel is open on desktop */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-200 ease-out"
      >
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3 bg-surface-elevated border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
              <Bot size={18} className="text-primary" />
            </div>
            <h1 className="text-lg font-semibold text-text">PLM Assistant</h1>
          </div>
          <UserPicker selectedUserId={userId} onUserChange={handleUserChange} />
        </header>

        {/* Message list */}
        <MessageList
          messages={chat.messages}
          status={chat.status}
          onConfirm={handleConfirm}
          onReject={handleReject}
          onSendMessage={handleSendMessage}
        />

        {/* Error display */}
        {chat.error && (
          <div className="px-4 py-2 bg-danger/10 border-t border-danger/20">
            <p className="text-sm text-danger max-w-4xl mx-auto">
              Something went wrong. Please try again.
            </p>
          </div>
        )}

        {/* Composer */}
        <ChatInput
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          isDisabled={isBusy}
        />
      </div>

      {/* Context panel - slides in from right, controlled by AI tools */}
      <ContextPanel />
    </div>
  );
}
