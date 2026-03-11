// Renders the scrollable list of chat messages.
// Handles auto-scrolling to the bottom when new messages arrive,
// and shows an empty state when the conversation hasn't started.

"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { MessageSquare } from "lucide-react";
import { MessageBubble } from "./message-bubble";

// Suggestion chips shown on the empty state to help users get started.
const SUGGESTIONS = [
  "What product requirements exist?",
  "Create a new product requirement",
  "Show me coverage gaps",
  "What's in the audit log?",
];

interface MessageListProps {
  messages: UIMessage[];
  status: string;
  onConfirm: () => void;
  onReject: () => void;
  onSendMessage: (text: string) => void;
}

export function MessageList({
  messages,
  status,
  onConfirm,
  onReject,
  onSendMessage,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or while streaming.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-end px-6 py-6 pb-8">
        <div className="max-w-3xl mx-auto w-full">
          {/* Welcome content - oversized low-opacity icon with warm typography */}
          <div className="mb-8 text-center">
            <MessageSquare
              size={56}
              strokeWidth={1.2}
              className="text-text-muted opacity-25 mx-auto mb-4"
            />
            <h2 className="text-lg font-semibold text-text mb-1">
              PLM Assistant
            </h2>
            <p className="text-sm text-text-muted">
              Manage requirements, test procedures, and test cases.
            </p>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onSendMessage(suggestion)}
                className="px-3.5 py-2 text-sm text-text bg-surface-elevated border border-border
                           rounded-xl hover:border-primary/30 hover:shadow-sm
                           transition-all duration-150
                           focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                           cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Check if the last assistant message is asking for confirmation.
  // Used to show confirm/reject buttons on only the latest message.
  const lastAssistantIndex = findLastAssistantIndex(messages);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={
              status === "streaming" && index === messages.length - 1
            }
            showConfirmButtons={index === lastAssistantIndex}
            onConfirm={onConfirm}
            onReject={onReject}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/** Finds the index of the last assistant message in the array. */
function findLastAssistantIndex(messages: UIMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return i;
  }
  return -1;
}
