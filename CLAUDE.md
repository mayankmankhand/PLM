# Project Instructions for Claude

<!-- This file is YOURS. Add your project-specific info below. -->
<!-- Toolkit rules live in .claude/rules/toolkit.md (managed by the toolkit, auto-discovered by Claude). -->
<!-- See README.md > "How It Works" for details on how these files connect. -->

## About This Project

**PLM** - Product Lifecycle Management system for managing requirements, test procedures, and test cases.

- **Stack**: Next.js 16 (App Router) + TypeScript + Prisma ORM + Neon PostgreSQL + Tailwind CSS v4 + Zod + Vitest
- **AI**: Vercel AI SDK v6 + Anthropic Claude (streaming chat with 44 tools, model configurable via `ANTHROPIC_MODEL` env var, default Haiku 4.5)
- **UI**: Dual-panel chat app with `@ai-sdk/react` useChat hook, Zustand panel store, react-markdown, lucide-react icons, ThinkingIndicator (cycling PLM phrases while waiting for AI response and during tool execution)
- **Design**: Cool slate+teal palette (#F4F5F7 bg, #0D9488 teal primary), DM Sans + JetBrains Mono fonts, frosted glass surfaces, `.chat-markdown` CSS class for assistant messages, StatusBadge shared component
- **Panel**: Interactive context panel (detail views with inline editing + lifecycle actions, data tables with clickable rows + "Show more" pagination, Mermaid diagrams, audit log) via 7 UI intent tools. Always-fixed overlay with frosted glass (`backdrop-blur`), drag-to-resize (540px default, 360-800px via Zustand `panelWidth`), keyboard shortcuts (Cmd+K focus, Cmd+\ toggle, Escape close), shared `useDesktopBreakpoint` hook for hydration-safe media queries. Navigation history stack (cap 20, snapshot-based, back button). Edit mode toggle on detail views (text/textarea fields, server-driven `editableFields` metadata). Lifecycle action buttons (Approve, Cancel, Reactivate, Skip, Re-execute) driven by server `availableActions` metadata with inline confirmation. "Show more" button on tables for offset-based pagination. Panel mutations inject `[System Note]` into chat via `setMessages()` so the AI stays aware. Diagrams: 3 template-based tools (`showTraceabilityDiagram`, `showStatusDiagram`, `showCoverageDiagram`) produce deterministic Mermaid from DB data via pure functions in `diagram-templates.ts`; freehand `showDiagram` kept for ad hoc/novel diagrams. Diagrams render at natural SVG size (no max-w-full) with zoom controls (+/-, Fit button, Copy source), max-h-[60vh] container, `classDef` color-coding with WCAG AA contrast, `escapeMermaidLabel` sanitizes DB strings, `MAX_DIAGRAM_NODES=300` guard prevents browser crashes. showTable supports 10 query types (7 enriched list/gap queries + 3 aggregations) with cross-entity columns, team filter, fetch-16-return-15 truncation detection (`isTruncated` flag on TablePayload), ID columns for row navigation
- **API pattern**: Domain commands (not raw CRUD) - e.g. `POST /api/product-requirements/:id/approve`
- **Auth**: 6 hardcoded demo users (Friends cast) via Edge Middleware (V1)
- **Seed**: Smartwatch PLM dataset (6 teams, 10 PRs, 21 SRs, 18 TPs, 19 TPVs, 20 TCs, 6 attachments, 155 audit entries)
- **Versioning**: Two-entity pattern for test procedures (logical entity + immutable version snapshots)
- **Editing**: DRAFT entities fully editable, APPROVED entities allow title/description edits (audited), APPROVED TPV allows description only (steps locked), ACTIVE TPs allow title edits, PENDING TCs allow title/description edits. DRAFT PR/SR can be canceled (blocked if children exist)
- **Re-parenting**: SubRequirements can move to a different ProductRequirement, TestProcedures can move to a different SubRequirement. Children stay attached (lineage changes transitively). CANCELED entities cannot move, APPROVED SR cannot move to DRAFT PR. Confirm-before-act on both. All moves audited with RE_PARENT action.
- **Recovery**: Executed test cases (PASSED/FAILED/BLOCKED) support three recovery operations: correctTestResult (fix wrong result in place), reExecuteTestCase (reset FAILED/BLOCKED to PENDING), updateTestCaseNotes (add/edit notes without changing result). All corrections audited. Confirm-before-act on correct and re-execute.
- **Reactivation**: Canceled entities can be reactivated (PR/SR to DRAFT, TP to ACTIVE, TC SKIPPED to PENDING). Cascade reactivation brings back all canceled/skipped children. Top-down rule: parent must be non-canceled before children can reactivate. Confirm-before-act on all. Audited with REACTIVATE action.
- **Audit**: Every mutation logged in same Prisma transaction, `AuditSource` type (`"api" | "chat" | "panel"`) on `RequestContext` threads source through to `writeAuditLog` (chat route overrides to `"chat"`, panel sets `X-Audit-Source: panel` header)
- **Security**: Rate limiting on `/api/chat` (10 req/min per IP via in-memory sliding window in `src/lib/rate-limit.ts`, `RATE_LIMIT_DISABLED` env var kill switch, note: per-instance only on Vercel serverless), security headers in `next.config.ts` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy), `skipHtml` on ReactMarkdown, DOMPurify on Mermaid SVG (`ADD_TAGS: ["foreignObject", "style"]` to preserve text labels while sanitizing), trace logging guarded behind `NODE_ENV !== 'production'`, UUID format validation on `x-demo-user-id` header in Edge Middleware, generic error messages in `handleApiError()` (no Prisma/DB detail leakage), `robots.txt` blocks `/api/` from crawlers, chat body size enforced via `TextEncoder` byte length (not string length)
- **Performance**: Zustand individual selectors (not bare `usePanelStore()`), `React.memo` on MessageBubble, `useCallback` for chip handlers, `.trim()` on all Zod string inputs
- **Accessibility**: `aria-expanded` on toggle buttons, `aria-label` on icon-only buttons, `title` tooltips on truncated text
- **Code organization**: Panel barrel export at `src/components/panel/index.ts`

## Who I Am

PM learning to code. Explain things simply. Show your work.

## My Preferences

- Domain commands over generic CRUD endpoints
- Service layer owns lifecycle rules and transaction boundaries
- Route handlers stay thin (parse, delegate, respond)
- Centralized error handling via `handleApiError()` in `src/lib/api-utils.ts`
- Zod schemas shared between API validation and LLM tool definitions
- No hard deletes - use cancel/skip status transitions (attachments use soft-delete with ACTIVE/REMOVED status)
- Exclusive Arc pattern for polymorphic ownership (attachments) - enforced by DB CHECK constraint + Zod
- Single-draft-per-procedure enforced at service layer + DB partial unique index
- `ACTIVE_ATTACHMENT_FILTER` constant in `src/lib/prisma.ts` - use in all attachment queries
- LLM tools call services directly (not HTTP routes) for mutations
- Confirm-before-act for destructive LLM operations via prompt engineering + `z.literal(true)`
- Compact Prisma `select` payloads in LLM tools to protect context window
- Stable error prefixes in tool responses: `LifecycleError:`, `NotFoundError:`, `ValidationError:`
- Database setup via `prisma migrate deploy` (not `db push`) - migration includes custom SQL constraints
