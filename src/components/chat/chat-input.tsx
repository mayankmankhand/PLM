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
}

export function ChatInput({
  input,
  onInputChange,
  onSend,
  isDisabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea on mount.
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Re-focus after the AI finishes responding.
  useEffect(() => {
    if (!isDisabled) {
      textareaRef.current?.focus();
    }
  }, [isDisabled]);

  // Auto-resize the textarea to fit content (up to ~6 lines).
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
    }
  }, [input]);

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
    <div className="bg-slate-50 px-4 pb-4 pt-2">
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm
                   flex items-end gap-2 px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message PLM Assistant..."
          disabled={isDisabled}
          rows={1}
          className="flex-1 resize-none bg-transparent py-1
                     text-[15px] text-text placeholder:text-text-muted
                     focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isDisabled || !input.trim()}
          className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary text-white
                     flex items-center justify-center
                     hover:bg-primary/90 transition-colors duration-150
                     focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-30 disabled:cursor-not-allowed
                     cursor-pointer"
          aria-label="Send message"
        >
          <SendHorizontal size={16} />
        </button>
      </form>
    </div>
  );
}
