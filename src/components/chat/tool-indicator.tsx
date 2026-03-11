// Shows an inline indicator when the AI is executing a tool.
// Active tools pulse with animation; completed tools collapse to a checkmark.
// Error tools show an alert with red styling.

"use client";

import { CheckCircle2, AlertTriangle } from "lucide-react";
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

  // Active: expanded with pulse animation
  if (isRunning) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-soft text-primary text-[13px] font-medium">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse-dot flex-shrink-0" />
        <span>{label}...</span>
      </div>
    );
  }

  // Error: expanded with alert styling
  if (isError) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/5 text-danger text-[13px] font-medium">
        <AlertTriangle size={14} className="flex-shrink-0" />
        <span>{label} failed</span>
      </div>
    );
  }

  // Completed: collapsed single line with checkmark
  return (
    <div className="flex items-center gap-1.5 text-[13px] font-medium text-success">
      <CheckCircle2 size={14} className="flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}
