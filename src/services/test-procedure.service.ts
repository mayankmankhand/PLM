// Test Procedure service - two-entity versioning with lifecycle rules.
// Creating a procedure also creates a draft v1 version.
// Only one draft version is allowed per procedure (enforced here, not in DB).

import { prisma } from "@/lib/prisma";
import { RequestContext } from "@/lib/request-context";
import { LifecycleError } from "@/lib/errors";
import { writeAuditLog } from "./audit.service";
import type {
  CreateTestProcedureInput,
  CreateTestProcedureVersionInput,
  UpdateTestProcedureVersionInput,
} from "@/schemas/test-procedure.schema";

// ─── Create (logical procedure + draft v1) ───────────────

export async function createTestProcedure(
  input: CreateTestProcedureInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    // Verify parent sub-requirement exists
    await tx.subRequirement.findUniqueOrThrow({
      where: { id: input.subRequirementId },
    });

    const procedure = await tx.testProcedure.create({
      data: {
        title: input.title,
        subRequirementId: input.subRequirementId,
        createdBy: ctx.userId,
      },
    });

    // Auto-create draft v1.
    // Note: this v1 creation is bundled into the TestProcedure CREATE audit event
    // (not a separate CREATE_VERSION event). CREATE_VERSION is only used for v2+.
    const version = await tx.testProcedureVersion.create({
      data: {
        testProcedureId: procedure.id,
        versionNumber: 1,
        description: input.description,
        steps: input.steps,
        status: "DRAFT",
        createdBy: ctx.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "CREATE",
      entityType: "TestProcedure",
      entityId: procedure.id,
      requestId: ctx.requestId,
      changes: {
        title: input.title,
        subRequirementId: input.subRequirementId,
        initialVersion: { versionNumber: 1, description: input.description },
      },
    });

    return { ...procedure, versions: [version] };
  });
}

// ─── Create new version (enforce one draft per procedure) ─

export async function createTestProcedureVersion(
  procedureId: string,
  input: CreateTestProcedureVersionInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const procedure = await tx.testProcedure.findUniqueOrThrow({
      where: { id: procedureId },
      include: { versions: { orderBy: { versionNumber: "desc" } } },
    });

    if (procedure.status === "OBSOLETE") {
      throw new LifecycleError("Cannot create a version for an obsolete procedure.");
    }

    // Enforce single-draft rule
    const existingDraft = procedure.versions.find((v) => v.status === "DRAFT");
    if (existingDraft) {
      throw new LifecycleError(
        `Procedure already has a draft version (v${existingDraft.versionNumber}). Publish or discard it first.`
      );
    }

    const nextVersion = (procedure.versions[0]?.versionNumber ?? 0) + 1;

    const version = await tx.testProcedureVersion.create({
      data: {
        testProcedureId: procedureId,
        versionNumber: nextVersion,
        description: input.description,
        steps: input.steps,
        status: "DRAFT",
        createdBy: ctx.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "CREATE_VERSION",
      entityType: "TestProcedureVersion",
      entityId: version.id,
      requestId: ctx.requestId,
      changes: {
        testProcedureId: procedureId,
        versionNumber: nextVersion,
        description: input.description,
      },
    });

    return version;
  });
}

// ─── Update version (draft only) ─────────────────────────

export async function updateTestProcedureVersion(
  versionId: string,
  input: UpdateTestProcedureVersionInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testProcedureVersion.findUniqueOrThrow({
      where: { id: versionId },
    });

    if (existing.status !== "DRAFT") {
      throw new LifecycleError(
        `Cannot update version in ${existing.status} status. Only DRAFT versions can be edited.`
      );
    }

    const changes: Record<string, unknown> = {};
    if (input.description !== undefined) changes.description = { from: existing.description, to: input.description };
    if (input.steps !== undefined) changes.steps = { from: existing.steps, to: input.steps };

    const updated = await tx.testProcedureVersion.update({
      where: { id: versionId },
      data: {
        ...(input.description !== undefined && { description: input.description }),
        ...(input.steps !== undefined && { steps: input.steps }),
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "UPDATE",
      entityType: "TestProcedureVersion",
      entityId: versionId,
      requestId: ctx.requestId,
      changes,
    });

    return updated;
  });
}

// ─── Publish version ─────────────────────────────────────

export async function publishTestProcedureVersion(
  versionId: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testProcedureVersion.findUniqueOrThrow({
      where: { id: versionId },
    });

    if (existing.status !== "DRAFT") {
      throw new LifecycleError(
        `Cannot publish version in ${existing.status} status. Only DRAFT versions can be published.`
      );
    }

    const updated = await tx.testProcedureVersion.update({
      where: { id: versionId },
      data: { status: "PUBLISHED" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "PUBLISH",
      entityType: "TestProcedureVersion",
      entityId: versionId,
      requestId: ctx.requestId,
      changes: { status: { from: "DRAFT", to: "PUBLISHED" } },
    });

    return updated;
  });
}

// ─── Obsolete procedure ──────────────────────────────────

export async function obsoleteTestProcedure(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.testProcedure.findUniqueOrThrow({
      where: { id },
    });

    if (existing.status === "OBSOLETE") {
      throw new LifecycleError("Procedure is already obsolete.");
    }

    const updated = await tx.testProcedure.update({
      where: { id },
      data: { status: "OBSOLETE" },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "OBSOLETE",
      entityType: "TestProcedure",
      entityId: id,
      requestId: ctx.requestId,
      changes: { status: { from: existing.status, to: "OBSOLETE" } },
    });

    return updated;
  });
}
