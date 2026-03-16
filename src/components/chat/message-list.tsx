// Renders the scrollable list of chat messages.
// Handles auto-scrolling to the bottom when new messages arrive,
// and shows an empty state when the conversation hasn't started.

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { UIMessage } from "ai";
import { ArrowDown } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ThinkingIndicator } from "./thinking-indicator";

// Suggestion chips shown on the empty state to help users get started.
const SUGGESTIONS = [
  "Show all requirements",
  "What's untested?",
  "GPS traceability diagram",
  "Recent audit log",
  "Failed test cases",
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollPill, setShowScrollPill] = useState(false);

  // Check if user is near the bottom (within 200px)
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  }, []);

  // Auto-scroll only when user is near the bottom
  useEffect(() => {
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowScrollPill(false);
    } else {
      // User is scrolled up - show pill if there's a new message
      setShowScrollPill(true);
    }
  }, [messages, status, isNearBottom]);

  // Track scroll position to hide/show the pill
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    function handleScroll() {
      if (isNearBottom()) setShowScrollPill(false);
    }
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [isNearBottom]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollPill(false);
  }

  const handleChipClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const text = e.currentTarget.dataset.suggestion;
      if (text) onSendMessage(text);
    },
    [onSendMessage]
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center pt-[18vh] pb-6 px-4">
        <div className="max-w-3xl w-full text-center">
          {/* Clean text-only empty state - no icons, no images */}
          <h2 className="text-2xl font-semibold text-text">
            What would you like to work on?
          </h2>
          <p className="text-[15px] text-text-muted mt-2">
            Ask about requirements, test cases, or traceability.
          </p>

          {/* Suggestion chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                data-suggestion={suggestion}
                onClick={handleChipClick}
                className="px-4 py-2 rounded-full border border-border text-[13px] font-medium text-text
                           hover:bg-surface-hover hover:border-primary/30
                           transition-all duration-150
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
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

  // Suppress the list-level ThinkingIndicator once the latest assistant message
  // has tool parts - the bubble-level indicator inside MessageBubble takes over.
  // This prevents two ThinkingIndicators from showing simultaneously.
  const lastAssistant = lastAssistantIndex >= 0 ? messages[lastAssistantIndex] : null;
  const lastMessageHasTools = lastAssistant?.parts.some(
    (p) => p.type === "dynamic-tool" || p.type.startsWith("tool-"),
  ) ?? false;

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative">
      <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.id}-${index}`}
            message={message}
            isStreaming={
              status === "streaming" && index === lastAssistantIndex
            }
            showConfirmButtons={index === lastAssistantIndex}
            onConfirm={onConfirm}
            onReject={onReject}
          />
        ))}
        {/* Show thinking indicator while waiting for first AI token.
            Suppressed when the latest message already has tools (bubble-level indicator handles it). */}
        {status === "submitted" && !lastMessageHasTools && <ThinkingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* "New message" scroll pill - shown when user is scrolled up */}
      {showScrollPill && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to latest message"
          className="absolute bottom-4 left-1/2 -translate-x-1/2
                     bg-primary text-white rounded-full px-4 py-1.5 text-sm
                     shadow-lg cursor-pointer
                     flex items-center gap-1.5
                     hover:bg-primary-hover transition-colors"
        >
          Scroll to bottom
          <ArrowDown size={14} />
        </button>
      )}
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
