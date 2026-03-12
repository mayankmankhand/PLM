// Hardcoded demo users for development (Friends characters).
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
  { id: "a1b2c3d4-0001-4000-8000-000000000001", name: "Electrical" },
  { id: "a1b2c3d4-0002-4000-8000-000000000002", name: "Mechanical" },
  { id: "a1b2c3d4-0003-4000-8000-000000000003", name: "App" },
  { id: "a1b2c3d4-0004-4000-8000-000000000004", name: "Algorithm" },
  { id: "a1b2c3d4-0005-4000-8000-000000000005", name: "Hardware" },
  { id: "a1b2c3d4-0006-4000-8000-000000000006", name: "Testing" },
];

// ── Users ──────────────────────────────────────────────────

export const DEMO_USERS: DemoUser[] = [
  {
    id: "b1c2d3e4-0001-4000-8000-000000000001",
    name: "Monica Geller",
    email: "monica@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[4].id, // Hardware
  },
  {
    id: "b1c2d3e4-0002-4000-8000-000000000002",
    name: "Ross Geller",
    email: "ross@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[3].id, // Algorithm
  },
  {
    id: "b1c2d3e4-0003-4000-8000-000000000003",
    name: "Rachel Green",
    email: "rachel@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[2].id, // App
  },
  {
    id: "b1c2d3e4-0004-4000-8000-000000000004",
    name: "Chandler Bing",
    email: "chandler@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[0].id, // Electrical
  },
  {
    id: "b1c2d3e4-0005-4000-8000-000000000005",
    name: "Joey Tribbiani",
    email: "joey@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[1].id, // Mechanical
  },
  {
    id: "b1c2d3e4-0006-4000-8000-000000000006",
    name: "Phoebe Buffay",
    email: "phoebe@example.com",
    role: "engineer",
    teamId: DEMO_TEAMS[5].id, // Testing
  },
];

// ── Lookup ─────────────────────────────────────────────────

const usersById = new Map(DEMO_USERS.map((u) => [u.id, u]));

export function getUserById(id: string): DemoUser | undefined {
  return usersById.get(id);
}
