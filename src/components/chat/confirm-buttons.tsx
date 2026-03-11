// Accept/Reject buttons shown when the AI asks for confirmation
// before a destructive action (approve, cancel, skip).
// Clicking either button sends a pre-written message via the chat.

"use client";

import { Check, X } from "lucide-react";

interface ConfirmButtonsProps {
  onConfirm: () => void;
  onReject: () => void;
}

export function ConfirmButtons({ onConfirm, onReject }: ConfirmButtonsProps) {
  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={onConfirm}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium
                   bg-success text-white rounded-lg
                   hover:bg-success/90 transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2
                   cursor-pointer"
        aria-label="Confirm action"
      >
        <Check size={14} />
        Yes, proceed
      </button>
      <button
        onClick={onReject}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium
                   bg-surface-elevated text-text border border-border rounded-lg
                   hover:bg-surface transition-colors duration-150
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                   cursor-pointer"
        aria-label="Reject action"
      >
        <X size={14} />
        No, cancel
      </button>
    </div>
  );
}
