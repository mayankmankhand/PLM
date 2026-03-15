// Test Case service - record results, skip.
// Test cases belong to a TestProcedureVersion. Results can only be recorded
// when the parent version is APPROVED.

import { prisma } from "@/lib/prisma";
import { TestCaseResult, TestCaseStatus } from "@prisma/client";
import { RequestContext } from "@/lib/request-context";
import { LifecycleError } from "@/lib/errors";
import { writeAuditLog } from "./audit.service";
import type {
  CreateTestCaseInput,
  UpdateTestCaseInput,
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
      source: ctx.source,
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

// ─── Update (PENDING only, title + description) ──────────

export async function updateTestCase(
  id: string,
  input: UpdateTestCaseInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testCase.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "PENDING") {
      throw new LifecycleError(
        `Cannot update test case in ${existing.status} status. Only PENDING test cases can be edited.`
      );
    }

    const changes: Record<string, unknown> = {};
    if (input.title !== undefined) changes.title = { from: existing.title, to: input.title };
    if (input.description !== undefined) changes.description = { from: existing.description, to: input.description };

    const updated = await tx.testCase.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "UPDATE",
      entityType: "TestCase",
      entityId: id,
      source: ctx.source,
      requestId: ctx.requestId,
      changes,
    });

    return updated;
  });
}

// ─── Record result (parent version must be approved) ─────

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

    if (existing.testProcedureVersion.status !== "APPROVED") {
      throw new LifecycleError(
        `Cannot record result: parent procedure version is ${existing.testProcedureVersion.status}. It must be APPROVED.`
      );
    }

    if (existing.status === "SKIPPED") {
      throw new LifecycleError("Cannot record result for a skipped test case.");
    }

    // Map result to status.
    // SKIPPED result means "skip this round, return to PENDING" - it's a temporary
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
      source: ctx.source,
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

// ─── Skip ───────────────────────────────────────────────

export async function skipTestCase(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testCase.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status === "SKIPPED") {
      throw new LifecycleError("Test case is already skipped.");
    }

    const updated = await tx.testCase.update({
      where: { id },
      data: { status: "SKIPPED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "SKIP",
      entityType: "TestCase",
      entityId: id,
      source: ctx.source,
      requestId: ctx.requestId,
      changes: { status: { from: existing.status, to: "SKIPPED" } },
    });

    return updated;
  });
}
