# Headless Browser QA Plan - Issue #53

**Tool:** `scripts/browse.js` (Playwright-based headless browser)
**Target:** `http://localhost:3000` (Next.js dev server)
**Date:** 2026-03-15

## Overview

This plan defines 6 test suites that exercise the PLM Assistant's core UI flows
using automated headless browser actions. Each suite is a separate `browse.js`
invocation (clean browser session per suite).

### What browse.js can test
- Page navigation and HTTP status
- Screenshots (full-page, saved to /tmp)
- Text extraction (full page or scoped to a CSS selector)
- Click interactions (CSS, text, or ARIA role selectors)
- Form input (fill text fields)
- Wait for elements or timeouts
- Console errors, network failures, HTTP error responses (passive diagnostics)

### What requires manual testing
- Keyboard shortcuts (Cmd+K, Cmd+\, Escape, Enter, Shift+Enter)
- Drag-to-resize panel handle
- Scroll behavior (auto-scroll, "Scroll to bottom" pill)
- Responsive breakpoints (mobile/tablet overlay)
- Reduced motion preference

---

## Suite 1: Page Load & Empty State

**Goal:** Verify the app loads correctly, displays the empty state with heading,
subheading, suggestion chips, and user picker.

### Action Sequence
```json
{
  "baseUrl": "http://localhost:3000",
  "actions": [
    { "type": "goto", "url": "/" },
    { "type": "wait", "ms": 3000 },
    { "type": "screenshot" },
    { "type": "text" },
    { "type": "text", "target": "css:header" },
    { "type": "text", "target": "css:select#user-picker" }
  ]
}
```

### Expected Results
| # | Assertion | How to verify |
|---|-----------|---------------|
| 1.1 | Page returns HTTP 200 | `goto` action result `status: 200` |
| 1.2 | Page title is "PLM Assistant" or similar | `goto` action result `title` field |
| 1.3 | Empty state heading visible | Page text contains "What would you like to work on?" |
| 1.4 | Subheading visible | Page text contains "Ask about requirements, test cases, or traceability" |
| 1.5 | 5 suggestion chips present | Page text contains "Show all requirements", "What's untested?", "GPS traceability diagram", "Recent audit log", "Failed test cases" |
| 1.6 | Header shows "PLM Assistant" | Header text contains "PLM ASSISTANT" (uppercase) |
| 1.7 | User picker present | Select element text contains user names (e.g., "Monica Geller") |
| 1.8 | No console errors on load | Diagnostics `console` array empty or absent |
| 1.9 | No network failures on load | Diagnostics `network` array empty or absent |
| 1.10 | Screenshot shows clean empty state | Visual review of screenshot |

---

## Suite 2: Chat Interaction

**Goal:** Click a suggestion chip, verify the message sends, AI responds with
tool indicators and rendered markdown.

### Action Sequence
```json
{
  "baseUrl": "http://localhost:3000",
  "actions": [
    { "type": "goto", "url": "/" },
    { "type": "wait", "ms": 3000 },
    { "type": "click", "target": "text:Show all requirements" },
    { "type": "wait", "ms": 5000 },
    { "type": "screenshot" },
    { "type": "wait", "ms": 25000 },
    { "type": "screenshot" },
    { "type": "text" }
  ]
}
```

### Expected Results
| # | Assertion | How to verify |
|---|-----------|---------------|
| 2.1 | User message appears | Page text contains "Show all requirements" in a user bubble |
| 2.2 | AI response renders | Page text contains assistant response (not empty after wait) |
| 2.3 | Tool indicators visible | Mid-wait screenshot may show tool activity (spinner, labels) |
| 2.4 | No error banner | Page text does NOT contain "Something went wrong" or "Too many requests" |
| 2.5 | Empty state disappears | Page text no longer contains "What would you like to work on?" |
| 2.6 | Screenshot shows conversation | Visual review - user bubble right-aligned, assistant text left-aligned |

---

## Suite 3: Panel - Table

**Goal:** Send a message that triggers the showTable tool, verify the context
panel opens with a table view containing headers, rows, and status badges.

### Action Sequence
```json
{
  "baseUrl": "http://localhost:3000",
  "actions": [
    { "type": "goto", "url": "/" },
    { "type": "wait", "ms": 3000 },
    { "type": "fill", "target": "css:textarea", "value": "Show all requirements in a table" },
    { "type": "click", "target": "css:button[type='submit']" },
    { "type": "wait", "ms": 30000 },
    { "type": "screenshot" },
    { "type": "text", "target": "css:aside" },
    { "type": "text" }
  ]
}
```

### Expected Results
| # | Assertion | How to verify |
|---|-----------|---------------|
| 3.1 | Panel opens | `aside` element has extractable text (not empty/error) |
| 3.2 | Panel badge shows "Table" | Panel text contains "Table" badge label |
| 3.3 | Table headers present | Panel text contains column headers (e.g., "Title", "Status") |
| 3.4 | Table rows populated | Panel text contains requirement data (e.g., "PR-", status values) |
| 3.5 | Status badges visible | Panel text contains status values like "DRAFT", "APPROVED", "ACTIVE" |
| 3.6 | Row count footer | Panel text contains "Showing" with a row count |
| 3.7 | Screenshot shows panel + chat | Visual review - panel on right, chat on left |

