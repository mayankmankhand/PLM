// Renders a color-coded status pill badge.
// Nine lifecycle states with distinct visual treatments.
// Badge colors are component-local hex values (not @theme tokens)
// because they're warm-tinted semantic colors used only here.
// See docs/design/plm-redesign-spec-v3.md Section 3.3 for the Slate+Teal palette colors.

"use client";

import type { CSSProperties } from "react";

// All status values this component handles (from Prisma enums).
type StatusValue =
  | "DRAFT" | "APPROVED" | "CANCELED"    // RequirementStatus / ProcedureVersionStatus
  | "ACTIVE"                              // ProcedureStatus
  | "PENDING" | "PASSED" | "FAILED"       // TestCaseStatus (subset)
  | "BLOCKED" | "SKIPPED";               // TestCaseStatus (full)

// Map each status to its visual treatment.
// Background, text color, and optional border for outlined style.
const STATUS_STYLES: Record<StatusValue, { bg: string; text: string; border?: string }> = {
  DRAFT:     { bg: "#FEF3C7", text: "#92400E" },
  APPROVED:  { bg: "#D1FAE5", text: "#065F46" },
  CANCELED:  { bg: "#F1F5F9", text: "#64748B" },
  PENDING:   { bg: "transparent", text: "#64748B", border: "1px solid #CBD5E1" },
  PASSED:    { bg: "#D1FAE5", text: "#065F46" },
  FAILED:    { bg: "#FEE2E2", text: "#991B1B" },
  ACTIVE:    { bg: "#CCFBF1", text: "#0F766E" },
  BLOCKED:   { bg: "#FFEDD5", text: "#9A3412" },
  SKIPPED:   { bg: "#F1F5F9", text: "#475569" },
};

// Fallback for unknown statuses - uses @theme tokens since those are in the palette.
const DEFAULT_STYLE = { bg: "bg-surface", text: "text-text-muted" };

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const known = STATUS_STYLES[status as StatusValue];

  // Known statuses use inline styles with component-local hex colors.
  if (known) {
    const inlineStyle: CSSProperties = {
      backgroundColor: known.bg,
      color: known.text,
      ...(known.border ? { border: known.border } : {}),
    };

    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.02em]"
        style={inlineStyle}
      >
        {status}
      </span>
    );
  }

  // Unknown statuses fall back to Tailwind @theme classes.
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.02em] ${DEFAULT_STYLE.bg} ${DEFAULT_STYLE.text}`}
    >
      {status}
    </span>
  );
}
