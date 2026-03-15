# Project Instructions for Claude

<!-- This file is YOURS. Add your project-specific info below. -->
<!-- Toolkit rules live in .claude/rules/toolkit.md (managed by the toolkit, auto-discovered by Claude). -->
<!-- See README.md > "How It Works" for details on how these files connect. -->

## About This Project

**PLM** - Product Lifecycle Management system for managing requirements, test procedures, and test cases.

- **Stack**: Next.js 16 (App Router) + TypeScript + Prisma ORM + Neon PostgreSQL + Tailwind CSS v4 + Zod + Vitest
- **AI**: Vercel AI SDK v6 + Anthropic Claude (streaming chat with 36 tools, model configurable via `ANTHROPIC_MODEL` env var, default Haiku 4.5)
- **UI**: Dual-panel chat app with `@ai-sdk/react` useChat hook, Zustand panel store, react-markdown, lucide-react icons, ThinkingIndicator (cycling PLM phrases while waiting for AI response)
- **Design**: Cool slate+teal palette (#F4F5F7 bg, #0D9488 teal primary), DM Sans + JetBrains Mono fonts, frosted glass surfaces, `.chat-markdown` CSS class for assistant messages, StatusBadge shared component
- **Panel**: AI-controlled context panel (detail views with inline attachments, data tables, Mermaid diagrams, audit log) via 4 UI intent tools. Always-fixed overlay with frosted glass (`backdrop-blur`), drag-to-resize (540px default, 360-800px via Zustand `panelWidth`), keyboard shortcuts (Cmd+K focus, Cmd+\ toggle, Escape close), shared `useDesktopBreakpoint` hook for hydration-safe media queries. Diagrams render at natural SVG size (no max-w-full) with zoom controls (+/-, Fit button, Copy source), max-h-[60vh] container, LLM guided to generate compact `flowchart LR` with short labels and no classDef. showTable supports 10 query types (7 enriched list/gap queries + 3 aggregations) with cross-entity columns, team filter, fetch-16-return-15 truncation detection (`isTruncated` flag on TablePayload)
- **API pattern**: Domain commands (not raw CRUD) - e.g. `POST /api/product-requirements/:id/approve`
- **Auth**: 6 hardcoded demo users (Friends cast) via Edge Middleware (V1)
- **Seed**: Smartwatch PLM dataset (6 teams, 10 PRs, 21 SRs, 18 TPs, 19 TPVs, 20 TCs, 6 attachments, 155 audit entries)
- **Versioning**: Two-entity pattern for test procedures (logical entity + immutable version snapshots)
- **Editing**: DRAFT entities fully editable, APPROVED entities allow title/description edits (audited), APPROVED TPV allows description only (steps locked), ACTIVE TPs allow title edits, PENDING TCs allow title/description edits. DRAFT PR/SR can be canceled (blocked if children exist)
- **Recovery**: Executed test cases (PASSED/FAILED/BLOCKED) support three recovery operations: correctTestResult (fix wrong result in place), reExecuteTestCase (reset FAILED/BLOCKED to PENDING), updateTestCaseNotes (add/edit notes without changing result). All corrections audited. Confirm-before-act on correct and re-execute.
- **Audit**: Every mutation logged in same Prisma transaction, `AuditSource` type (`"api" | "chat"`) on `RequestContext` threads source through to `writeAuditLog` (chat route overrides to `"chat"`)
- **Security**: Rate limiting on `/api/chat` (10 req/min per IP via in-memory sliding window in `src/lib/rate-limit.ts`), security headers in `next.config.ts` (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy), `skipHtml` on ReactMarkdown, DOMPurify on Mermaid SVG (`ADD_TAGS: ["foreignObject", "style"]` to preserve text labels while sanitizing), trace logging guarded behind `NODE_ENV !== 'production'`, UUID format validation on `x-demo-user-id` header in Edge Middleware
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
