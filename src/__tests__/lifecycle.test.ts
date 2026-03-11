// Lifecycle rule unit tests for all services.
// Tests run against the real Neon database using the DATABASE_URL from .env.
// Each test uses a transaction that gets rolled back to keep the DB clean.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { writeAuditLog } from "@/services/audit.service";
import * as prService from "@/services/product-requirement.service";
import * as srService from "@/services/sub-requirement.service";
import * as tpService from "@/services/test-procedure.service";
import * as tcService from "@/services/test-case.service";
import { DEMO_TEAMS, DEMO_USERS } from "@/lib/demo-users";
import type { RequestContext } from "@/lib/request-context";

// We need the seed data in the DB for FK constraints.
// The beforeAll block seeds teams and users if they don't exist.
const prisma = new PrismaClient();

const ctx: RequestContext = {
  userId: DEMO_USERS[0].id,
  teamId: DEMO_TEAMS[0].id,
  role: "pm",
  requestId: "test-request-id",
};

beforeAll(async () => {
  // Upsert teams and users so FK constraints are satisfied
  for (const team of DEMO_TEAMS) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: {},
      create: { id: team.id, name: team.name },
    });
  }
  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
      },
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ─── Product Requirement Lifecycle ───────────────────────

describe("ProductRequirement lifecycle", () => {
  it("creates a draft requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "Test PR", description: "Desc" },
      ctx
    );
    expect(req.status).toBe("DRAFT");
    expect(req.title).toBe("Test PR");

    // Cleanup
    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });

  it("allows updating a draft requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "Original", description: "Desc" },
      ctx
    );
    const updated = await prService.updateProductRequirement(
      req.id,
      { title: "Updated" },
      ctx
    );
    expect(updated.title).toBe("Updated");

    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });

  it("approves a draft requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "Approve Test", description: "Desc" },
      ctx
    );
    const approved = await prService.approveProductRequirement(req.id, ctx);
    expect(approved.status).toBe("APPROVED");

    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });

  it("rejects updating an approved requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "No Edit", description: "Desc" },
      ctx
    );
    await prService.approveProductRequirement(req.id, ctx);

    await expect(
      prService.updateProductRequirement(req.id, { title: "Nope" }, ctx)
    ).rejects.toThrow("Only DRAFT");

    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });

  it("rejects approving an already approved requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "Double Approve", description: "Desc" },
      ctx
    );
    await prService.approveProductRequirement(req.id, ctx);

    await expect(
      prService.approveProductRequirement(req.id, ctx)
    ).rejects.toThrow("Only DRAFT");

    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });

  it("cancels an approved requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "Cancel Test", description: "Desc" },
      ctx
    );
    await prService.approveProductRequirement(req.id, ctx);
    const canceled = await prService.cancelProductRequirement(req.id, ctx);
    expect(canceled.status).toBe("CANCELED");

    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });

  it("rejects canceling a draft requirement", async () => {
    const req = await prService.createProductRequirement(
      { title: "Draft Cancel", description: "Desc" },
      ctx
    );

    await expect(
      prService.cancelProductRequirement(req.id, ctx)
    ).rejects.toThrow("Only APPROVED");

    await prisma.auditLog.deleteMany({ where: { entityId: req.id } });
    await prisma.productRequirement.delete({ where: { id: req.id } });
  });
});

// ─── Sub-Requirement Lifecycle ───────────────────────────

describe("SubRequirement lifecycle", () => {
  let parentId: string;

  beforeAll(async () => {
    const parent = await prService.createProductRequirement(
      { title: "Parent PR", description: "For sub-req tests" },
      ctx
    );
    await prService.approveProductRequirement(parent.id, ctx);
    parentId = parent.id;
  });

  afterAll(async () => {
    // Clean up sub-requirements, audit logs, and parent
    const subReqs = await prisma.subRequirement.findMany({
      where: { productRequirementId: parentId },
    });
    for (const sr of subReqs) {
      await prisma.auditLog.deleteMany({ where: { entityId: sr.id } });
      await prisma.subRequirement.delete({ where: { id: sr.id } });
    }
    await prisma.auditLog.deleteMany({ where: { entityId: parentId } });
    await prisma.productRequirement.delete({ where: { id: parentId } });
  });

  it("creates a draft sub-requirement", async () => {
    const sr = await srService.createSubRequirement(
      {
        title: "Sub Test",
        description: "Desc",
        productRequirementId: parentId,
        teamId: DEMO_TEAMS[0].id,
      },
      ctx
    );
    expect(sr.status).toBe("DRAFT");
  });

  it("approves a sub-requirement when parent is approved", async () => {
    const sr = await srService.createSubRequirement(
      {
        title: "Approve Sub",
        description: "Desc",
        productRequirementId: parentId,
        teamId: DEMO_TEAMS[0].id,
      },
      ctx
    );
    const approved = await srService.approveSubRequirement(sr.id, ctx);
    expect(approved.status).toBe("APPROVED");
  });

  it("rejects approving when parent is not approved", async () => {
    // Create a draft parent
    const draftParent = await prService.createProductRequirement(
      { title: "Draft Parent", description: "Not approved" },
      ctx
    );

    const sr = await srService.createSubRequirement(
      {
        title: "Bad Approve",
        description: "Desc",
        productRequirementId: draftParent.id,
        teamId: DEMO_TEAMS[0].id,
      },
      ctx
    );

    await expect(
      srService.approveSubRequirement(sr.id, ctx)
    ).rejects.toThrow("parent product requirement");

    // Cleanup
    await prisma.auditLog.deleteMany({ where: { entityId: sr.id } });
    await prisma.subRequirement.delete({ where: { id: sr.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: draftParent.id } });
    await prisma.productRequirement.delete({ where: { id: draftParent.id } });
  });
});

