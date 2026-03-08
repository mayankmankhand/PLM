// Product Requirement service - domain commands with lifecycle enforcement.
// Every mutation runs inside a Prisma interactive transaction with an audit log entry.

import { prisma } from "@/lib/prisma";
import { RequestContext } from "@/lib/request-context";
import { LifecycleError } from "@/lib/errors";
import { writeAuditLog } from "./audit.service";
import type {
  CreateProductRequirementInput,
  UpdateProductRequirementInput,
} from "@/schemas/product-requirement.schema";

// ─── Create ──────────────────────────────────────────────

export async function createProductRequirement(
  input: CreateProductRequirementInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const requirement = await tx.productRequirement.create({
      data: {
        title: input.title,
        description: input.description,
        createdBy: ctx.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "CREATE",
      entityType: "ProductRequirement",
      entityId: requirement.id,
      requestId: ctx.requestId,
      changes: { title: input.title, description: input.description },
    });

    return requirement;
  });
}

// ─── Update (draft only) ─────────────────────────────────

export async function updateProductRequirement(
  id: string,
  input: UpdateProductRequirementInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.productRequirement.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "DRAFT") {
      throw new LifecycleError(
        `Cannot update product requirement in ${existing.status} status. Only DRAFT requirements can be edited.`
      );
    }

    const changes: Record<string, unknown> = {};
    if (input.title !== undefined) changes.title = { from: existing.title, to: input.title };
    if (input.description !== undefined) changes.description = { from: existing.description, to: input.description };

    const updated = await tx.productRequirement.update({
      where: { id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "UPDATE",
      entityType: "ProductRequirement",
      entityId: id,
      requestId: ctx.requestId,
      changes,
    });

    return updated;
  });
}

// ─── Publish ─────────────────────────────────────────────

export async function publishProductRequirement(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.productRequirement.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "DRAFT") {
      throw new LifecycleError(
        `Cannot publish product requirement in ${existing.status} status. Only DRAFT requirements can be published.`
      );
    }

    const updated = await tx.productRequirement.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "PUBLISH",
      entityType: "ProductRequirement",
      entityId: id,
      requestId: ctx.requestId,
      changes: { status: { from: "DRAFT", to: "PUBLISHED" } },
    });

    return updated;
  });
}

// ─── Obsolete ────────────────────────────────────────────

export async function obsoleteProductRequirement(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.productRequirement.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status !== "PUBLISHED") {
      throw new LifecycleError(
        `Cannot obsolete product requirement in ${existing.status} status. Only PUBLISHED requirements can be obsoleted.`
      );
    }

    const updated = await tx.productRequirement.update({
      where: { id },
      data: { status: "OBSOLETE" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "OBSOLETE",
      entityType: "ProductRequirement",
      entityId: id,
      requestId: ctx.requestId,
      changes: { status: { from: "PUBLISHED", to: "OBSOLETE" } },
    });

    return updated;
  });
}
