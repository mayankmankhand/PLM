// Renders a single chat message row.
// All messages are left-aligned in a centered column (modern AI chat style).
// User messages get a white elevated card; assistant messages are transparent.

"use client";

import type { UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Bot } from "lucide-react";
import { ToolIndicator } from "./tool-indicator";
import { ConfirmButtons } from "./confirm-buttons";

// Keywords that signal the AI is asking for confirmation.
// Used to show accept/reject buttons on the message.
const CONFIRM_KEYWORDS = [
  "do you want to proceed",
  "shall i proceed",
  "would you like to proceed",
  "confirm",
  "are you sure",
  "go ahead",
  "do you want me to",
  "shall i go ahead",
  "would you like me to",
];

interface MessageBubbleProps {
  message: UIMessage;
  isStreaming: boolean;
  showConfirmButtons: boolean;
  onConfirm: () => void;
  onReject: () => void;
}

export function MessageBubble({
  message,
  isStreaming,
  showConfirmButtons,
  onConfirm,
  onReject,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Extract text content and tool parts from the message.
  const textParts = message.parts.filter((p) => p.type === "text");
  const toolParts = message.parts.filter(
    (p) => p.type === "dynamic-tool" || p.type.startsWith("tool-"),
  );

  // Combine all text parts into one string for rendering.
  const fullText = textParts.map((p) => p.text).join("");

  // Check if this message is asking for confirmation (only for assistant).
  const isAskingConfirmation =
    !isUser &&
    showConfirmButtons &&
    CONFIRM_KEYWORDS.some((kw) => fullText.toLowerCase().includes(kw));

  return (
    <div className="flex gap-3">
      {/* Avatar - only for assistant messages */}
      <div className="flex-shrink-0 w-7 h-7 mt-1">
        {!isUser && (
          <div className="w-7 h-7 rounded-lg bg-primary-soft flex items-center justify-center">
            <Bot size={16} className="text-primary" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Sender label */}
        <p className="text-xs font-medium text-text-muted mb-1">
          {isUser ? "You" : "PLM Assistant"}
        </p>

        {/* Tool call indicators (shown above the message text) */}
        {toolParts.length > 0 && (
          <div className="mb-2 space-y-1.5">
            {toolParts.map((part) => {
              const toolPart = part as {
                type: string;
                toolName?: string;
                toolCallId: string;
                state: string;
              };
              const toolName =
                toolPart.toolName ?? toolPart.type.replace("tool-", "");
              return (
                <ToolIndicator
                  key={toolPart.toolCallId}
                  toolName={toolName}
                  state={toolPart.state}
                />
              );
            })}
          </div>
        )}

        {/* Message content */}
        {fullText && (
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-surface-elevated border border-border text-text"
                : ""
            }`}
          >
            {isUser ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {fullText}
              </p>
            ) : (
              <div className="chat-markdown">
                <ReactMarkdown>{fullText}</ReactMarkdown>
              </div>
            )}

            {/* Streaming indicator - reserves min-height to prevent CLS */}
            {isStreaming && !isUser && (
              <div className="streaming-indicator flex items-center">
                <span className="inline-block w-1.5 h-5 bg-primary/60 animate-pulse ml-0.5 rounded-sm" />
              </div>
            )}
          </div>
        )}

        {/* Confirmation buttons */}
        {isAskingConfirmation && (
          <ConfirmButtons onConfirm={onConfirm} onReject={onReject} />
        )}
      </div>
    </div>
  );
}
