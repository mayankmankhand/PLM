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
      <span className="inline-block text-xs font-medium bg-primary-subtle text-primary px-2 py-0.5 rounded-full">
        {humanize(payload.entityType)}
      </span>

      {/* Fields - short values in 2-col grid, long values full-width */}
      {(() => {
        const shortFields = payload.fields.filter((f) => f.value.length < 40);
        const longFields = payload.fields.filter((f) => f.value.length >= 40);
        return (
          <>
            {shortFields.length > 0 && (
              <div>
                <h3 className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-2">
                  Overview
                </h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {shortFields.map((field) => (
                    <div key={field.label}>
                      <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
                        {field.label}
                      </dt>
                      <dd className="mt-0.5 text-sm text-text">
                        {STATUS_FIELD_LABELS.has(field.label) ? (
                          <StatusBadge status={field.value} />
                        ) : (
                          field.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {longFields.length > 0 && (
              <div>
                <h3 className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-2">
                  Details
                </h3>
                <dl className="space-y-3">
                  {longFields.map((field) => (
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
              </div>
            )}
          </>
        );
      })()}

      {/* Related entities */}
      {payload.relatedEntities && payload.relatedEntities.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-widest font-semibold text-text-muted mb-2">
            Related
          </h3>
          <div className="flex flex-wrap gap-2">
            {payload.relatedEntities.map((entity) => (
              <span
                key={entity.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface text-sm text-text"
              >
                <span className="truncate max-w-[180px]">{entity.title}</span>
                <span className="text-xs text-text-muted">
                  {humanize(entity.entityType)}
                </span>
                {entity.status && <StatusBadge status={entity.status} />}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
