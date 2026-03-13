# PLM - Product Lifecycle Management

A lightweight PLM system for managing product requirements, test procedures, and test cases with full lifecycle tracking and audit logging.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Neon PostgreSQL via Prisma ORM
- **AI**: Vercel AI SDK v6 + Anthropic Claude (streaming chat with 29 LLM tools)
- **UI**: Tailwind CSS v4, Zustand, react-markdown, lucide-react, @ai-sdk/react, mermaid, dompurify
- **Validation**: Zod schemas (shared between API routes and LLM tools)
- **Testing**: Vitest (isolated test database via `vitest.global-setup.ts`)
- **Auth**: Demo users via Edge Middleware (hardcoded for V1)
- **Security**: Rate limiting (chat endpoint), security headers, HTML stripping in markdown

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your Neon DATABASE_URL and ANTHROPIC_API_KEY to .env.local
# Also create .env with just DATABASE_URL (Prisma CLI needs this)
# For tests: create .env.test with DATABASE_URL pointing to a separate test database

# Set up database (uses migration with custom SQL constraints)
npx prisma migrate deploy

# Seed demo data
npx prisma db seed

# Start dev server
npm run dev
```

## API Design

The API uses **domain commands** instead of raw CRUD. Each endpoint maps to one business action:

```
POST /api/product-requirements/create
POST /api/product-requirements/:id/approve
POST /api/product-requirements/:id/cancel
GET  /api/product-requirements
GET  /api/product-requirements/:id
```

### Entity Hierarchy

```
ProductRequirement (org-wide)
  -> SubRequirement (team-assigned)
    -> TestProcedure (logical container)
      -> TestProcedureVersion (immutable snapshots, one draft at a time)
        -> TestCase (execution records)
```

### Chat API (LLM)

```
POST /api/chat   # Streaming natural language interface to manage PLM entities
```

Send `{ messages: [{ role, content }] }` with `x-demo-user-id` header. Returns a Vercel AI SDK stream. The LLM has 29 tools (16 mutation, 4 read, 4 query, 1 search, 4 UI intent) and confirms before destructive actions.

### Named Queries

```
GET /api/queries/traceability-chain?requirementId=...
GET /api/queries/uncovered-sub-requirements
GET /api/queries/procedures-without-test-cases
GET /api/queries/recent-audit
```

### Lifecycle Rules

- **Draft** entities are fully editable
- **Approved** requirements are immutable (except cancel transition)
- **Approved** procedure versions are fully immutable
- Sub-requirements can only be approved if their parent requirement is approved
- Test results can only be recorded against approved procedure versions
- Only one draft version per test procedure at a time

### Auth

V1 uses 6 hardcoded demo users (Friends cast). Set `x-demo-user-id` header to switch users (defaults to Monica):

| User | Role | Team |
|------|------|------|
| Monica Geller | engineer | Hardware |
| Ross Geller | engineer | Algorithm |
| Rachel Green | engineer | App |
| Chandler Bing | engineer | Electrical |
| Joey Tribbiani | engineer | Mechanical |
| Phoebe Buffay | engineer | Testing |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests (74 tests, uses .env.test database)
npm run test:watch   # Watch mode
npm run lint         # ESLint
```

## Project Structure

```
src/
  app/               # Next.js pages + API routes
    api/             # 32 route handlers (domain commands + queries + chat)
    page.tsx         # Chat UI (dual-panel, streaming)
    globals.css      # Tailwind v4 + design tokens
  components/chat/   # Chat UI components (8 files)
  components/panel/  # Context panel views (detail, table, diagram, audit, error)
  hooks/             # Shared React hooks (useDesktopBreakpoint)
  stores/            # Zustand stores (panel state + width)
  types/             # Shared TypeScript types + Zod schemas (panel payloads)
  lib/ai/            # LLM layer: system prompt, 29 tools, trace logger
  lib/               # Shared utilities (prisma, errors, auth, demo-users)
  schemas/           # Zod validation schemas
  services/          # Business logic with lifecycle enforcement + audit logging
  __tests__/         # Vitest tests (lifecycle, schema, integration, panel)
prisma/
  schema.prisma      # Database schema (9 models, 7 enums)
  seed.ts            # Demo data seeder
```

## Issues & Roadmap

- **Issue #3**: Project foundation + database (DONE)
- **Issue #4**: LLM backend - 25 tools + streaming chat endpoint (DONE)
- **Issue #5**: Chat UI - single-panel streaming chat (DONE)
- **Issue #6**: Context panel - tables, diagrams, detail views (DONE)
- **Issue #7**: UI redesign + demo data (DONE)
- **Issue #8**: Database hardening (partial unique indexes, check constraints) (DONE)
- **Issue #9**: Document parsing pipeline - PDF, Word, URL (future)
- **Issue #10**: V2 panel features - clickable rows, history (future)
- **Issue #11**: Audit log viewer in context panel (DONE)
- **Issue #12**: Fix panel not opening on UI intent tool calls (DONE)
- **Issue #13**: Warm earthy beige palette refresh (DONE)
- **Issue #16**: Rename status enums for clarity (DONE)
- **Issue #17**: Test database isolation (DONE)
- **Issue #19**: Migration drift reset (DONE)
- **Issue #20**: UI redesign - slate+teal palette, drag-to-resize panel, keyboard shortcuts, suggestion chips (DONE)
- **Issue #22**: Security audit - rate limiting, security headers, XSS hardening, production logging guard (DONE)
- **Issue #25**: Match UI to prototype pixel-perfect - CSS reset fix, always-fixed panel, composer polish (DONE)
