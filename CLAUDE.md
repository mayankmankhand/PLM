# Project Instructions for Claude

<!-- This file is YOURS. Add your project-specific info below. -->
<!-- Toolkit rules live in .claude/rules/toolkit.md (managed by the toolkit, auto-discovered by Claude). -->
<!-- See README.md > "How It Works" for details on how these files connect. -->

## About This Project

**PLM** - Product Lifecycle Management system for managing requirements, test procedures, and test cases.

- **Stack**: Next.js 16 (App Router) + TypeScript + Prisma ORM + Neon PostgreSQL + Tailwind CSS v4 + Zod + Vitest
- **AI**: Vercel AI SDK v6 + Anthropic Claude (streaming chat with 28 tools)
- **UI**: Dual-panel chat app with `@ai-sdk/react` useChat hook, Zustand panel store, react-markdown, lucide-react icons
- **Design**: Warm earthy beige palette (#F8F0E3 bg, #B45309 amber primary), `.chat-markdown` CSS class for assistant messages, StatusBadge shared component
- **Panel**: AI-controlled context panel (detail views, data tables, Mermaid diagrams) via 3 UI intent tools
- **API pattern**: Domain commands (not raw CRUD) - e.g. `POST /api/product-requirements/:id/approve`
- **Auth**: 3 hardcoded demo users via Edge Middleware (V1)
- **Seed**: Smartwatch PLM dataset (6 teams, 6 PRs, 8 SRs, 8 TPs, 8 TCs with mixed statuses)
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
- No hard deletes - use cancel/skip status transitions
- Exclusive Arc pattern for polymorphic ownership (attachments)
- Single-draft-per-procedure enforced at service layer
- LLM tools call services directly (not HTTP routes) for mutations
- Confirm-before-act for destructive LLM operations via prompt engineering + `z.literal(true)`
- Compact Prisma `select` payloads in LLM tools to protect context window
- Stable error prefixes in tool responses: `LifecycleError:`, `NotFoundError:`, `ValidationError:`
