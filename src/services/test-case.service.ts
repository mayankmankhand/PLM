// Test Case service - record results, invalidate.
// Test cases belong to a TestProcedureVersion. Results can only be recorded
// when the parent version is PUBLISHED.

import { prisma } from "@/lib/prisma";
import { TestCaseResult, TestCaseStatus } from "@prisma/client";
import { RequestContext } from "@/lib/request-context";
import { LifecycleError } from "@/lib/errors";
import { writeAuditLog } from "./audit.service";
import type {
  CreateTestCaseInput,
  RecordTestResultInput,
} from "@/schemas/test-case.schema";

// ─── Create ──────────────────────────────────────────────

export async function createTestCase(
  input: CreateTestCaseInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    // Verify parent version exists
    await tx.testProcedureVersion.findUniqueOrThrow({
      where: { id: input.testProcedureVersionId },
    });

    const testCase = await tx.testCase.create({
      data: {
        title: input.title,
        description: input.description,
        testProcedureVersionId: input.testProcedureVersionId,
        createdBy: ctx.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "CREATE",
      entityType: "TestCase",
      entityId: testCase.id,
      requestId: ctx.requestId,
      changes: {
        title: input.title,
        description: input.description,
        testProcedureVersionId: input.testProcedureVersionId,
      },
    });

    return testCase;
  });
}

// ─── Record result (parent version must be published) ────

export async function recordTestResult(
  id: string,
  input: RecordTestResultInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testCase.findUniqueOrThrow({
      where: { id },
      include: { testProcedureVersion: true },
    });

    if (existing.testProcedureVersion.status !== "PUBLISHED") {
      throw new LifecycleError(
        `Cannot record result: parent procedure version is ${existing.testProcedureVersion.status}. It must be PUBLISHED.`
      );
    }

    if (existing.status === "INVALIDATED") {
      throw new LifecycleError("Cannot record result for an invalidated test case.");
    }

    // Map result to status.
    // SKIPPED means "skip this round, return to PENDING" - it's a temporary
    // deferment, not a terminal outcome. The test case can be re-executed later.
    const statusMap: Record<TestCaseResult, TestCaseStatus> = {
      PASS: "PASSED",
      FAIL: "FAILED",
      BLOCKED: "BLOCKED",
      SKIPPED: "PENDING",
    };

    const updated = await tx.testCase.update({
      where: { id },
      data: {
        result: input.result,
        status: statusMap[input.result],
        notes: input.notes,
        executedBy: ctx.userId,
        executedAt: new Date(),
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "RECORD_RESULT",
      entityType: "TestCase",
      entityId: id,
      requestId: ctx.requestId,
      changes: {
        result: input.result,
        status: { from: existing.status, to: statusMap[input.result] },
        notes: input.notes,
      },
    });

    return updated;
  });
}

// ─── Invalidate ──────────────────────────────────────────

export async function invalidateTestCase(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testCase.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status === "INVALIDATED") {
      throw new LifecycleError("Test case is already invalidated.");
    }

    const updated = await tx.testCase.update({
      where: { id },
      data: { status: "INVALIDATED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "INVALIDATE",
      entityType: "TestCase",
      entityId: id,
      requestId: ctx.requestId,
      changes: { status: { from: existing.status, to: "INVALIDATED" } },
    });

    return updated;
  });
}
