# Lessons Learned

<!-- Keep entries concise. For deep dives into why a concept works, use /learning-opportunity instead. -->

## What I Learned
<!-- Add entries after each session where you learned something new -->

- **XML tags in prompts are a real thing, not just hype.** All three major providers (Anthropic, OpenAI, Google) recommend XML for complex, multi-section prompts. The key insight: XML helps AI distinguish *what kind of content* a section is (rules vs templates vs examples), which markdown headers alone can't do.
- **Hybrid approach beats all-or-nothing.** Don't replace markdown with XML - use both. Markdown headers stay for human readability, XML wraps content blocks for AI parsing. Pattern: header outside the tag, content inside.
- **AI peer review recommendations often over-engineer.** When /ask-gpt and /ask-gemini reviewed the XML plan, they recommended namespaced tags (`tk_rules`), a formal schema file, testing rubrics, and a three-wave rollout. Most of that was unnecessary for 9 small files. Trust your gut when something feels like too much.

- **Vercel AI SDK v6 renamed everything.** `maxSteps` is now `stopWhen: stepCountIs(N)`. `parameters` on tool definitions is now `inputSchema`. `toDataStreamResponse()` is now `toUIMessageStreamResponse()`. Online tutorials and AI training data reference v3/v4 names. Always check the actual type definitions in `node_modules/ai/dist/index.d.ts` when something doesn't compile.
- **Confirm-before-act works with prompt engineering alone.** No need for middleware or multi-step confirmation flows. Put the rule in the system prompt ("NEVER pass confirmPublish: true unless user explicitly confirmed") and require a `z.literal(true)` field on destructive tool schemas. The LLM consistently asks for confirmation first.
- **LLM tools should call services, not HTTP routes.** Calling your own API endpoints from tool functions creates unnecessary network round-trips and auth headaches. Call the service layer directly - you already have the RequestContext.

## Mistakes to Avoid
<!-- Add patterns that caused problems so they don't repeat -->

- **Don't micro-tag individual bullets.** Tag sections, not lines. Wrapping every bullet in XML adds noise without helping parsing.
- **Watch for tool output artifacts in reviews.** The Read tool's output wrapper (`</output>`) can look like actual file content. Always verify with raw bytes before "fixing" something that might not be broken.
- **Skill tool expansions can serve stale command versions.** Root cause: old command files in `~/.claude/commands/` (global/home directory) override the project's `.claude/commands/` files. In our case, 9 files were manually copied to the home directory in January before setup.sh existed, then never updated. When slash commands ran, the AI used the global copies instead of the current project versions - missing Staff Engineer Check, Finding IDs, and other updates. Fix: delete global copies (commands should only live in each project folder) and setup.sh now warns if it detects conflicting global files. See issue #52.
- **Prisma CLI reads `.env`, not `.env.local`.** Next.js reads `.env.local` but Prisma CLI only reads `.env`. If your DATABASE_URL is in `.env.local`, create a `.env` with just that variable (already in `.gitignore`).
- **`create-next-app` rejects uppercase project names.** Scaffold into a temp dir with a lowercase name, then copy the config files into your actual project directory.
- **Don't put Prisma types in Edge-compatible files.** The demo-users module needed to work in Edge Middleware, so it must be pure TypeScript with no Prisma imports. Keep Edge-compatible modules free of Node-only dependencies.

## Patterns That Work
<!-- Add approaches and conventions that proved effective -->

- **Tag vocabulary for prompts:** `<rules>` (must-follow), `<procedure>` (step-by-step), `<template>` (copy-paste schemas), `<output_format>` (expected output), `<conditions>` (if-then logic), `<guidelines>` (best practices), `<reference>` (lookup tables), `<phase>` (named stages), `<examples>` (good/bad demos).
- **Audit before converting.** Not every file needs XML. Short files, human-facing docs, and already-structured data are fine without it. Focus on files where the AI needs to distinguish content types.
- **Domain commands over raw CRUD.** Instead of generic `PATCH /resource/:id`, use intent-revealing endpoints like `POST /resource/:id/publish`. Each endpoint maps to one business action with clear lifecycle rules. This makes the API self-documenting and prevents invalid state transitions at the routing level.
- **Two-entity versioning.** Split "thing that evolves" into a logical entity (TestProcedure) and immutable version snapshots (TestProcedureVersion). The logical entity holds identity and current status; versions hold content and are immutable once published. Enforced at service layer with a single-draft rule.
- **Exclusive Arc for polymorphic ownership.** Instead of a generic `parent_type` + `parent_id` (which can't have FK constraints), use one table with optional FK columns per parent type. Zod validates exactly one is non-null. You get real foreign keys and referential integrity.
- **Service layer = transaction boundary.** Every service function wraps its mutation + audit log in a single Prisma interactive transaction. Route handlers stay thin (parse input, call service, return response). This guarantees consistency and makes testing easier.
- **Centralized error handling.** One `handleApiError()` function maps error types to HTTP status codes (ZodError->400, LifecycleError->409, Prisma P2025->404). Route handlers just catch and delegate.
- **Three-model review consensus.** Running `/review`, `/ask-gpt`, and `/ask-gemini` in parallel catches different things. Claude caught structural issues, GPT found edge cases, Gemini spotted missing error classes. Fix items all three agree on; track the rest as issues.
- **Triage review findings: fix now vs track later.** After a multi-model review, split findings into quick fixes (do now) and follow-ups (add as comments on existing issues or create new ones). Don't try to fix everything in one pass - it bloats the commit and risks scope creep.
- **Single source of truth for seed data IDs.** Seed scripts should import IDs from the same module the app uses (e.g. `demo-users.ts`), not hardcode duplicates. Caught during review when seed had copy-pasted user IDs that could drift from the source.
- **`Record<EnumA, EnumB>` for type-safe enum mappings.** TypeScript's `Record` with Prisma enum types (e.g. `Record<TestCaseResult, TestCaseStatus>`) ensures every enum value is handled at compile time. Used in the test case result-to-status mapping - if a new enum value is added, TypeScript will error until you handle it.
- **Compact Prisma `select` in LLM tools.** LLM tools must use explicit `select` clauses with `take` limits on nested relations. Without limits, a single traceability chain query could return 40K+ objects (20 x 20 x 5 x 20). With limits (10 x 10 x 3 x 5), max is 1.5K. Also use parallel `prisma.count()` for true totals when paginating.
- **Stable error prefixes for LLM tools.** Return errors as strings with prefixes (`LifecycleError: ...`, `NotFoundError: ...`) instead of throwing. The LLM can parse these to give users plain-language explanations. Use `instanceof` checks (not `error.name` string comparison) for reliable error type detection.
