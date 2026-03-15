// Sub-Requirement service - domain commands with lifecycle enforcement.
// Sub-requirements inherit team context and require an approved parent for approval.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { RequestContext } from "@/lib/request-context";
import { LifecycleError } from "@/lib/errors";
import { writeAuditLog } from "./audit.service";
import { cascadeCancelTestProcedure } from "./test-procedure.service";
import type {
  CreateSubRequirementInput,
  UpdateSubRequirementInput,
} from "@/schemas/sub-requirement.schema";

// ─── Cascade helper (used by PR cancel) ─────────────────

/**
 * Cancel a single sub-requirement and cascade to its TPs and TCs.
 * Already-CANCELED SRs are silently skipped. Cancels regardless of current
 * status (bypasses the entry-point APPROVED-only guard for cascade scenarios
 * where a parent PR is canceled and DRAFT child SRs must also be canceled).
 * Call within an existing transaction.
 */
export async function cascadeCancelSubRequirement(
  tx: Prisma.TransactionClient,
  subRequirementId: string,
  ctx: RequestContext
) {
  const sr = await tx.subRequirement.findUniqueOrThrow({
    where: { id: subRequirementId },
  });

  // Already canceled - skip silently
  if (sr.status === "CANCELED") return;

  await tx.subRequirement.update({
    where: { id: subRequirementId },
    data: { status: "CANCELED" },
  });

  await writeAuditLog(tx, {
    actorId: ctx.userId,
    action: "CANCEL",
    entityType: "SubRequirement",
    entityId: subRequirementId,
    source: ctx.source,
    requestId: ctx.requestId,
    changes: { status: { from: sr.status, to: "CANCELED" } },
  });

  // Cascade to all child test procedures (and their test cases)
  const procedures = await tx.testProcedure.findMany({
    where: { subRequirementId },
    select: { id: true },
  });

  await Promise.all(
    procedures.map((tp) => cascadeCancelTestProcedure(tx, tp.id, ctx))
  );
}

// ─── Create ──────────────────────────────────────────────

export async function createSubRequirement(
  input: CreateSubRequirementInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    // Verify parent product requirement exists
    await tx.productRequirement.findUniqueOrThrow({
      where: { id: input.productRequirementId },
    });

    const subReq = await tx.subRequirement.create({
      data: {
        title: input.title,
        description: input.description,
        productRequirementId: input.productRequirementId,
        teamId: input.teamId,
        createdBy: ctx.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "CREATE",
      entityType: "SubRequirement",
      entityId: subReq.id,
      source: ctx.source,
      requestId: ctx.requestId,
      changes: {
        title: input.title,
        description: input.description,
        productRequirementId: input.productRequirementId,
        teamId: input.teamId,
      },
    });

    return subReq;
  });
}

// ─── Update (draft only) ─────────────────────────────────

export async function updateSubRequirement(
  id: string,
  input: UpdateSubRequirementInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subRequirement.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "DRAFT") {
      throw new LifecycleError(
        `Cannot update sub-requirement in ${existing.status} status. Only DRAFT sub-requirements can be edited.`
      );
    }

    const changes: Record<string, unknown> = {};
    if (input.title !== undefined) changes.title = { from: existing.title, to: input.title };
    if (input.description !== undefined) changes.description = { from: existing.description, to: input.description };

    const updated = await tx.subRequirement.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "UPDATE",
      entityType: "SubRequirement",
      entityId: id,
      source: ctx.source,
      requestId: ctx.requestId,
      changes,
    });

    return updated;
  });
}

// ─── Approve (requires parent to be approved) ────────────

export async function approveSubRequirement(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subRequirement.findUniqueOrThrow({
      where: { id },
      include: { productRequirement: true },
    });

    if (existing.status !== "DRAFT") {
      throw new LifecycleError(
        `Cannot approve sub-requirement in ${existing.status} status. Only DRAFT sub-requirements can be approved.`
      );
    }

    if (existing.productRequirement.status !== "APPROVED") {
      throw new LifecycleError(
        `Cannot approve sub-requirement: parent product requirement is ${existing.productRequirement.status}. It must be APPROVED first.`
      );
    }

    const updated = await tx.subRequirement.update({
      where: { id },
      data: { status: "APPROVED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "APPROVE",
      entityType: "SubRequirement",
      entityId: id,
      source: ctx.source,
      requestId: ctx.requestId,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
    });

    return updated;
  });
}

// ─── Cancel (with cascade to TPs and TCs) ──────────────

export async function cancelSubRequirement(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subRequirement.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "APPROVED") {
      throw new LifecycleError(
        `Cannot cancel sub-requirement in ${existing.status} status. Only APPROVED sub-requirements can be canceled.`
      );
    }

    // Cancel SR (skip the re-fetch since we already checked status)
    await tx.subRequirement.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "CANCEL",
      entityType: "SubRequirement",
      entityId: id,
      source: ctx.source,
      requestId: ctx.requestId,
      changes: { status: { from: "APPROVED", to: "CANCELED" } },
    });

    // Cascade to all child TPs and TCs
    const procedures = await tx.testProcedure.findMany({
      where: { subRequirementId: id },
      select: { id: true },
    });

    await Promise.all(
      procedures.map((tp) => cascadeCancelTestProcedure(tx, tp.id, ctx))
    );

    return tx.subRequirement.findUniqueOrThrow({ where: { id } });
  });
}
