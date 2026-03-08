// Hardcoded demo users for development.
// This file is plain TypeScript (no Prisma imports) so it can run in Edge Middleware.

export interface DemoTeam {
  id: string;
  name: string;
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string;
}

// ── Teams ──────────────────────────────────────────────────

export const DEMO_TEAMS: DemoTeam[] = [
  { id: "a1b2c3d4-0001-4000-8000-000000000001", name: "Platform Team" },
  { id: "a1b2c3d4-0002-4000-8000-000000000002", name: "QA Team" },
];

// ── Users ──────────────────────────────────────────────────

export const DEMO_USERS: DemoUser[] = [
  {
    id: "b1c2d3e4-0001-4000-8000-000000000001",
    name: "Alice Chen",
    email: "alice@example.com",
    role: "pm",
    teamId: DEMO_TEAMS[0].id,
  },
  {
    id: "b1c2d3e4-0002-4000-8000-000000000002",
    name: "Bob Smith",
    email: "bob@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[0].id,
  },
  {
    id: "b1c2d3e4-0003-4000-8000-000000000003",
    name: "Carol Davis",
    email: "carol@example.com",
    role: "qa_lead",
    teamId: DEMO_TEAMS[1].id,
  },
];

// ── Lookup ─────────────────────────────────────────────────

const usersById = new Map(DEMO_USERS.map((u) => [u.id, u]));

export function getUserById(id: string): DemoUser | undefined {
  return usersById.get(id);
}
