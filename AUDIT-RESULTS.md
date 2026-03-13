# PLM Full-Stack Audit Results

**Date:** 2026-03-12
**Audited by:** 14 parallel sub-agents covering CSS, layout, components, TypeScript, performance, API routes, services, database, LLM tools, security, tests, seed data, file structure, and error handling.

---

## 1. Executive Summary

The PLM project is a well-architected Next.js application with strong fundamentals: clean TypeScript (strict mode, minimal `any`), comprehensive Zod validation at every boundary, proper Prisma transactions with audit logging, and a thoughtfully designed 29-tool LLM integration. The CSS/layout implementation is pixel-perfect against the design spec (22/22 checks passed). The biggest risk is **missing cascade cancellation logic** in the service layer - canceling a parent entity does not propagate to children, which contradicts the seed data's own cascade behavior. The biggest win is the tool layer: all 29 tools are fully compliant with correct service binding, structured error handling, and a robust confirmation protocol.

---

## 2. Critical Issues (Blocks Demo/Launch)

### C1. Missing Cascade Cancellation in Service Layer
- **Finding:** When a ProductRequirement is canceled, child SubRequirements, TestProcedures, and TestCases are NOT canceled/skipped. The seed data manually implements this cascade (PR5 -> SR5_1 -> TP9 -> TC9), but the service code does not.
- **File:** `src/services/product-requirement.service.ts` (cancelProductRequirement), `src/services/sub-requirement.service.ts` (cancelSubRequirement), `src/services/test-procedure.service.ts` (cancelTestProcedure)
- **Fix:** Add transaction logic in each cancel function to cascade status changes to all descendants. Wrap in the existing `$transaction` block.
- **Found by:** Sub-Agent 7 (Service Layer)

### C2. No Message Size Validation on Chat Endpoint
- **Finding:** The `/api/chat` POST handler accepts any size message body. A user could send a 1MB+ message, consuming LLM context and incurring cost.
- **File:** [route.ts](src/app/api/chat/route.ts)
- **Fix:** Add validation before `streamText()`:
  ```typescript
  const maxMessageLength = 50_000;
  if (body.messages?.some((m: any) => JSON.stringify(m).length > maxMessageLength)) {
    return new Response(JSON.stringify({ error: "Message too large" }), { status: 413 });
  }
  ```
- **Found by:** Sub-Agent 6 (API Routes)

### C3. No Tool Timeout Handling
- **Finding:** No explicit timeout on individual tool execution. If a Prisma query hangs, the stream hangs indefinitely with no user recovery path.
- **File:** [route.ts](src/app/api/chat/route.ts) - `streamText()` call
- **Fix:** Add a per-tool timeout wrapper (e.g., 30s) or configure Vercel AI SDK timeout options.
- **Found by:** Sub-Agent 14 (Error Handling)

---

## 3. High Priority (Fix This Week)

