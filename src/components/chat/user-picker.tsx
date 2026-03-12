// Demo user picker dropdown.
// Lets users switch between six Friends characters to test
// different team contexts and audit trails.
// Switching clears the chat history (fresh conversation).

"use client";

import { ChevronDown } from "lucide-react";

// Demo users matching src/lib/demo-users.ts.
// Duplicated here to avoid importing server-side code into client components.
const DEMO_USERS = [
  {
    id: "b1c2d3e4-0001-4000-8000-000000000001",
    name: "Monica Geller",
    role: "Engineer",
  },
  {
    id: "b1c2d3e4-0002-4000-8000-000000000002",
    name: "Ross Geller",
    role: "Engineer",
  },
  {
    id: "b1c2d3e4-0003-4000-8000-000000000003",
    name: "Rachel Green",
    role: "Engineer",
  },
  {
    id: "b1c2d3e4-0004-4000-8000-000000000004",
    name: "Chandler Bing",
    role: "Engineer",
  },
  {
    id: "b1c2d3e4-0005-4000-8000-000000000005",
    name: "Joey Tribbiani",
    role: "Engineer",
  },
  {
    id: "b1c2d3e4-0006-4000-8000-000000000006",
    name: "Phoebe Buffay",
    role: "Engineer",
  },
] as const;

export type DemoUserId = (typeof DEMO_USERS)[number]["id"];
export const DEFAULT_USER_ID = DEMO_USERS[0].id;

interface UserPickerProps {
  selectedUserId: DemoUserId;
  onUserChange: (userId: DemoUserId) => void;
}

export function UserPicker({ selectedUserId, onUserChange }: UserPickerProps) {
  const selectedUser = DEMO_USERS.find((u) => u.id === selectedUserId);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="user-picker" className="text-xs text-text-muted whitespace-nowrap">
        Signed in as
      </label>
      <div className="relative">
      <select
        id="user-picker"
        value={selectedUserId}
        onChange={(e) => onUserChange(e.target.value as DemoUserId)}
        className="appearance-none bg-surface-elevated border border-border rounded-lg
                   pl-3 pr-8 py-2 text-sm text-text
                   focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                   cursor-pointer transition-colors duration-150
                   hover:border-primary/30"
      >
        {DEMO_USERS.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
      {/* Dropdown arrow overlay */}
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      {selectedUser && (
        <span className="sr-only">
          Currently logged in as {selectedUser.name}
        </span>
      )}
      </div>
    </div>
  );
}
