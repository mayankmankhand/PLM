// Renders entity detail content in the context panel.
// Shows key-value fields and optional related entities list.

"use client";

import type { DetailPayload } from "@/types/panel";

interface DetailViewProps {
  payload: DetailPayload;
}

export function DetailView({ payload }: DetailViewProps) {
  return (
    <div className="space-y-4">
      {/* Entity type label */}
      <span className="inline-block text-xs font-medium text-text-muted bg-primary/10 text-primary px-2 py-0.5 rounded-full">
        {payload.entityType.replace(/([A-Z])/g, " $1").trim()}
      </span>

      {/* Fields */}
      <dl className="space-y-3">
        {payload.fields.map((field) => (
          <div key={field.label}>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {field.label}
            </dt>
            <dd className="mt-0.5 text-sm text-text whitespace-pre-wrap">
              {field.value}
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
                className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-border"
              >
                <div className="min-w-0">
                  <span className="text-text truncate block">
                    {entity.title}
                  </span>
                  <span className="text-xs text-text-muted">
                    {entity.entityType.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
                <span className="text-xs font-medium text-text-muted bg-surface px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
                  {entity.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