---

## Suite 4: Panel - Detail

**Goal:** Send a message that triggers the showEntityDetail tool, verify the
panel shows a detail view with Overview and Details sections.

### Action Sequence
```json
{
  "baseUrl": "http://localhost:3000",
  "actions": [
    { "type": "goto", "url": "/" },
    { "type": "wait", "ms": 3000 },
    { "type": "fill", "target": "css:textarea", "value": "Show me the details of the first product requirement" },
    { "type": "click", "target": "css:button[type='submit']" },
    { "type": "wait", "ms": 30000 },
    { "type": "screenshot" },
    { "type": "text", "target": "css:aside" },
    { "type": "text" }
  ]
}
```

### Expected Results
| # | Assertion | How to verify |
|---|-----------|---------------|
| 4.1 | Panel opens with detail view | `aside` text is non-empty |
| 4.2 | Panel badge shows "Detail" | Panel text contains "Detail" badge label |
| 4.3 | Overview section present | Panel text contains "Overview" |
| 4.4 | Details section present | Panel text contains "Details" |
| 4.5 | Status badge visible | Panel text contains a status value (DRAFT, APPROVED, etc.) |
| 4.6 | Entity fields populated | Panel text contains field labels (e.g., "Status", "Title") |
| 4.7 | Screenshot shows detail panel | Visual review - structured detail view in panel |

---

## Suite 5: Panel - Diagram

**Goal:** Send a message that triggers the showDiagram tool, verify the panel
shows a diagram with zoom controls.

### Action Sequence
```json
{
  "baseUrl": "http://localhost:3000",
  "actions": [
    { "type": "goto", "url": "/" },
    { "type": "wait", "ms": 3000 },
    { "type": "fill", "target": "css:textarea", "value": "Show me a traceability diagram for GPS requirements" },
    { "type": "click", "target": "css:button[type='submit']" },
    { "type": "wait", "ms": 30000 },
    { "type": "screenshot" },
    { "type": "text", "target": "css:aside" },
    { "type": "text" }
  ]
}
```

### Expected Results
| # | Assertion | How to verify |
|---|-----------|---------------|
| 5.1 | Panel opens with diagram view | `aside` text is non-empty |
| 5.2 | Panel badge shows "Diagram" | Panel text contains "Diagram" badge label |
| 5.3 | Zoom controls visible | Panel text contains "Fit" and "Copy source" |
| 5.4 | Zoom percentage shown | Panel text contains "%" (e.g., "100%") |
| 5.5 | SVG rendered | Screenshot shows diagram content (not blank or error) |
| 5.6 | No rendering error | Panel text does NOT contain "Could not render diagram" |
| 5.7 | Screenshot shows diagram panel | Visual review - diagram with nodes/edges visible |

---

## Suite 6: Diagnostics & Edge Cases

**Goal:** Test user picker switching and collect diagnostic data across a fresh
session.

### Action Sequence
```json
{
  "baseUrl": "http://localhost:3000",
  "actions": [
    { "type": "goto", "url": "/" },
    { "type": "wait", "ms": 3000 },
    { "type": "text", "target": "css:select#user-picker" },
    { "type": "screenshot" },
    { "type": "fill", "target": "css:textarea", "value": "Hello" },
    { "type": "click", "target": "css:button[type='submit']" },
    { "type": "wait", "ms": 15000 },
    { "type": "screenshot" },
    { "type": "text" }
  ]
}
```

### Expected Results
| # | Assertion | How to verify |
|---|-----------|---------------|
| 6.1 | User picker shows current user | Select text contains a user name |
| 6.2 | Simple chat works | After "Hello", AI responds with a greeting or helpful message |
| 6.3 | No error banner | Page text does NOT contain error messages |
| 6.4 | No console errors | Diagnostics `console` array empty or absent |
| 6.5 | No network failures | Diagnostics `network` array empty or absent (excluding expected 4xx) |
| 6.6 | Screenshot shows chat | Visual review - "Hello" message and AI response |

---

## Manual Test Checklist

These items cannot be tested with `browse.js` and require manual verification:

### Keyboard Shortcuts
- [ ] `Cmd/Ctrl+K` focuses the chat composer
- [ ] `Cmd/Ctrl+\` toggles the panel open/closed
- [ ] `Escape` closes the panel
- [ ] `Enter` sends the message
- [ ] `Shift+Enter` adds a newline (does not send)

### Panel Resize
- [ ] Drag handle appears on panel left edge (cursor changes to col-resize)
- [ ] Dragging resizes panel (360px min, 800px max)
- [ ] Panel remembers width after close/reopen

### Scroll Behavior
- [ ] Auto-scroll to bottom on new message (when near bottom)
- [ ] No forced scroll when user is scrolled up
- [ ] "Scroll to bottom" pill appears when scrolled up
- [ ] Panel scrolls independently from chat

### Responsive
- [ ] Below lg breakpoint: panel is full-width overlay with dark backdrop
- [ ] Tapping backdrop closes panel on mobile
- [ ] Above lg breakpoint: panel is fixed side panel

### Accessibility
- [ ] Focus rings are teal on all interactive elements (tab through)
- [ ] All icon-only buttons have aria-label or title
- [ ] Panel has appropriate ARIA role
- [ ] Status badges pass WCAG AA contrast
