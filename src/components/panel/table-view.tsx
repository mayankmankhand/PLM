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

/** Return a fixed col width based on the column key, or undefined for auto. */
function colWidth(key: string): string | undefined {
  const k = key.toLowerCase();
  if (k.includes("id")) return "68px";
  if (k.includes("status") || k.includes("result")) return "90px";
  if (k.includes("team") || k.includes("ref") || k.includes("type")) return "85px";
  return undefined;
}

/** True when the column should use nowrap. */
function isFixedColumn(key: string): boolean {
  return colWidth(key) !== undefined;
}

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
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-border-subtle shadow-sm overflow-hidden">
      <div
        className="panel-table-scroll overflow-x-auto"
      >
        <table
          className="w-full text-sm"
          style={{ tableLayout: "fixed", minWidth: 420 }}
        >
          <colgroup>
            {payload.columns.map((col) => {
              const w = colWidth(col.key);
              return <col key={col.key} style={w ? { width: w } : undefined} />;
            })}
          </colgroup>

          <thead>
            <tr className="border-b border-border">
              {payload.columns.map((col) => (
                <th
                  key={col.key}
                  className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm px-3.5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted"
                  style={
                    isFixedColumn(col.key)
                      ? { whiteSpace: "nowrap" }
                      : undefined
                  }
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
                className="border-b border-border-subtle last:border-b-0 hover:bg-surface-hover transition-colors"
              >
                {payload.columns.map((col) => {
                  const value = String(row[col.key] ?? "-");
                  const isStatus = STATUS_COLUMN_KEYS.has(
                    col.key.toLowerCase()
                  );
                  const fixed = isFixedColumn(col.key);

                  return (
                    <td
                      key={col.key}
                      className="px-3.5 py-2.5 text-text"
                      style={
                        fixed
                          ? { whiteSpace: "nowrap" }
                          : { whiteSpace: "normal", wordBreak: "break-word" }
                      }
                    >
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

      {/* Footer */}
      <div className="border-t border-border-subtle px-3.5 py-2 text-xs text-text-muted">
        Showing {payload.rows.length}{" "}
        {payload.rows.length === 1 ? "row" : "rows"}
      </div>
    </div>
  );
}
