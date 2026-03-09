// Renders a single chat message row.
// All messages are left-aligned in a centered column (modern AI chat style).
// User messages get a subtle gray background; assistant messages are transparent.

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
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
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
          <div className="mb-2 space-y-1">
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
                ? "bg-slate-100 text-text"
                : "bg-white border border-slate-200/60"
            }`}
          >
            {isUser ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {fullText}
              </p>
            ) : (
              <div className="text-[15px] leading-7 text-text [&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:my-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:my-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:my-2 [&_code]:text-sm [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-primary [&_pre]:my-3 [&_pre]:bg-slate-50 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-primary [&_a]:underline [&_ul]:pl-5 [&_ol]:pl-5 [&_ul]:list-disc [&_ol]:list-decimal">
                <ReactMarkdown>{fullText}</ReactMarkdown>
              </div>
            )}

            {/* Streaming indicator */}
            {isStreaming && !isUser && (
              <span className="inline-block w-1.5 h-5 bg-primary/50 animate-pulse ml-0.5 rounded-sm" />
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
