// Renders tabular data in the context panel.
// Columns and rows come from the AI's showTable tool output.
// Status cells are rendered as color-coded badges.
// Capped at 15 rows in V1 (enforced by Zod schema).

"use client";

import { Table2 } from "lucide-react";
import type { TablePayload } from "@/types/panel";
import { StatusBadge } from "./status-badge";

// Column keys that contain status values (rendered as badges instead of text).
const STATUS_COLUMN_KEYS = new Set(["status", "result"]);

interface TableViewProps {
  payload: TablePayload;
}

export function TableView({ payload }: TableViewProps) {
  if (payload.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Table2
          size={48}
          strokeWidth={1.2}
          className="text-text-muted opacity-25 mb-3"
        />
        <p className="text-sm font-medium text-text mb-0.5">No results</p>
        <p className="text-xs text-text-muted">Try a different query.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {payload.columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left font-medium text-text-muted text-xs uppercase tracking-wide bg-surface"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payload.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border-subtle last:border-b-0 bg-surface-elevated hover:bg-background transition-colors duration-150"
            >
              {payload.columns.map((col) => {
                const value = String(row[col.key] ?? "-");
                const isStatus = STATUS_COLUMN_KEYS.has(col.key.toLowerCase());

                return (
                  <td key={col.key} className="px-3 py-2 text-text">
                    {isStatus && value !== "-" ? (
                      <StatusBadge status={value} />
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
