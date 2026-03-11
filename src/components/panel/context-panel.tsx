// Context panel wrapper - slides in from the right when the AI
// calls a UI intent tool. Reads from the Zustand panel store
// and delegates rendering to the appropriate content view.

"use client";

import { useEffect } from "react";
import { X, Table2, FileText, GitBranch, AlertCircle, History } from "lucide-react";
import { usePanelStore } from "@/stores/panel-store";
import { DetailView } from "./detail-view";
import { TableView } from "./table-view";
import { DiagramView } from "./diagram-view";
import { ErrorView } from "./error-view";
import { AuditView } from "./audit-view";

// Badge config for each content type.
// Keys match PanelState["type"] values for type safety.
import type { PanelState } from "@/types/panel";

type BadgeConfig = { label: string; icon: typeof FileText };
const TYPE_BADGES: Record<PanelState["type"], BadgeConfig> = {
  detail: { label: "Detail", icon: FileText },
  table: { label: "Table", icon: Table2 },
  diagram: { label: "Diagram", icon: GitBranch },
  audit: { label: "Audit", icon: History },
  error: { label: "Error", icon: AlertCircle },
};

export function ContextPanel() {
  const { isOpen, content, close } = usePanelStore();

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  const badge = content ? TYPE_BADGES[content.type] : null;
  const BadgeIcon = badge?.icon;
  const title =
    content && "title" in content ? content.title : badge?.label ?? "Panel";

  return (
    <>
    {/* Backdrop overlay for mobile/tablet when panel is open */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/20 z-30 lg:hidden"
        onClick={close}
        aria-hidden="true"
      />
    )}
    <aside
      role="complementary"
      aria-label="Context panel"
      className={`
        fixed top-0 right-0 h-dvh z-40
        w-full md:w-[480px]
        bg-surface border-l border-border
        transform transition-transform ease-out
        ${isOpen ? "translate-x-0" : "translate-x-full"}
        flex flex-col
        lg:static lg:h-auto lg:z-auto lg:w-[480px] lg:flex-shrink-0
        ${isOpen ? "lg:flex" : "lg:hidden"}
      `}
      style={{
        // Respect reduced motion preference
        transitionDuration: "var(--panel-duration, 200ms)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {BadgeIcon && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full">
              <BadgeIcon size={12} />
              {badge?.label}
            </span>
          )}
          <h2 className="text-sm font-semibold text-text truncate">{title}</h2>
        </div>
        <button
          onClick={close}
          aria-label="Close panel"
          className="w-11 h-11 flex items-center justify-center rounded-lg text-text-muted
                     hover:text-text hover:bg-surface transition-colors duration-150
                     focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {content?.type === "detail" && <DetailView payload={content} />}
        {content?.type === "table" && <TableView payload={content} />}
        {content?.type === "diagram" && <DiagramView payload={content} />}
        {content?.type === "audit" && <AuditView payload={content} />}
        {content?.type === "error" && <ErrorView payload={content} />}
      </div>
    </aside>
    </>
  );
}