### H1. Zustand Store Selector Violation in Context Panel
- **Finding:** `usePanelStore()` called without selectors in context-panel.tsx, causing unnecessary re-renders on every store change (including every pixel of drag-to-resize).
- **File:** [context-panel.tsx:39](src/components/panel/context-panel.tsx#L39)
- **Fix:** Replace destructured call with individual selectors:
  ```typescript
  const isOpen = usePanelStore((s) => s.isOpen);
  const content = usePanelStore((s) => s.content);
  const close = usePanelStore((s) => s.close);
  const panelWidth = usePanelStore((s) => s.panelWidth);
  const setPanelWidth = usePanelStore((s) => s.setPanelWidth);
  ```
- **Found by:** Sub-Agent 5 (Performance)

### H2. MessageBubble Not Memoized
- **Finding:** MessageBubble renders in a `.map()` loop but is not wrapped in `React.memo`. Every new message or streaming token re-renders ALL previous bubbles.
- **File:** [message-bubble.tsx:35](src/components/chat/message-bubble.tsx#L35)
- **Fix:** Wrap export in `React.memo` with shallow prop comparison.
- **Found by:** Sub-Agent 5 (Performance)

### H3. console.error Without NODE_ENV Guard
- **Finding:** `console.error` in tool-wrapper.ts logs to production without environment check.
- **File:** [tool-wrapper.ts:39](src/lib/ai/tools/tool-wrapper.ts#L39)
- **Fix:** Wrap in `if (process.env.NODE_ENV !== "production")`.
- **Found by:** Sub-Agent 4 (TypeScript)

### H4. Chat Route Returns 500 Instead of 401 When Auth Missing
- **Finding:** If middleware is bypassed, `getRequestContext()` throws a generic Error caught by `handleApiError()` as 500, not 401.
- **File:** [route.ts](src/app/api/chat/route.ts) + [request-context.ts](src/lib/request-context.ts)
- **Fix:** Throw a custom `AuthError` in `getRequestContext()` and map it to 401 in `handleApiError()`.
- **Found by:** Sub-Agent 6 (API Routes)

### H5. No .trim() on Zod String Schemas
- **Finding:** Whitespace-only titles (e.g., `"   "`) pass Zod `.min(1)` validation and get stored in the database.
- **File:** All files in `src/schemas/*.schema.ts`
- **Fix:** Add `.trim()` before `.min(1)` on all title/description fields.
- **Found by:** Sub-Agent 7 (Service Layer)

### H6. Inline Callbacks on Suggestion Chips
- **Finding:** New function created per chip per render in MessageList, preventing memoization.
- **File:** [message-list.tsx:91](src/components/chat/message-list.tsx#L91)
- **Fix:** Extract to `useCallback` or use data attributes with a single handler.
- **Found by:** Sub-Agent 5 (Performance)

---

## 4. Medium Priority (Fix This Month)

### M1. No Team-Based Data Isolation
- **Finding:** All query tools return data across all teams. Any demo user can see all requirements, procedures, test cases, and audit logs from all teams.
- **File:** `src/lib/ai/tools/query-tools.ts`, `src/lib/ai/tools/shared-queries.ts`
- **Fix:** Add `where: { teamId: ctx.teamId }` to queries. Design decision needed: is cross-team visibility intentional for demo?
- **Found by:** Sub-Agent 10 (Security)

### M2. Confirmation Bypass Via Direct API Calls
- **Finding:** `z.literal(true)` confirmation is enforced at LLM tool level only. Direct POST to `/api/product-requirements/{id}/approve` with `{"confirmApprove": true}` bypasses chat confirmation flow.
- **File:** API routes for approve/cancel/skip operations
- **Fix:** Document as UX-only guardrail, or enforce confirmation at service layer for production.
- **Found by:** Sub-Agent 10 (Security)

### M3. Audit Log Source Field Always "api"
- **Finding:** All mutations log `source: "api"` even when initiated via chat. Cannot distinguish API vs chat-initiated changes.
- **File:** All service files in `src/services/`
- **Fix:** Thread `source?: "api" | "chat"` parameter through service functions.
- **Found by:** Sub-Agent 10 (Security)

### M4. No Panel Loading Skeletons for Table/Detail/Audit Views
- **Finding:** DiagramView has a spinner, but TableView, DetailView, and AuditView render instantly with no loading state.
- **File:** [table-view.tsx](src/components/panel/table-view.tsx), [detail-view.tsx](src/components/panel/detail-view.tsx), [audit-view.tsx](src/components/panel/audit-view.tsx)
- **Fix:** Add skeleton loaders matching existing `.skeleton` CSS class.
- **Found by:** Sub-Agent 14 (Error Handling)

### M5. No Network Retry Logic
- **Finding:** If fetch fails, user sees generic "Something went wrong" with no retry mechanism or offline detection.
- **File:** [page.tsx](src/app/page.tsx) - DefaultChatTransport
- **Fix:** Add exponential backoff retry wrapper on transport, or offline banner.
- **Found by:** Sub-Agent 14 (Error Handling)

### M6. User Switch Race Condition
- **Finding:** Switching demo users while LLM is streaming doesn't cancel the in-flight request. Old tool results may arrive and open wrong panel content.
- **File:** [page.tsx:81-89](src/app/page.tsx#L81)
- **Fix:** Use `AbortController` to cancel in-flight requests on user switch.
- **Found by:** Sub-Agent 14 (Error Handling)

### M7. Full Message Scan in useEffect
- **Finding:** The effect watching `chat.messages` scans ALL messages every time any message changes. O(n^2) over conversation lifetime.
- **File:** [page.tsx:95-165](src/app/page.tsx#L95)
- **Fix:** Scan only the last message, or track last-processed index.
- **Found by:** Sub-Agent 5 (Performance)

### M8. Attachment Tools Not Registered with LLM
- **Finding:** `addAttachment` and `removeAttachment` exist as HTTP endpoints but are not in the 29 LLM tools. LLM cannot manage attachments via chat.
- **File:** `src/lib/ai/tools/index.ts`
- **Fix:** Register attachment tools if chat-based attachment management is desired.
- **Found by:** Sub-Agent 6 (API Routes)

### M9. Can Add Attachments to Canceled Entities
- **Finding:** `addAttachment` service does not check parent entity status. Attachments can be added to CANCELED requirements.
- **File:** [attachment.service.ts:18-29](src/services/attachment.service.ts#L18)
- **Fix:** Add status check on parent entity before allowing attachment creation.
- **Found by:** Sub-Agent 7 (Service Layer)

### M10. Missing FK Indexes on Frequently Joined Columns
- **Finding:** No indexes on `SubRequirement.productRequirementId`, `TestProcedure.subRequirementId`, `TestCase.testProcedureVersionId`. Negligible at current scale but will matter as data grows.
- **File:** `prisma/schema.prisma`
- **Fix:** Add `@@index` directives for these FK columns.
- **Found by:** Sub-Agent 8 (Database)

---

## 5. Low Priority (Backlog)

### L1. Missing `aria-expanded` on Toggle Buttons
- **Finding:** ToolGroup, AuditView expand buttons, and ToolIndicator lack `aria-expanded` attribute.
- **Files:** [tool-indicator.tsx](src/components/chat/tool-indicator.tsx), [audit-view.tsx](src/components/panel/audit-view.tsx)
- **Found by:** Sub-Agent 3 (A11y)

### L2. Missing `aria-label` on DiagramView Copy Button
- **File:** [diagram-view.tsx:182](src/components/panel/diagram-view.tsx#L182)
- **Found by:** Sub-Agent 3 (A11y)

### L3. Missing Barrel Export for Panel Components
- **File:** `src/components/panel/` (no index.ts, unlike chat/)
- **Found by:** Sub-Agent 13 (File Structure)

### L4. Unused `parsePagination` Export
- **File:** [api-utils.ts:68-73](src/lib/api-utils.ts#L68)
- **Found by:** Sub-Agent 13 (File Structure)

### L5. ui-intent-tools.ts is 887 Lines
- **File:** [ui-intent-tools.ts](src/lib/ai/tools/ui-intent-tools.ts) - candidate for splitting into feature subdirectory.
- **Found by:** Sub-Agent 13 (File Structure)

### L6. Long Entity Titles Truncate Without Tooltips
- **File:** [context-panel.tsx:131](src/components/panel/context-panel.tsx#L131), [detail-view.tsx:94](src/components/panel/detail-view.tsx#L94)
- **Fix:** Add `title` attribute for native browser tooltips.
- **Found by:** Sub-Agent 14 (Error Handling)

### L7. Rate Limit 429 Error Shows Generic Message
- **Finding:** `Retry-After` header is returned but not surfaced in the UI error message.
- **File:** [page.tsx:231-236](src/app/page.tsx#L231)
- **Found by:** Sub-Agent 14 (Error Handling)

### L8. Clipboard Copy Fails Silently in DiagramView
- **File:** [diagram-view.tsx:75-84](src/components/panel/diagram-view.tsx#L75)
- **Found by:** Sub-Agent 14 (Error Handling)

### L9. Test Case Re-execution Semantics Undocumented
- **Finding:** PASSED -> FAILED -> PASSED transitions are allowed but not documented in service code or system prompt.
- **File:** [test-case.service.ts:86-95](src/services/test-case.service.ts#L86)
- **Found by:** Sub-Agent 7 (Service Layer)

### L10. Demo User Header Not UUID-Validated
- **Finding:** `x-demo-user-id` header accepted as any string, validated via Map lookup. Works but brittle.
- **File:** [middleware.ts:15-19](src/middleware.ts#L15)
- **Found by:** Sub-Agent 10 (Security)

---

## 6. What's Working Well

1. **CSS & Design System** - 22/22 styling checks passed. Universal reset is clean, theme tokens correct, old colors completely removed, all animations present, focus rings consistent. Pixel-perfect implementation.

2. **Layout & Spacing** - 10/10 layout checks passed. Composer centering, panel positioning (fixed overlay with frosted glass), h-dvh usage, send button dimensions, asymmetric user bubble radius all correct.

3. **Component Architecture** - All 14 components pass quality review. Semantic HTML (dl, table, button), proper ARIA roles on panel aside, consistent focus-visible rings, StatusBadge uses inline hex values correctly.

4. **TypeScript Discipline** - Strict mode enabled, only 2 justified `any` usages (SDK limitation + test pragmatism), ToolPartShape defined once and imported correctly, all 7 panel types in Zod union.

5. **LLM Tool Layer** - All 29 tools fully compliant. 100% tool-service alignment, confirmation protocol enforced via z.literal(true) + system prompt, structured error prefixes (LifecycleError:, NotFoundError:, ValidationError:), compact select payloads protect context window.

6. **Database Design** - All 9 models with correct enums, FK relationships (all RESTRICT except executedBy SET NULL), exclusive arc CHECK constraint, single-draft partial unique index, comprehensive audit logging.

7. **Seed Data** - All counts verified (6/6/10/21/18/19/20/6/156), relationship integrity perfect, status cascade correct in seed data, chronological audit log, idempotent delete-then-create pattern.

8. **Security Hardening** - DOMPurify + Mermaid securityLevel: "strict", ReactMarkdown skipHtml, rate limiting (10 req/60s), security headers, no raw SQL, Prisma client server-only, Zod validation everywhere.

9. **Transaction Safety** - Every mutation wrapped in `prisma.$transaction()` with inline audit logging. Atomic mutations + audit entries.

10. **Test Foundation** - 101 tests passing, lifecycle transitions well-covered, DB constraint tests (exclusive arc, single-draft, soft-delete), Zod schema validation tests, separate test database with migration setup.

---

## 7. Recommended Fix Order

| # | Item | Est. Effort | Why First |
|---|------|-------------|-----------|
| 1 | C1: Cascade cancellation | 2-3 hours | Data integrity - contradicts documented behavior |
| 2 | H1: Panel store selectors | 10 min | Quick win, large perf impact on drag-to-resize |
| 3 | H2: Memo MessageBubble | 15 min | Quick win, large perf impact on streaming |
| 4 | H5: Add .trim() to Zod schemas | 15 min | Quick win, prevents whitespace-only entities |
| 5 | H3: Guard console.error | 5 min | One-line fix |
| 6 | H6: Extract chip callbacks | 10 min | Quick performance win |
| 7 | C2: Message size validation | 20 min | Prevents abuse |
| 8 | C3: Tool timeout | 30 min | Prevents hung UI |
| 9 | H4: Auth error 401 | 20 min | Correct error semantics |
| 10 | M5: Network retry | 1 hour | Better UX on flaky networks |
| 11 | M3: Audit source threading | 1-2 hours | Audit trail clarity |
| 12 | M6: AbortController on user switch | 30 min | Prevents stale panel data |
| 13 | M7: Optimize message scan | 30 min | O(n^2) -> O(1) per message |
| 14 | M4: Panel skeleton loaders | 1 hour | Better perceived performance |
| 15 | M9: Attachment parent status check | 30 min | Logical integrity |
| 16 | M10: FK indexes | 15 min | Future-proofing |
| 17 | M1: Team data isolation | 2-3 hours | Security (design decision needed) |
| 18 | L1-L10: Backlog items | 2-3 hours total | Polish |

---

## 8. Testing Gaps

### Service Layer Tests (Critical)
- [ ] Cascade cancellation: PR cancel -> child SRs canceled -> child TPs canceled -> child TCs skipped
- [ ] SR cancel -> child TPs canceled -> child TCs skipped
- [ ] TP cancel -> child TCs skipped
- [ ] `updateSubRequirement` - draft-only enforcement
- [ ] `cancelSubRequirement` - APPROVED -> CANCELED transition
- [ ] `cancelTestProcedure` - ACTIVE -> CANCELED with in-flight test cases
- [ ] Transaction rollback: mock audit log failure, verify mutation rolls back

### API Route Tests (High Priority)
- [ ] Chat endpoint: missing/invalid user ID returns 401
- [ ] Chat endpoint: oversized message returns 413
- [ ] Chat endpoint: rate limit returns 429 with Retry-After header
- [ ] Chat endpoint: malformed JSON returns 400
- [ ] Mutation routes: proper error serialization via handleApiError()

### LLM Tool Tests (Medium Priority)
- [ ] Tool error prefix stability (LifecycleError:, NotFoundError:, ValidationError:)
- [ ] Tool parameter schema validation (invalid UUID, missing required fields)
- [ ] showTable truncation detection (16 rows fetched, 15 returned, isTruncated true)
- [ ] showEntityDetail exhaustive entity type coverage

### Frontend Component Tests (Medium Priority)
- [ ] StatusBadge: renders correct colors for all 9 statuses
- [ ] ConfirmButtons: collapse to one-liner after resolution
- [ ] ToolIndicator: running/completed/error state rendering
- [ ] MessageBubble: user vs assistant styling, streaming dots
- [ ] Empty state: suggestion chips fire onSendMessage

### Integration/E2E Tests (Future)
- [ ] Full chat flow: user sends message -> LLM calls tool -> panel updates
- [ ] User switch: clears chat, closes panel, resets processed tool calls
- [ ] Keyboard shortcuts: Cmd+K focus, Cmd+\ toggle, Escape close
- [ ] Panel drag-to-resize within 360-800px bounds

---

*Generated by 14 parallel audit sub-agents on 2026-03-12*
