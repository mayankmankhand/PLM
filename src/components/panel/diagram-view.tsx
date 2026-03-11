// Renders Mermaid diagrams in the context panel.
// Uses next/dynamic with ssr: false to avoid SSR crashes
// (Mermaid uses DOM APIs that don't exist on the server).
// SVG output is sanitized with DOMPurify before injection.
// Falls back to raw syntax if rendering fails.

"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { DiagramPayload } from "@/types/panel";

interface DiagramViewProps {
  payload: DiagramPayload;
}

// Mermaid is loaded lazily on the client only.
// We wrap the rendering logic in a component loaded via next/dynamic.
function MermaidRenderer({ syntax }: { syntax: string }) {
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        // Dynamic imports so mermaid and DOMPurify are never bundled server-side
        const mermaid = (await import("mermaid")).default;
        const DOMPurify = (await import("dompurify")).default;

        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
        });

        // Use crypto.randomUUID() for stable unique IDs (safe in StrictMode)
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${crypto.randomUUID()}`,
          syntax,
        );

        // Sanitize SVG to prevent XSS from LLM-generated mermaid syntax.
        // DOMPurify strips event handlers and scripts from the SVG output.
        const cleanSvg = DOMPurify.sanitize(renderedSvg, {
          USE_PROFILES: { svg: true, svgFilters: true },
        });

        if (!cancelled) {
          setSvg(cleanSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram",
          );
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [syntax]);

  // Error fallback: show raw syntax
  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-warning font-medium">
          Could not render diagram. Showing raw syntax:
        </p>
        <pre className="text-xs bg-white border border-border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap text-text-muted">
          {syntax}
        </pre>
      </div>
    );
  }

  // Rendered SVG (sanitized by DOMPurify)
  if (svg) {
    return (
      <div
        className="overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  // Loading state
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

// Wrap in next/dynamic to prevent SSR
const DynamicMermaid = dynamic(() => Promise.resolve(MermaidRenderer), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  ),
});

export function DiagramView({ payload }: DiagramViewProps) {
  return <DynamicMermaid syntax={payload.mermaidSyntax} />;
}
