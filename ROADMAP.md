# PLM Roadmap

What's built, what's next, and what's out of scope for the PLM system.

## V1 - Current Release

- AI chat assistant with 29 tools for managing requirements, test procedures, and test cases
- Context panel with detail views, data tables, Mermaid diagrams, and audit logs
- Status workflows with approval chains (Draft -> Approved -> Canceled)
- Two-entity versioning for test procedures (immutable snapshots)
- Full audit logging on every mutation
- Cross-entity queries (coverage analysis, test result summaries, gap detection)
- Smartwatch demo dataset with 6 teams and 6 users
- Rate limiting and security headers

## V2 - Planned

**Document Attachments** - Upload and parse PDFs, Word docs, and other files. The assistant will be able to read document contents and reference them in conversations.

**Editable Context Panel** - Edit entity fields directly in the panel's detail views and tables. Changes save to the database without switching to chat.

**Requirements Traceability Matrix** - A single table view mapping every requirement to its sub-requirements, test procedures, and test results. Shows coverage gaps at a glance across the entire project.

**Role-Based Access Control (RBAC)** - Replace the demo user dropdown with real authentication and role-based permissions. Control who can view, edit, and approve entities based on their role and team.

**Notifications** - In-app and/or email alerts when entities you care about change status, need your approval, or get assigned to you.

**Document Version Control** - Version uploaded documents (not just test procedures). Upload a new revision of a spec and see the full version history. Know which version is current.

## V3 - Future

**Configurable Approval Chains** - Define multi-step, multi-role approval workflows. For example, require sign-off from both the team lead and quality manager before a safety-critical requirement is approved. Supports sequential and parallel approval steps.

**Baseline Snapshots** - Capture a point-in-time snapshot of all requirements, test procedures, and test results at a milestone (e.g., "Design Review 2"). Compare baselines to see what changed between review gates.

**Quality Management (CAPA)** - Track quality issues and nonconformances when tests fail. Investigate root causes, assign corrective actions, and verify fixes with a structured closure workflow.

## Not Planned

- **Bill of Materials (BOM)** - Focus is on requirements and testing, not manufacturing
- **Engineering Change Orders (ECO)** - Approval chains in V3 cover the core workflow
- **Project Milestones/Timelines** - Out of scope for a requirements-focused tool
- **Dashboards** - The AI chat and context panel tables serve this purpose
