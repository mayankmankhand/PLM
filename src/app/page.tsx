// Main chat page - composes all chat components into a full-page layout.
// Uses Vercel AI SDK's useChat hook for message state and streaming.
// Sends the selected demo user ID via custom headers on every request.

"use client";

import { useState, useCallback, useMemo } from "react";
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

export default function ChatPage() {
  // Track which demo user is selected. Changing users resets the chat.
  const [userId, setUserId] = useState<DemoUserId>(DEFAULT_USER_ID);

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

  // Switching users clears the conversation (fresh context).
  const handleUserChange = useCallback(
    (newUserId: DemoUserId) => {
      setUserId(newUserId);
      setInput("");
    },
    [],
  );

  // Chat is not ready to accept input while streaming or submitting.
  const isBusy = chat.status === "streaming" || chat.status === "submitted";

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
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
  );
}
