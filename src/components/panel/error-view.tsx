// Renders an error state in the context panel.
// Shown when a UI intent tool fails (e.g. entity not found).

"use client";

import { AlertCircle } from "lucide-react";
import type { PanelError } from "@/types/panel";

interface ErrorViewProps {
  payload: PanelError;
}

export function ErrorView({ payload }: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center mb-3">
        <AlertCircle size={20} className="text-danger" />
      </div>
      <p className="text-sm font-medium text-text mb-1">
        Tool failed: {payload.toolName}
      </p>
      <p className="text-sm text-text-muted max-w-xs">{payload.message}</p>
    </div>
  );
}
