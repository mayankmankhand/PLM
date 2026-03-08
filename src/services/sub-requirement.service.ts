// Sub-Requirement service - domain commands with lifecycle enforcement.
// Sub-requirements inherit team context and require a published parent for publishing.

import { prisma } from "@/lib/prisma";
import { RequestContext } from "@/lib/request-context";
import { LifecycleError } from "@/lib/errors";
import { writeAuditLog } from "./audit.service";
import type {
  CreateSubRequirementInput,
  UpdateSubRequirementInput,
} from "@/schemas/sub-requirement.schema";

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
      requestId: ctx.requestId,
      changes,
    });

    return updated;
  });
}

// ─── Publish (requires parent to be published) ───────────

export async function publishSubRequirement(
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
        `Cannot publish sub-requirement in ${existing.status} status. Only DRAFT sub-requirements can be published.`
      );
    }

    if (existing.productRequirement.status !== "PUBLISHED") {
      throw new LifecycleError(
        `Cannot publish sub-requirement: parent product requirement is ${existing.productRequirement.status}. It must be PUBLISHED first.`
      );
    }

    const updated = await tx.subRequirement.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "PUBLISH",
      entityType: "SubRequirement",
      entityId: id,
      requestId: ctx.requestId,
      changes: { status: { from: "DRAFT", to: "PUBLISHED" } },
    });

    return updated;
  });
}

// ─── Obsolete ────────────────────────────────────────────

export async function obsoleteSubRequirement(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subRequirement.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "PUBLISHED") {
      throw new LifecycleError(
        `Cannot obsolete sub-requirement in ${existing.status} status. Only PUBLISHED sub-requirements can be obsoleted.`
      );
    }

    const updated = await tx.subRequirement.update({
      where: { id },
      data: { status: "OBSOLETE" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "OBSOLETE",
      entityType: "SubRequirement",
      entityId: id,
      requestId: ctx.requestId,
      changes: { status: { from: "PUBLISHED", to: "OBSOLETE" } },
    });

    return updated;
  });
}
