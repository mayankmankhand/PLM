# Project Instructions for Claude

<!-- This file is YOURS. Add your project-specific info below. -->
<!-- Toolkit rules live in .claude/rules/toolkit.md (managed by the toolkit, auto-discovered by Claude). -->
<!-- See README.md > "How It Works" for details on how these files connect. -->

## About This Project

**PLM** - Product Lifecycle Management system for managing requirements, test procedures, and test cases.

- **Stack**: Next.js 16 (App Router) + TypeScript + Prisma ORM + Neon PostgreSQL + Tailwind CSS v4 + Zod + Vitest
- **AI**: Vercel AI SDK v6 + Anthropic Claude (streaming chat with 29 tools)
- **UI**: Dual-panel chat app with `@ai-sdk/react` useChat hook, Zustand panel store, react-markdown, lucide-react icons
- **Design**: Cool slate+teal palette (#F4F5F7 bg, #0D9488 teal primary), DM Sans + JetBrains Mono fonts, frosted glass surfaces, `.chat-markdown` CSS class for assistant messages, StatusBadge shared component
- **Panel**: AI-controlled context panel (detail views, data tables, Mermaid diagrams, audit log) via 4 UI intent tools. Always-fixed overlay with frosted glass (`backdrop-blur`), drag-to-resize (540px default, 360-800px via Zustand `panelWidth`), keyboard shortcuts (Cmd+K focus, Cmd+\ toggle, Escape close), shared `useDesktopBreakpoint` hook for hydration-safe media queries
- **API pattern**: Domain commands (not raw CRUD) - e.g. `POST /api/product-requirements/:id/approve`
- **Auth**: 6 hardcoded demo users (Friends cast) via Edge Middleware (V1)
- **Seed**: Smartwatch PLM dataset (6 teams, 10 PRs, 21 SRs, 18 TPs, 19 TPVs, 20 TCs, 6 attachments, 155 audit entries)
- **Versioning**: Two-entity pattern for test procedures (logical entity + immutable version snapshots)
- **Audit**: Every mutation logged in same Prisma transaction

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
