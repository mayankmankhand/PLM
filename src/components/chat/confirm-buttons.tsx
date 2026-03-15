// Confirmation UI shown when the AI asks before a destructive action.
// Wrapped in a surface container with border. After the user clicks
// Accept/Reject, collapses to a one-liner with icon and timestamp.
// See docs/design/plm-redesign-spec-v3.md Section 6.4.

"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";

interface ConfirmButtonsProps {
  onConfirm: () => void;
  onReject: () => void;
}

type Resolution = { action: "accepted" | "rejected"; time: string } | null;

export function ConfirmButtons({ onConfirm, onReject }: ConfirmButtonsProps) {
  const [resolution, setResolution] = useState<Resolution>(null);

  function handleAccept() {
    setResolution({
      action: "accepted",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
    onConfirm();
  }

  function handleReject() {
    setResolution({
      action: "rejected",
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    });
    onReject();
  }

  // After resolution: collapsed one-liner
  if (resolution) {
    const isAccepted = resolution.action === "accepted";
    return (
      <div className="flex items-center gap-2 mt-3 text-sm text-text-muted">
        {isAccepted ? (
          <Check size={14} className="text-success" />
        ) : (
          <X size={14} className="text-text-muted" />
        )}
        <span>
          {isAccepted ? "Action confirmed" : "Action canceled"}
          {" "}
          <span className="text-text-subtle">{resolution.time}</span>
        </span>
      </div>
    );
  }

  // Before resolution: full confirmation block
  return (
    <div className="mt-3 bg-surface rounded-xl p-4 border border-border-subtle">
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-primary text-white rounded-lg
                     hover:bg-primary-hover transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                     cursor-pointer"
          aria-label="Confirm action"
        >
          <Check size={14} />
          Yes, proceed
        </button>
        <button
          onClick={handleReject}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium
                     bg-transparent text-text-muted border border-border rounded-lg
                     hover:bg-surface-hover transition-colors duration-150
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface
                     cursor-pointer"
          aria-label="Reject action"
        >
          <X size={14} />
          No, cancel
        </button>
      </div>
    </div>
  );
}
