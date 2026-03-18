// Renders a single chat message row.
// Assistant messages sit directly on background (no card). User messages in cool gray bubble.
// See docs/design/plm-redesign-spec-v3.md Section 6.1 for design rules.

"use client";

import { memo } from "react";
import type { UIMessage } from "ai";
import type { ToolPartShape } from "@/types/panel";
import ReactMarkdown from "react-markdown";
import { ToolIndicator, ToolGroup } from "./tool-indicator";
import { ConfirmButtons } from "./confirm-buttons";
import { ThinkingIndicator } from "./thinking-indicator";

// Prefix and suffix for system notes injected by panel actions.
// These are assistant messages that log UI mutations (e.g. edits, approvals)
// without triggering an LLM response. Rendered as muted centered text.
const SYSTEM_NOTE_PREFIX = "[System Note: ";
const SYSTEM_NOTE_SUFFIX = "]";

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

export const MessageBubble = memo(function MessageBubble({
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

  // System notes are assistant messages injected by panel actions (not the LLM).
  // Render them as muted, centered, inline notifications instead of chat bubbles.
  if (
    !isUser &&
    fullText.startsWith(SYSTEM_NOTE_PREFIX) &&
    fullText.endsWith(SYSTEM_NOTE_SUFFIX)
  ) {
    const noteText = fullText.slice(
      SYSTEM_NOTE_PREFIX.length,
      -SYSTEM_NOTE_SUFFIX.length,
    );
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs italic text-text-muted">
          {noteText}
        </span>
      </div>
    );
  }

  // Check if any tools are still executing (for thinking indicator).
  // Tool parts start as "input-streaming"/"input-available" then become "output-available"/"output-error".
  const hasRunningTools =
    toolParts.length > 0 &&
    toolParts.some((p) => {
      const state = (p as ToolPartShape).state;
      return state === "input-streaming" || state === "input-available";
    });

  // Check if this message is asking for confirmation (only for assistant).
  // Gate on !isStreaming so buttons appear after the full explanation is visible (#59).
  const isAskingConfirmation =
    !isUser &&
    !isStreaming &&
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
            {/* Show cycling PLM phrases while tools are running (#56). */}
            {hasRunningTools && <ThinkingIndicator />}
          </div>
        )}

        {/* Message content */}
        {fullText && (
          <div
            className={
              isUser
                ? "rounded-[20px] rounded-br-[4px] px-4 py-2.5 bg-surface-hover text-text"
                : ""
            }
          >
            {isUser ? (
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {fullText}
              </p>
            ) : (
              <div className="chat-markdown">
                <ReactMarkdown skipHtml={true}>{fullText}</ReactMarkdown>
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
                <span className="sr-only">Assistant is typing...</span>
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
});