// ─── Test Procedure Lifecycle ────────────────────────────

describe("TestProcedure lifecycle", () => {
  let subReqId: string;
  let parentId: string;

  beforeAll(async () => {
    const parent = await prService.createProductRequirement(
      { title: "TP Parent", description: "For procedure tests" },
      ctx
    );
    await prService.approveProductRequirement(parent.id, ctx);
    parentId = parent.id;

    const sr = await srService.createSubRequirement(
      {
        title: "TP Sub",
        description: "Desc",
        productRequirementId: parent.id,
        teamId: DEMO_TEAMS[0].id,
      },
      ctx
    );
    subReqId = sr.id;
  });

  afterAll(async () => {
    // Clean up all test data in reverse dependency order
    const procedures = await prisma.testProcedure.findMany({
      where: { subRequirementId: subReqId },
      include: { versions: { include: { testCases: true } } },
    });
    for (const proc of procedures) {
      for (const ver of proc.versions) {
        for (const tc of ver.testCases) {
          await prisma.auditLog.deleteMany({ where: { entityId: tc.id } });
          await prisma.testCase.delete({ where: { id: tc.id } });
        }
        await prisma.auditLog.deleteMany({ where: { entityId: ver.id } });
        await prisma.testProcedureVersion.delete({ where: { id: ver.id } });
      }
      await prisma.auditLog.deleteMany({ where: { entityId: proc.id } });
      await prisma.testProcedure.delete({ where: { id: proc.id } });
    }
    await prisma.auditLog.deleteMany({ where: { entityId: subReqId } });
    await prisma.subRequirement.delete({ where: { id: subReqId } });
    await prisma.auditLog.deleteMany({ where: { entityId: parentId } });
    await prisma.productRequirement.delete({ where: { id: parentId } });
  });

  it("creates a procedure with draft v1", async () => {
    const result = await tpService.createTestProcedure(
      {
        title: "Proc 1",
        subRequirementId: subReqId,
        description: "Procedure description",
        steps: "Step 1\nStep 2",
      },
      ctx
    );
    expect(result.status).toBe("ACTIVE");
    expect(result.versions).toHaveLength(1);
    expect(result.versions[0].versionNumber).toBe(1);
    expect(result.versions[0].status).toBe("DRAFT");
  });

  it("approves a draft version", async () => {
    const proc = await tpService.createTestProcedure(
      {
        title: "Proc Approve",
        subRequirementId: subReqId,
        description: "Desc",
        steps: "Steps",
      },
      ctx
    );
    const approved = await tpService.approveTestProcedureVersion(
      proc.versions[0].id,
      ctx
    );
    expect(approved.status).toBe("APPROVED");
  });

  it("rejects creating a second draft when one exists", async () => {
    const proc = await tpService.createTestProcedure(
      {
        title: "Single Draft",
        subRequirementId: subReqId,
        description: "Desc",
        steps: "Steps",
      },
      ctx
    );

    // v1 is already a draft, so creating v2 should fail
    await expect(
      tpService.createTestProcedureVersion(
        proc.id,
        { description: "V2", steps: "New steps" },
        ctx
      )
    ).rejects.toThrow("already has a draft version");
  });

  it("allows creating v2 after approving v1", async () => {
    const proc = await tpService.createTestProcedure(
      {
        title: "Multi Version",
        subRequirementId: subReqId,
        description: "V1 desc",
        steps: "V1 steps",
      },
      ctx
    );
    await tpService.approveTestProcedureVersion(proc.versions[0].id, ctx);

    const v2 = await tpService.createTestProcedureVersion(
      proc.id,
      { description: "V2 desc", steps: "V2 steps" },
      ctx
    );
    expect(v2.versionNumber).toBe(2);
    expect(v2.status).toBe("DRAFT");
  });

  it("rejects updating an approved version", async () => {
    const proc = await tpService.createTestProcedure(
      {
        title: "No Edit Approved",
        subRequirementId: subReqId,
        description: "Desc",
        steps: "Steps",
      },
      ctx
    );
    await tpService.approveTestProcedureVersion(proc.versions[0].id, ctx);

    await expect(
      tpService.updateTestProcedureVersion(
        proc.versions[0].id,
        { description: "Nope" },
        ctx
      )
    ).rejects.toThrow("Only DRAFT");
  });
});

