// Renders tabular data in the context panel.
// Columns and rows come from the AI's showTable tool output.
// Capped at 15 rows in V1 (enforced by Zod schema).

"use client";

import type { TablePayload } from "@/types/panel";

interface TableViewProps {
  payload: TablePayload;
}

export function TableView({ payload }: TableViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {payload.columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left font-medium text-text-muted text-xs uppercase tracking-wide"
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
              className="border-b border-border/50 last:border-b-0 hover:bg-white transition-colors"
            >
              {payload.columns.map((col) => (
                <td key={col.key} className="px-3 py-2 text-text">
                  {String(row[col.key] ?? "-")}
                </td>
              ))}
            </tr>
          ))}
          {payload.rows.length === 0 && (
            <tr>
              <td
                colSpan={payload.columns.length}
                className="px-3 py-6 text-center text-text-muted"
              >
                No results
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
