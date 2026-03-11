// Shared Prisma query helpers used by both read tools and UI intent tools.
// Extracts common fetch logic so we don't duplicate queries.
// Each function returns a compact, structured payload.

import { prisma } from "@/lib/prisma";

/**
 * Fetch a product requirement with sub-requirements.
 * Used by getProductRequirement (read tool) and showEntityDetail (UI intent).
 */
export async function fetchProductRequirement(id: string) {
  return prisma.productRequirement.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      createdBy: true,
      subRequirements: {
        select: {
          id: true,
          title: true,
          status: true,
          teamId: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Fetch a sub-requirement with parent and test procedures.
 */
export async function fetchSubRequirement(id: string) {
  return prisma.subRequirement.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
      productRequirementId: true,
      teamId: true,
      productRequirement: {
        select: { id: true, title: true, status: true },
      },
      team: {
        select: { id: true, name: true },
      },
      testProcedures: {
        select: {
          id: true,
          title: true,
          status: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Fetch a test procedure with version history.
 */
export async function fetchTestProcedure(id: string) {
  return prisma.testProcedure.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      subRequirementId: true,
      createdAt: true,
      subRequirement: {
        select: { id: true, title: true, status: true },
      },
      versions: {
        select: {
          id: true,
          versionNumber: true,
          description: true,
          status: true,
          createdAt: true,
        },
        orderBy: { versionNumber: "desc" },
        take: 10,
      },
    },
  });
}

/**
 * Fetch a test procedure version with test cases.
 */
export async function fetchTestProcedureVersion(id: string) {
  return prisma.testProcedureVersion.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      versionNumber: true,
      description: true,
      steps: true,
      status: true,
      createdAt: true,
      testProcedure: {
        select: { id: true, title: true },
      },
      testCases: {
        select: {
          id: true,
          title: true,
          status: true,
          result: true,
        },
        take: 15,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

/**
 * Fetch a test case with parent version info.
 */
export async function fetchTestCase(id: string) {
  return prisma.testCase.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      result: true,
      notes: true,
      executedBy: true,
      executedAt: true,
      testProcedureVersionId: true,
      testProcedureVersion: {
        select: {
          id: true,
          versionNumber: true,
          status: true,
          testProcedure: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });
}