// ─── Test Case Lifecycle ─────────────────────────────────

describe("TestCase lifecycle", () => {
  let approvedVersionId: string;
  let draftVersionId: string;
  let cleanupIds: { parentId: string; subReqId: string; procId: string };

  beforeAll(async () => {
    const parent = await prService.createProductRequirement(
      { title: "TC Parent", description: "For test case tests" },
      ctx
    );
    await prService.approveProductRequirement(parent.id, ctx);

    const sr = await srService.createSubRequirement(
      {
        title: "TC Sub",
        description: "Desc",
        productRequirementId: parent.id,
        teamId: DEMO_TEAMS[0].id,
      },
      ctx
    );

    const proc = await tpService.createTestProcedure(
      {
        title: "TC Proc",
        subRequirementId: sr.id,
        description: "Desc",
        steps: "Steps",
      },
      ctx
    );
    draftVersionId = proc.versions[0].id;

    await tpService.approveTestProcedureVersion(proc.versions[0].id, ctx);
    approvedVersionId = proc.versions[0].id;

    // Create a new draft version for testing draft-version restrictions
    const v2 = await tpService.createTestProcedureVersion(
      proc.id,
      { description: "Draft v2", steps: "V2 steps" },
      ctx
    );
    draftVersionId = v2.id;

    cleanupIds = { parentId: parent.id, subReqId: sr.id, procId: proc.id };
  });

  afterAll(async () => {
    // Clean up everything
    const versions = await prisma.testProcedureVersion.findMany({
      where: { testProcedureId: cleanupIds.procId },
      include: { testCases: true },
    });
    for (const ver of versions) {
      for (const tc of ver.testCases) {
        await prisma.auditLog.deleteMany({ where: { entityId: tc.id } });
        await prisma.testCase.delete({ where: { id: tc.id } });
      }
      await prisma.auditLog.deleteMany({ where: { entityId: ver.id } });
      await prisma.testProcedureVersion.delete({ where: { id: ver.id } });
    }
    await prisma.auditLog.deleteMany({ where: { entityId: cleanupIds.procId } });
    await prisma.testProcedure.delete({ where: { id: cleanupIds.procId } });
    await prisma.auditLog.deleteMany({ where: { entityId: cleanupIds.subReqId } });
    await prisma.subRequirement.delete({ where: { id: cleanupIds.subReqId } });
    await prisma.auditLog.deleteMany({ where: { entityId: cleanupIds.parentId } });
    await prisma.productRequirement.delete({ where: { id: cleanupIds.parentId } });
  });

  it("creates a test case", async () => {
    const tc = await tcService.createTestCase(
      {
        title: "TC 1",
        description: "Test case desc",
        testProcedureVersionId: approvedVersionId,
      },
      ctx
    );
    expect(tc.status).toBe("PENDING");
  });

  it("records a PASS result on an approved version", async () => {
    const tc = await tcService.createTestCase(
      {
        title: "Pass Test",
        description: "Desc",
        testProcedureVersionId: approvedVersionId,
      },
      ctx
    );
    const result = await tcService.recordTestResult(
      tc.id,
      { result: "PASS" },
      ctx
    );
    expect(result.result).toBe("PASS");
    expect(result.status).toBe("PASSED");
  });

  it("rejects recording result on a draft version's test case", async () => {
    const tc = await tcService.createTestCase(
      {
        title: "Draft TC",
        description: "Desc",
        testProcedureVersionId: draftVersionId,
      },
      ctx
    );

    await expect(
      tcService.recordTestResult(tc.id, { result: "PASS" }, ctx)
    ).rejects.toThrow("must be APPROVED");
  });

  it("skips a test case", async () => {
    const tc = await tcService.createTestCase(
      {
        title: "Skip TC",
        description: "Desc",
        testProcedureVersionId: approvedVersionId,
      },
      ctx
    );
    const skipped = await tcService.skipTestCase(tc.id, ctx);
    expect(skipped.status).toBe("SKIPPED");
  });

  it("rejects recording result on skipped test case", async () => {
    const tc = await tcService.createTestCase(
      {
        title: "No Result After Skip",
        description: "Desc",
        testProcedureVersionId: approvedVersionId,
      },
      ctx
    );
    await tcService.skipTestCase(tc.id, ctx);

    await expect(
      tcService.recordTestResult(tc.id, { result: "PASS" }, ctx)
    ).rejects.toThrow("skipped");
  });
});
