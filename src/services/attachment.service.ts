// Attachment service - stubbed file upload.
// Parses multipart data, discards the binary, stores metadata + placeholder URL.
// Real storage (Vercel Blob) will be added later.

import { prisma, ACTIVE_ATTACHMENT_FILTER } from "@/lib/prisma";
import { RequestContext } from "@/lib/request-context";
import { writeAuditLog } from "./audit.service";
import type { CreateAttachmentInput } from "@/schemas/attachment.schema";

// ─── Add attachment (stubbed storage) ────────────────────

export async function addAttachment(
  input: CreateAttachmentInput,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    // Verify the parent entity exists
    if (input.productRequirementId) {
      await tx.productRequirement.findUniqueOrThrow({ where: { id: input.productRequirementId } });
    }
    if (input.subRequirementId) {
      await tx.subRequirement.findUniqueOrThrow({ where: { id: input.subRequirementId } });
    }
    if (input.testProcedureId) {
      await tx.testProcedure.findUniqueOrThrow({ where: { id: input.testProcedureId } });
    }
    if (input.testCaseId) {
      await tx.testCase.findUniqueOrThrow({ where: { id: input.testCaseId } });
    }

    // Stubbed: generate a placeholder URL instead of uploading to blob storage
    const placeholderUrl = `https://placeholder.storage/uploads/${Date.now()}-${input.fileName}`;

    const attachment = await tx.attachment.create({
      data: {
        fileName: input.fileName,
        fileUrl: placeholderUrl,
        fileType: input.fileType,
        productRequirementId: input.productRequirementId ?? null,
        subRequirementId: input.subRequirementId ?? null,
        testProcedureId: input.testProcedureId ?? null,
        testCaseId: input.testCaseId ?? null,
        uploadedBy: ctx.userId,
      },
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "ADD_ATTACHMENT",
      entityType: "Attachment",
      entityId: attachment.id,
      requestId: ctx.requestId,
      changes: {
        fileName: input.fileName,
        fileType: input.fileType,
        parentEntity: input.productRequirementId
          ? "ProductRequirement"
          : input.subRequirementId
            ? "SubRequirement"
            : input.testProcedureId
              ? "TestProcedure"
              : "TestCase",
      },
    });

    return attachment;
  });
}

// ─── Remove attachment ───────────────────────────────────

export async function removeAttachment(
  id: string,
  ctx: RequestContext
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.attachment.findUniqueOrThrow({
      where: { id, ...ACTIVE_ATTACHMENT_FILTER },
    });

    // Soft-delete: mark as REMOVED instead of hard-deleting.
    // TODO: When real blob storage is added, schedule file deletion
    // for REMOVED attachments (e.g. background cleanup job).
    await tx.attachment.update({ where: { id }, data: { status: "REMOVED" } });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      action: "REMOVE_ATTACHMENT",
      entityType: "Attachment",
      entityId: id,
      requestId: ctx.requestId,
      changes: {
        fileName: existing.fileName,
        fileType: existing.fileType,
      },
    });

    return existing;
  });
}
