// Zustand store for the context panel.
// Controls panel visibility and content. The AI opens the panel
// by calling UI intent tools; the user closes it with X or Escape.

import { create } from "zustand";
import type {
  DetailPayload,
  TablePayload,
  DiagramPayload,
  AuditPayload,
  PanelState,
} from "@/types/panel";

// Default panel width in pixels (used by context-panel.tsx and page.tsx)
export const DEFAULT_PANEL_WIDTH = 540;

interface PanelStore {
  // State
  isOpen: boolean;
  content: PanelState | null;
  panelWidth: number;

  // Actions - each one opens the panel with the given content
  showDetail: (payload: DetailPayload) => void;
  showTable: (payload: TablePayload) => void;
  showDiagram: (payload: DiagramPayload) => void;
  showAudit: (payload: AuditPayload) => void;
  showError: (toolName: string, message: string) => void;
  close: () => void;
  // Re-open the panel with its existing content (used by Cmd+\ toggle)
  reopen: () => void;
  // Update panel width during drag-to-resize
  setPanelWidth: (width: number) => void;
  // Reset everything (e.g. on user switch)
  reset: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  isOpen: false,
  content: null,
  panelWidth: DEFAULT_PANEL_WIDTH,

  showDetail: (payload) => set({ isOpen: true, content: payload }),
  showTable: (payload) => set({ isOpen: true, content: payload }),
  showDiagram: (payload) => set({ isOpen: true, content: payload }),
  showAudit: (payload) => set({ isOpen: true, content: payload }),
  showError: (toolName, message) =>
    set({ isOpen: true, content: { type: "error", toolName, message } }),

  // Close hides the panel but keeps content (so animation can finish)
  close: () => set({ isOpen: false }),

  // Re-open with existing content (no-op if content is null)
  reopen: () =>
    set((state) => (state.content ? { isOpen: true } : {})),

  // Update panel width during drag-to-resize (called from context-panel.tsx)
  setPanelWidth: (width) => set({ panelWidth: width }),

  // Full reset clears content too
  reset: () => set({ isOpen: false, content: null, panelWidth: DEFAULT_PANEL_WIDTH }),
}));
