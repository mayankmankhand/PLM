# PLM - Product Lifecycle Management

A lightweight PLM system for managing product requirements, test procedures, and test cases with full lifecycle tracking and audit logging.

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Neon PostgreSQL via Prisma ORM
- **AI**: Vercel AI SDK v6 + Anthropic Claude (streaming chat with 25 LLM tools)
- **Validation**: Zod schemas (shared between API routes and LLM tools)
- **Testing**: Vitest
- **Auth**: Demo users via Edge Middleware (hardcoded for V1)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Add your Neon DATABASE_URL and ANTHROPIC_API_KEY to .env.local
# Also create .env with just DATABASE_URL (Prisma CLI needs this)

# Push schema to database
npx prisma db push

# Seed demo data
npx prisma db seed

# Start dev server
npm run dev
```

## API Design

The API uses **domain commands** instead of raw CRUD. Each endpoint maps to one business action:

```
POST /api/product-requirements/create
POST /api/product-requirements/:id/publish
POST /api/product-requirements/:id/obsolete
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

Send `{ messages: [{ role, content }] }` with `x-demo-user-id` header. Returns a Vercel AI SDK stream. The LLM has 25 tools (15 mutation, 5 read, 4 query, 1 search) and confirms before destructive actions.

### Named Queries

```
GET /api/queries/traceability-chain?requirementId=...
GET /api/queries/uncovered-sub-requirements
GET /api/queries/procedures-without-test-cases
GET /api/queries/recent-audit
```

### Lifecycle Rules

- **Draft** entities are fully editable
- **Published** requirements are immutable (except status transitions)
- **Published** procedure versions are fully immutable
- Sub-requirements can only be published if their parent requirement is published
- Test results can only be recorded against published procedure versions
- Only one draft version per test procedure at a time

### Auth

V1 uses 3 hardcoded demo users. Set `x-demo-user-id` header to switch users (defaults to Alice):

| User | Role | Team |
|------|------|------|
| Alice Chen | pm | Platform Team |
| Bob Smith | engineer | Platform Team |
| Carol Davis | qa_lead | QA Team |

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests (36 tests)
npm run test:watch   # Watch mode
npm run lint         # ESLint
```

## Project Structure

```
src/
  app/api/           # 32 route handlers (domain commands + queries + chat)
  lib/ai/            # LLM layer: system prompt, 25 tools, trace logger
  lib/               # Shared utilities (prisma, errors, auth, demo-users)
  schemas/           # Zod validation schemas
  services/          # Business logic with lifecycle enforcement + audit logging
  __tests__/         # Vitest tests (lifecycle, schema, integration)
prisma/
  schema.prisma      # Database schema (9 models, 7 enums)
  seed.ts            # Demo data seeder
```

## Issues & Roadmap

- **Issue #4**: LLM backend - 25 tools + streaming chat endpoint (DONE)
- **Issue #9**: Document parsing pipeline - PDF, Word, URL (future)
- **Issue #5**: Frontend UI
- **Issue #7**: CI/CD pipeline
- **Issue #8**: Database hardening (partial unique indexes, check constraints)
