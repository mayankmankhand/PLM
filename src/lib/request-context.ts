// Extracts a RequestContext from incoming API requests.
// Relies on headers set by the Edge Middleware in src/middleware.ts.

import { AuthError } from "./errors";
import { getUserById } from "./demo-users";


// Source tracks where a mutation originated, so audit logs can distinguish
// API calls from chat-initiated actions.
export type AuditSource = "api" | "chat";
export interface RequestContext {
  userId: string;
  teamId: string;
  role: string;
  requestId: string;
  source: AuditSource;
}

/**
 * Build a RequestContext from the incoming request headers.
 *
 * Expects the middleware to have already validated and set:
 *   - x-demo-user-id  (required)
 *   - x-request-id    (required)
 *
 * Throws AuthError if headers are missing or user is invalid.
 */
export function getRequestContext(request: Request): RequestContext {
  const userId = request.headers.get("x-demo-user-id");
  const requestId = request.headers.get("x-request-id");

  if (!userId) {
    throw new AuthError("Missing x-demo-user-id header. Is the middleware running?");
  }

  if (!requestId) {
    throw new AuthError("Missing x-request-id header. Is the middleware running?");
  }

  const user = getUserById(userId);

  if (!user) {
    throw new AuthError("Invalid user credentials");
  }

  return {
    userId: user.id,
    teamId: user.teamId,
    role: user.role,
    requestId,
    source: "api",
  };
}
