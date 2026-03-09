// Shows a small inline label when the AI is executing a tool.
// Displays a spinner while the tool is running, and a checkmark when done.

"use client";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { getToolLabel } from "./tool-labels";

interface ToolIndicatorProps {
  toolName: string;
  state: string;
}

export function ToolIndicator({ toolName, state }: ToolIndicatorProps) {
  const label = getToolLabel(toolName);

  // Determine if the tool is still running or has completed.
  const isRunning =
    state === "input-streaming" || state === "input-available";
  const isError = state === "output-error";

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${
        isRunning
          ? "bg-primary/10 text-primary"
          : isError
            ? "bg-danger/10 text-danger"
            : "bg-success/10 text-success"
      }`}
    >
      {isRunning ? (
        <Loader2 size={12} className="animate-spin" />
      ) : isError ? (
        <AlertCircle size={12} />
      ) : (
        <CheckCircle2 size={12} />
      )}
      <span>{label}{isRunning ? "..." : ""}</span>
    </div>
  );
}
