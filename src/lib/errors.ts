// Custom error classes for domain rule violations.
// These let the API layer return proper HTTP status codes:
//   - LifecycleError  -> 409 Conflict (action not allowed in current state)
//   - NotFoundError   -> 404 Not Found
//   - ValidationError -> 400 Bad Request (Zod handles most of these)

export class LifecycleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LifecycleError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}
