// Zustand store for the context panel.
// Controls panel visibility and content. The AI opens the panel
// by calling UI intent tools; the user closes it with X or Escape.

import { create } from "zustand";
import type {
  DetailPayload,
  TablePayload,
  DiagramPayload,
  PanelState,
} from "@/types/panel";

interface PanelStore {
  // State
  isOpen: boolean;
  content: PanelState | null;

  // Actions - each one opens the panel with the given content
  showDetail: (payload: DetailPayload) => void;
  showTable: (payload: TablePayload) => void;
  showDiagram: (payload: DiagramPayload) => void;
  showError: (toolName: string, message: string) => void;
  close: () => void;
  // Reset everything (e.g. on user switch)
  reset: () => void;
}

export const usePanelStore = create<PanelStore>((set) => ({
  isOpen: false,
  content: null,

  showDetail: (payload) => set({ isOpen: true, content: payload }),
  showTable: (payload) => set({ isOpen: true, content: payload }),
  showDiagram: (payload) => set({ isOpen: true, content: payload }),
  showError: (toolName, message) =>
    set({ isOpen: true, content: { type: "error", toolName, message } }),

  // Close hides the panel but keeps content (so animation can finish)
  close: () => set({ isOpen: false }),

  // Full reset clears content too
  reset: () => set({ isOpen: false, content: null }),
}));
