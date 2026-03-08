// Shared API route utilities.
// Centralizes error handling so route handlers stay thin.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { LifecycleError, NotFoundError } from "./errors";

/**
 * Convert any caught error into an appropriate NextResponse.
 *
 * - ZodError          -> 400 with validation details
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
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    );
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Parse pagination search params using defaults (page=1, limit=20).
 */
export function parsePagination(searchParams: URLSearchParams) {
  return {
    page: Number(searchParams.get("page") ?? "1"),
    limit: Number(searchParams.get("limit") ?? "20"),
  };
}
