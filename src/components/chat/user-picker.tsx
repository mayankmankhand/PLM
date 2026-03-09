// Demo user picker dropdown.
// Lets users switch between Alice, Bob, and Carol to test
// different team contexts and audit trails.
// Switching clears the chat history (fresh conversation).

"use client";

import { ChevronDown } from "lucide-react";

// Demo users matching src/lib/demo-users.ts.
// Duplicated here to avoid importing server-side code into client components.
const DEMO_USERS = [
  {
    id: "b1c2d3e4-0001-4000-8000-000000000001",
    name: "Alice Chen",
    role: "PM",
  },
  {
    id: "b1c2d3e4-0002-4000-8000-000000000002",
    name: "Bob Smith",
    role: "Engineer",
  },
  {
    id: "b1c2d3e4-0003-4000-8000-000000000003",
    name: "Carol Davis",
    role: "QA Lead",
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
        className="appearance-none bg-surface border border-border rounded-lg
                   pl-3 pr-8 py-2 text-sm text-text
                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                   cursor-pointer transition-colors duration-150"
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
