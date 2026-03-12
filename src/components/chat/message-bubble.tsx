// Renders a single chat message row.
// Assistant messages sit directly on background (no card). User messages in cool gray bubble.
// See plm-redesign-spec-v3.md Section 6.1 for design rules.

"use client";

import type { UIMessage } from "ai";
import type { ToolPartShape } from "@/types/panel";
import ReactMarkdown from "react-markdown";
import { ToolIndicator, ToolGroup } from "./tool-indicator";
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
    <div className={isUser ? "flex justify-end" : ""}>
      <div className={isUser ? "max-w-[85%]" : "w-full"}>
        {/* Tool call indicators - vertical stack, grouped when multiple */}
        {toolParts.length > 0 && (
          <div className="mb-2">
            <ToolGroup count={toolParts.length}>
              {toolParts.map((part) => {
                const toolPart = part as ToolPartShape;
                const toolName =
                  toolPart.toolName ?? toolPart.type.replace("tool-", "");
                return (
                  <ToolIndicator
                    key={toolPart.toolCallId}
                    toolName={toolName}
                    state={toolPart.state}
                    output={toolPart.output}
                  />
                );
              })}
            </ToolGroup>
          </div>
        )}

        {/* Message content */}
        {fullText && (
          <div
            className={
              isUser
                ? "rounded-2xl px-4 py-2.5 bg-surface-hover text-text"
                : ""
            }
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

            {/* Streaming indicator - three-dot CSS pulse animation */}
            {isStreaming && !isUser && (
              <div className="streaming-indicator flex items-center mt-1">
                <span className="streaming-dots">
                  <span />
                  <span />
                  <span />
                </span>
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
