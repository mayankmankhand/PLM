// Shared API route utilities.
// Centralizes error handling so route handlers stay thin.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AuthError, LifecycleError, NotFoundError } from "./errors";

/**
 * Convert any caught error into an appropriate NextResponse.
 *
 * - ZodError          -> 400 with validation details
 * - AuthError         -> 401 Unauthorized (missing auth headers)
 * - LifecycleError    -> 409 Conflict (action not allowed in current state)
 * - NotFoundError     -> 404
 * - Prisma P2025      -> 404 (record not found)
 * - Other Error       -> 400 (generic bad request)
 * - Unknown           -> 500
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: error.errors },
      { status: 400 }
    );
  }

  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    );
  }

  if (error instanceof LifecycleError) {
    return NextResponse.json(
      { error: error.message },
      { status: 409 }
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    // Return generic message instead of Prisma's detailed error
    // which can leak schema details (table names, constraint names).
    return NextResponse.json(
      { error: "Record not found" },
      { status: 404 }
    );
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found")) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    // Generic message for unrecognized errors - don't leak internal details
    // like Prisma constraint names or stack traces to the client.
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
