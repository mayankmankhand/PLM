// Unit tests for the context panel: Zustand store actions,
// panel payload type validation, and discriminated union narrowing.

import { describe, it, expect, beforeEach } from "vitest";
import { usePanelStore } from "@/stores/panel-store";
import {
  DetailPayloadSchema,
  TablePayloadSchema,
  DiagramPayloadSchema,
  PanelContentSchema,
  PanelErrorSchema,
} from "@/types/panel";
import type {
  DetailPayload,
  TablePayload,
  DiagramPayload,
  PanelContent,
} from "@/types/panel";

// ─── Panel Store Tests ──────────────────────────────────

describe("usePanelStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    usePanelStore.getState().reset();
  });

  it("starts closed with no content", () => {
    const state = usePanelStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.content).toBeNull();
  });

  it("showDetail opens panel with detail content", () => {
    const payload: DetailPayload = {
      type: "detail",
      entityType: "ProductRequirement",
      title: "Test Requirement",
      fields: [
        { label: "Status", value: "DRAFT" },
        { label: "ID", value: "abc-123" },
      ],
    };

    usePanelStore.getState().showDetail(payload);
    const state = usePanelStore.getState();

    expect(state.isOpen).toBe(true);
    expect(state.content).toEqual(payload);
    expect(state.content?.type).toBe("detail");
  });

  it("showTable opens panel with table content", () => {
    const payload: TablePayload = {
      type: "table",
      title: "Coverage Gaps",
      columns: [
        { key: "title", label: "Title" },
        { key: "status", label: "Status" },
      ],
      rows: [{ title: "Sub-req 1", status: "DRAFT" }],
    };

    usePanelStore.getState().showTable(payload);
    const state = usePanelStore.getState();

    expect(state.isOpen).toBe(true);
    expect(state.content?.type).toBe("table");
  });

  it("showDiagram opens panel with diagram content", () => {
    const payload: DiagramPayload = {
      type: "diagram",
      title: "Traceability",
      mermaidSyntax: "graph TD\n  A-->B",
    };

    usePanelStore.getState().showDiagram(payload);
    const state = usePanelStore.getState();

    expect(state.isOpen).toBe(true);
    expect(state.content?.type).toBe("diagram");
  });

  it("showError opens panel with error content", () => {
    usePanelStore.getState().showError("showEntityDetail", "NotFoundError: entity not found");
    const state = usePanelStore.getState();

    expect(state.isOpen).toBe(true);
    expect(state.content?.type).toBe("error");
    if (state.content?.type === "error") {
      expect(state.content.toolName).toBe("showEntityDetail");
      expect(state.content.message).toBe("NotFoundError: entity not found");
    }
  });

  it("close hides the panel but keeps content", () => {
    const payload: DetailPayload = {
      type: "detail",
      entityType: "TestCase",
      title: "Test",
      fields: [],
    };

    usePanelStore.getState().showDetail(payload);
    usePanelStore.getState().close();

    const state = usePanelStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.content).toEqual(payload);
  });

  it("reset clears everything", () => {
    usePanelStore.getState().showDetail({
      type: "detail",
      entityType: "TestCase",
      title: "Test",
      fields: [],
    });
    usePanelStore.getState().reset();

    const state = usePanelStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.content).toBeNull();
  });

  it("new tool call replaces previous content", () => {
    usePanelStore.getState().showDetail({
      type: "detail",
      entityType: "TestCase",
      title: "First",
      fields: [],
    });

    usePanelStore.getState().showTable({
      type: "table",
      title: "Second",
      columns: [],
      rows: [],
    });

    const state = usePanelStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.content?.type).toBe("table");
    if (state.content && "title" in state.content) {
      expect(state.content.title).toBe("Second");
    }
  });
});

// ─── Zod Schema Validation Tests ────────────────────────

describe("DetailPayloadSchema", () => {
  it("accepts valid detail payload", () => {
    const result = DetailPayloadSchema.safeParse({
      type: "detail",
      entityType: "ProductRequirement",
      title: "My Req",
      fields: [{ label: "Status", value: "DRAFT" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts detail with related entities", () => {
    const result = DetailPayloadSchema.safeParse({
      type: "detail",
      entityType: "SubRequirement",
      title: "Sub Req",
      fields: [],
      relatedEntities: [
        { id: "abc", title: "Proc 1", status: "ACTIVE", entityType: "TestProcedure" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid entity type", () => {
    const result = DetailPayloadSchema.safeParse({
      type: "detail",
      entityType: "InvalidType",
      title: "Bad",
      fields: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("TablePayloadSchema", () => {
  it("accepts valid table payload", () => {
    const result = TablePayloadSchema.safeParse({
      type: "table",
      title: "Results",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Test" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects more than 15 rows", () => {
    const rows = Array.from({ length: 16 }, (_, i) => ({ name: `Row ${i}` }));
    const result = TablePayloadSchema.safeParse({
      type: "table",
      title: "Too Many",
      columns: [{ key: "name", label: "Name" }],
      rows,
    });
    expect(result.success).toBe(false);
  });
});

describe("DiagramPayloadSchema", () => {
  it("accepts valid diagram payload", () => {
    const result = DiagramPayloadSchema.safeParse({
      type: "diagram",
      title: "Flow",
      mermaidSyntax: "graph TD\n  A-->B",
    });
    expect(result.success).toBe(true);
  });
});

describe("PanelErrorSchema", () => {
  it("accepts valid error payload", () => {
    const result = PanelErrorSchema.safeParse({
      type: "error",
      toolName: "showEntityDetail",
      message: "Not found",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Discriminated Union Narrowing ──────────────────────

describe("PanelContentSchema discriminated union", () => {
  it("narrows to detail type", () => {
    const input = {
      type: "detail",
      entityType: "TestCase",
      title: "TC-001",
      fields: [{ label: "Status", value: "PENDING" }],
    };

    const result = PanelContentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      const content: PanelContent = result.data;
      // TypeScript narrows based on discriminant
      if (content.type === "detail") {
        expect(content.entityType).toBe("TestCase");
        expect(content.fields).toHaveLength(1);
      }
    }
  });

  it("narrows to table type", () => {
    const input = {
      type: "table",
      title: "List",
      columns: [{ key: "x", label: "X" }],
      rows: [],
    };

    const result = PanelContentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "table") {
      expect(result.data.columns).toHaveLength(1);
      expect(result.data.rows).toHaveLength(0);
    }
  });

  it("narrows to diagram type", () => {
    const input = {
      type: "diagram",
      title: "Diagram",
      mermaidSyntax: "flowchart LR\n  A-->B",
    };

    const result = PanelContentSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "diagram") {
      expect(result.data.mermaidSyntax).toContain("flowchart");
    }
  });

  it("rejects unknown discriminant", () => {
    const result = PanelContentSchema.safeParse({
      type: "unknown",
      title: "Bad",
    });
    expect(result.success).toBe(false);
  });
});
