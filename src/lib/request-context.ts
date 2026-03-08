// Extracts a RequestContext from incoming API requests.
// Relies on headers set by the Edge Middleware in src/middleware.ts.

import { getUserById } from "./demo-users";

export interface RequestContext {
  userId: string;
  teamId: string;
  role: string;
  requestId: string;
}

/**
 * Build a RequestContext from the incoming request headers.
 *
 * Expects the middleware to have already validated and set:
 *   - x-demo-user-id  (required)
 *   - x-request-id    (required)
 *
 * Throws if the user cannot be found (should not happen when middleware is in place).
 */
export function getRequestContext(request: Request): RequestContext {
  const userId = request.headers.get("x-demo-user-id");
  const requestId = request.headers.get("x-request-id");

  if (!userId) {
    throw new Error("Missing x-demo-user-id header. Is the middleware running?");
  }

  if (!requestId) {
    throw new Error("Missing x-request-id header. Is the middleware running?");
  }

  const user = getUserById(userId);

  if (!user) {
    throw new Error(`Unknown user id: ${userId}`);
  }

  return {
    userId: user.id,
    teamId: user.teamId,
    role: user.role,
    requestId,
  };
}
