// Renders a color-coded status pill badge.
// Nine lifecycle states with distinct visual treatments.
// Badge colors are component-local hex values (not @theme tokens)
// because they're warm-tinted semantic colors used only here.
// See UI-SPEC-plm-v1.md Section 3 for the color definitions.

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
  APPROVED:  { bg: "#E6F2E0", text: "#3B6B35" },
  CANCELED:  { bg: "#F0E9DC", text: "#6D6560" },
  PENDING:   { bg: "transparent", text: "#6D6560", border: "1px solid #D6D3D1" },
  PASSED:    { bg: "#E6F2E0", text: "#3B6B35" },
  FAILED:    { bg: "#F5E0D5", text: "#9B3030" },
  ACTIVE:    { bg: "#E6F2E0", text: "#3B6B35" },
  BLOCKED:   { bg: "#FEF3C7", text: "#92400E" },
  SKIPPED:   { bg: "#F0E9DC", text: "#6D6560" },
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
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide"
        style={inlineStyle}
      >
        {status}
      </span>
    );
  }

  // Unknown statuses fall back to Tailwind @theme classes.
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide ${DEFAULT_STYLE.bg} ${DEFAULT_STYLE.text}`}
    >
      {status}
    </span>
  );
}
