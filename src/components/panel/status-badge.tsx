// Renders a color-coded status pill badge.
// Six lifecycle states with distinct visual treatments:
//   DRAFT (amber, filled), PUBLISHED (green, filled), OBSOLETE (stone, dimmed),
//   PENDING (outlined), PASSED (green, filled), FAILED (red, filled).
// Text label is always shown - color is supportive, never the only indicator.
//
// Uses raw Tailwind palette classes (not @theme tokens) because these are
// semantic status colors that don't map to the app's surface/text palette.

"use client";

// All status values this component handles (from Prisma enums).
type StatusValue =
  | "DRAFT" | "PUBLISHED" | "OBSOLETE"    // RequirementStatus / ProcedureVersionStatus
  | "ACTIVE"                               // ProcedureStatus
  | "PENDING" | "PASSED" | "FAILED"        // TestCaseStatus (subset)
  | "BLOCKED" | "INVALIDATED";             // TestCaseStatus (full)

// Map each status to its visual treatment.
// Background, text color, and optional border for outlined style.
const STATUS_STYLES: Record<StatusValue, { bg: string; text: string; border?: string }> = {
  DRAFT: { bg: "bg-amber-100", text: "text-amber-800" },
  PUBLISHED: { bg: "bg-green-100", text: "text-green-800" },
  OBSOLETE: { bg: "bg-stone-100", text: "text-stone-500" },
  PENDING: { bg: "bg-transparent", text: "text-stone-500", border: "border border-stone-300" },
  PASSED: { bg: "bg-green-100", text: "text-green-800" },
  FAILED: { bg: "bg-red-100", text: "text-red-800" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-800" },
  BLOCKED: { bg: "bg-amber-100", text: "text-amber-800" },
  INVALIDATED: { bg: "bg-stone-100", text: "text-stone-500" },
};

// Fallback for unknown statuses
const DEFAULT_STYLE = { bg: "bg-surface", text: "text-text-muted" };

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status as StatusValue] ?? DEFAULT_STYLE;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${style.bg} ${style.text} ${style.border ?? ""}`}
    >
      {status}
    </span>
  );
}
