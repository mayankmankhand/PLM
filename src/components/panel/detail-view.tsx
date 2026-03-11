// Renders entity detail content in the context panel.
// Shows key-value fields with status badges and optional related entities list.

"use client";

import type { DetailPayload } from "@/types/panel";
import { humanize } from "@/lib/format-utils";
import { StatusBadge } from "./status-badge";

// Status fields are rendered as badges instead of plain text.
const STATUS_FIELD_LABELS = new Set(["status", "Status"]);

interface DetailViewProps {
  payload: DetailPayload;
}

export function DetailView({ payload }: DetailViewProps) {
  return (
    <div className="space-y-4">
      {/* Entity type label */}
      <span className="inline-block text-xs font-medium text-text-muted bg-primary-soft text-primary px-2 py-0.5 rounded-full">
        {humanize(payload.entityType)}
      </span>

      {/* Fields */}
      <dl className="space-y-3">
        {payload.fields.map((field) => (
          <div key={field.label} className="border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm text-text whitespace-pre-wrap">
              {STATUS_FIELD_LABELS.has(field.label) ? (
                <StatusBadge status={field.value} />
              ) : (
                field.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* Related entities */}
      {payload.relatedEntities && payload.relatedEntities.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
            Related
          </h3>
          <ul className="space-y-1.5">
            {payload.relatedEntities.map((entity) => (
              <li
                key={entity.id}
                className="flex items-center justify-between text-sm bg-surface-elevated rounded-lg px-3 py-2 border border-border"
              >
                <div className="min-w-0">
                  <span className="text-text truncate block">
                    {entity.title}
                  </span>
                  <span className="text-xs text-text-muted">
                    {humanize(entity.entityType)}
                  </span>
                </div>
                {entity.status && (
                  <div className="flex-shrink-0 ml-2">
                    <StatusBadge status={entity.status} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
