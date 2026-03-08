# Lessons Learned

<!-- Keep entries concise. For deep dives into why a concept works, use /learning-opportunity instead. -->

## What I Learned
<!-- Add entries after each session where you learned something new -->

- **XML tags in prompts are a real thing, not just hype.** All three major providers (Anthropic, OpenAI, Google) recommend XML for complex, multi-section prompts. The key insight: XML helps AI distinguish *what kind of content* a section is (rules vs templates vs examples), which markdown headers alone can't do.
- **Hybrid approach beats all-or-nothing.** Don't replace markdown with XML - use both. Markdown headers stay for human readability, XML wraps content blocks for AI parsing. Pattern: header outside the tag, content inside.
- **AI peer review recommendations often over-engineer.** When /ask-gpt and /ask-gemini reviewed the XML plan, they recommended namespaced tags (`tk_rules`), a formal schema file, testing rubrics, and a three-wave rollout. Most of that was unnecessary for 9 small files. Trust your gut when something feels like too much.

## Mistakes to Avoid
<!-- Add patterns that caused problems so they don't repeat -->

- **Don't micro-tag individual bullets.** Tag sections, not lines. Wrapping every bullet in XML adds noise without helping parsing.
- **Watch for tool output artifacts in reviews.** The Read tool's output wrapper (`</output>`) can look like actual file content. Always verify with raw bytes before "fixing" something that might not be broken.
- **Skill tool expansions can serve stale command versions.** Root cause: old command files in `~/.claude/commands/` (global/home directory) override the project's `.claude/commands/` files. In our case, 9 files were manually copied to the home directory in January before setup.sh existed, then never updated. When slash commands ran, the AI used the global copies instead of the current project versions - missing Staff Engineer Check, Finding IDs, and other updates. Fix: delete global copies (commands should only live in each project folder) and setup.sh now warns if it detects conflicting global files. See issue #52.

## Patterns That Work
<!-- Add approaches and conventions that proved effective -->

- **Tag vocabulary for prompts:** `<rules>` (must-follow), `<procedure>` (step-by-step), `<template>` (copy-paste schemas), `<output_format>` (expected output), `<conditions>` (if-then logic), `<guidelines>` (best practices), `<reference>` (lookup tables), `<phase>` (named stages), `<examples>` (good/bad demos).
- **Audit before converting.** Not every file needs XML. Short files, human-facing docs, and already-structured data are fine without it. Focus on files where the AI needs to distinguish content types.
