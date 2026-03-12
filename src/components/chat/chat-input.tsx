// Chat composer with elevated card design.
// Enter sends the message, Shift+Enter adds a newline.
// Disabled while the AI is streaming a response.

"use client";

import { useRef, useEffect, type KeyboardEvent, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
  composerRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  isDisabled,
  composerRef,
}: ChatInputProps) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  // Use external ref if provided, otherwise use internal
  const textareaRef = composerRef ?? internalRef;

  // Auto-focus the textarea on mount.
  useEffect(() => {
    textareaRef.current?.focus();
  }, [textareaRef]);

  // Re-focus after the AI finishes responding.
  useEffect(() => {
    if (!isDisabled) {
      textareaRef.current?.focus();
    }
  }, [isDisabled, textareaRef]);

  // Auto-resize the textarea to fit content (up to ~6 lines).
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
    }
  }, [input, textareaRef]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter adds a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isDisabled) {
        onSend();
      }
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (input.trim() && !isDisabled) {
      onSend();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white border border-border
                 shadow
                 p-3 flex flex-col gap-2"
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask about requirements, tests, or traceability..."
        disabled={isDisabled}
        rows={1}
        className="flex-1 resize-none bg-transparent
                   min-h-[44px] max-h-[200px]
                   text-[15px] text-text placeholder:text-text-subtle
                   focus:outline-none
                   disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Chat message input"
      />
      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isDisabled || !input.trim()}
          className="flex-shrink-0 rounded-lg bg-primary text-white px-3 py-1.5
                     flex items-center justify-center
                     hover:bg-primary-hover transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white
                     disabled:opacity-30 disabled:cursor-not-allowed
                     cursor-pointer"
          aria-label="Send message"
        >
          <SendHorizontal size={16} />
        </button>
      </div>
    </form>
  );
}
