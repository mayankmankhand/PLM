/**
 * Seed script for PLM database.
 *
 * Creates demo teams, users, and a full requirement-to-test-case chain
 * so the app has meaningful data to display right away.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { DEMO_TEAMS, DEMO_USERS } from "../src/lib/demo-users";

const prisma = new PrismaClient();

// ── IDs from the shared demo-users module (single source of truth) ──

const TEAM_PLATFORM_ID = DEMO_TEAMS[0].id;
const TEAM_QA_ID = DEMO_TEAMS[1].id;

const ALICE_ID = DEMO_USERS[0].id;
const BOB_ID = DEMO_USERS[1].id;
const CAROL_ID = DEMO_USERS[2].id;

// ── Deterministic IDs for seed entities ─────────────────────

const PRODUCT_REQ_ID = "c0000000-0001-4000-8000-000000000001";
const SUB_REQ_1_ID = "d0000000-0001-4000-8000-000000000001";
const SUB_REQ_2_ID = "d0000000-0002-4000-8000-000000000002";
const TEST_PROC_ID = "e0000000-0001-4000-8000-000000000001";
const TEST_PROC_V1_ID = "f0000000-0001-4000-8000-000000000001";
const TEST_PROC_V2_ID = "f0000000-0002-4000-8000-000000000002";
const TEST_CASE_1_ID = "11000000-0001-4000-8000-000000000001";
const TEST_CASE_2_ID = "11000000-0002-4000-8000-000000000002";

// ── Main seed function ──────────────────────────────────────

async function main() {
  console.log("Seeding PLM database...\n");

  // ── 1. Clean up existing seed data (reverse dependency order) ──

  console.log("Cleaning up old seed data...");

  await prisma.auditLog.deleteMany({
    where: {
      entityId: {
        in: [
          PRODUCT_REQ_ID,
          SUB_REQ_1_ID,
          SUB_REQ_2_ID,
          TEST_PROC_ID,
          TEST_PROC_V1_ID,
          TEST_PROC_V2_ID,
          TEST_CASE_1_ID,
          TEST_CASE_2_ID,
        ],
      },
    },
  });

  await prisma.attachment.deleteMany({
    where: {
      OR: [
        { productRequirementId: PRODUCT_REQ_ID },
        { subRequirementId: { in: [SUB_REQ_1_ID, SUB_REQ_2_ID] } },
        { testProcedureId: TEST_PROC_ID },
        { testCaseId: { in: [TEST_CASE_1_ID, TEST_CASE_2_ID] } },
      ],
    },
  });

  await prisma.testCase.deleteMany({
    where: { id: { in: [TEST_CASE_1_ID, TEST_CASE_2_ID] } },
  });

  await prisma.testProcedureVersion.deleteMany({
    where: { id: { in: [TEST_PROC_V1_ID, TEST_PROC_V2_ID] } },
  });

  await prisma.testProcedure.deleteMany({
    where: { id: TEST_PROC_ID },
  });

  await prisma.subRequirement.deleteMany({
    where: { id: { in: [SUB_REQ_1_ID, SUB_REQ_2_ID] } },
  });

  await prisma.productRequirement.deleteMany({
    where: { id: PRODUCT_REQ_ID },
  });

  console.log("  Done.\n");

  // ── 2. Teams (upsert) ────────────────────────────────────

  console.log("Seeding teams...");

  const platformTeam = await prisma.team.upsert({
    where: { id: TEAM_PLATFORM_ID },
    update: { name: "Platform Team" },
    create: { id: TEAM_PLATFORM_ID, name: "Platform Team" },
  });
  console.log(`  Team: ${platformTeam.name}`);

  const qaTeam = await prisma.team.upsert({
    where: { id: TEAM_QA_ID },
    update: { name: "QA Team" },
    create: { id: TEAM_QA_ID, name: "QA Team" },
  });
  console.log(`  Team: ${qaTeam.name}\n`);

  // ── 3. Users (upsert) ────────────────────────────────────

  console.log("Seeding users...");

  const alice = await prisma.user.upsert({
    where: { id: ALICE_ID },
    update: { name: "Alice Chen", email: "alice@example.com", role: "pm", teamId: TEAM_PLATFORM_ID },
    create: { id: ALICE_ID, name: "Alice Chen", email: "alice@example.com", role: "pm", teamId: TEAM_PLATFORM_ID },
  });
  console.log(`  User: ${alice.name} (${alice.role})`);

  const bob = await prisma.user.upsert({
    where: { id: BOB_ID },
    update: { name: "Bob Smith", email: "bob@example.com", role: "engineer", teamId: TEAM_PLATFORM_ID },
    create: { id: BOB_ID, name: "Bob Smith", email: "bob@example.com", role: "engineer", teamId: TEAM_PLATFORM_ID },
  });
  console.log(`  User: ${bob.name} (${bob.role})`);

  const carol = await prisma.user.upsert({
    where: { id: CAROL_ID },
    update: { name: "Carol Davis", email: "carol@example.com", role: "qa_lead", teamId: TEAM_QA_ID },
    create: { id: CAROL_ID, name: "Carol Davis", email: "carol@example.com", role: "qa_lead", teamId: TEAM_QA_ID },
  });
  console.log(`  User: ${carol.name} (${carol.role})\n`);

  // ── 4. Product Requirement (org-wide, PUBLISHED) ─────────

  console.log("Seeding product requirement...");

  const productReq = await prisma.productRequirement.create({
    data: {
      id: PRODUCT_REQ_ID,
      title: "User Authentication System",
      description:
        "The platform must support secure user authentication including " +
        "login, logout, session management, and password reset flows. " +
        "Must comply with OWASP authentication guidelines.",
      status: "PUBLISHED",
      createdBy: ALICE_ID,
    },
  });
  console.log(`  ProductRequirement: ${productReq.title} [${productReq.status}]\n`);

  // ── 5. Sub-Requirements (2, assigned to different teams) ──

  console.log("Seeding sub-requirements...");

  const subReq1 = await prisma.subRequirement.create({
    data: {
      id: SUB_REQ_1_ID,
      title: "Login and session management",
      description:
        "Implement email/password login with JWT-based sessions. " +
        "Sessions expire after 24 hours of inactivity.",
      status: "PUBLISHED",
      productRequirementId: PRODUCT_REQ_ID,
      teamId: TEAM_PLATFORM_ID,
      createdBy: ALICE_ID,
    },
  });
  console.log(`  SubRequirement: ${subReq1.title} [${subReq1.status}] -> Platform Team`);

  const subReq2 = await prisma.subRequirement.create({
    data: {
      id: SUB_REQ_2_ID,
      title: "Password reset flow",
      description:
        "Users can request a password reset via email. " +
        "Reset tokens expire after 1 hour. Rate-limited to 3 requests per hour.",
      status: "DRAFT",
      productRequirementId: PRODUCT_REQ_ID,
      teamId: TEAM_QA_ID,
      createdBy: ALICE_ID,
    },
  });
  console.log(`  SubRequirement: ${subReq2.title} [${subReq2.status}] -> QA Team\n`);

  // ── 6. Test Procedure (linked to published sub-req) ───────

  console.log("Seeding test procedure...");

  const testProc = await prisma.testProcedure.create({
    data: {
      id: TEST_PROC_ID,
      title: "Login Flow Verification",
      status: "ACTIVE",
      subRequirementId: SUB_REQ_1_ID,
      createdBy: CAROL_ID,
    },
  });
  console.log(`  TestProcedure: ${testProc.title} [${testProc.status}]\n`);

  // ── 7. Test Procedure Versions (v1 PUBLISHED, v2 DRAFT) ───

  console.log("Seeding test procedure versions...");

  const v1 = await prisma.testProcedureVersion.create({
    data: {
      id: TEST_PROC_V1_ID,
      versionNumber: 1,
      description: "Initial login test procedure covering happy path and basic error cases.",
      steps:
        "1. Navigate to /login\n" +
        "2. Enter valid email and password\n" +
        "3. Click Submit\n" +
        "4. Verify redirect to /dashboard\n" +
        "5. Verify session cookie is set\n" +
        "6. Verify user info appears in header",
      status: "PUBLISHED",
      testProcedureId: TEST_PROC_ID,
      createdBy: CAROL_ID,
    },
  });
  console.log(`  Version ${v1.versionNumber}: ${v1.description.slice(0, 50)}... [${v1.status}]`);

  const v2 = await prisma.testProcedureVersion.create({
    data: {
      id: TEST_PROC_V2_ID,
      versionNumber: 2,
      description: "Updated procedure adding MFA verification step.",
      steps:
        "1. Navigate to /login\n" +
        "2. Enter valid email and password\n" +
        "3. Click Submit\n" +
        "4. Enter MFA code from authenticator app\n" +
        "5. Verify redirect to /dashboard\n" +
        "6. Verify session cookie is set\n" +
        "7. Verify user info appears in header",
      status: "DRAFT",
      testProcedureId: TEST_PROC_ID,
      createdBy: CAROL_ID,
    },
  });
  console.log(`  Version ${v2.versionNumber}: ${v2.description.slice(0, 50)}... [${v2.status}]\n`);

  // ── 8. Test Cases (linked to v1: 1 PASSED, 1 PENDING) ────

  console.log("Seeding test cases...");

  const tc1 = await prisma.testCase.create({
    data: {
      id: TEST_CASE_1_ID,
      title: "Successful login with valid credentials",
      description:
        "Verify that a user with correct email and password can log in " +
        "and is redirected to the dashboard.",
      status: "PASSED",
      result: "PASS",
      notes: "All assertions passed. Session cookie verified.",
      testProcedureVersionId: TEST_PROC_V1_ID,
      executedBy: BOB_ID,
      executedAt: new Date("2026-03-05T14:30:00Z"),
      createdBy: CAROL_ID,
    },
  });
  console.log(`  TestCase: ${tc1.title} [${tc1.status}]`);

  const tc2 = await prisma.testCase.create({
    data: {
      id: TEST_CASE_2_ID,
      title: "Login fails with incorrect password",
      description:
        "Verify that entering a wrong password shows an error message " +
        "and does not create a session.",
      status: "PENDING",
      testProcedureVersionId: TEST_PROC_V1_ID,
      createdBy: CAROL_ID,
    },
  });
  console.log(`  TestCase: ${tc2.title} [${tc2.status}]\n`);

  // ── 9. Audit Logs ────────────────────────────────────────

  console.log("Seeding audit logs...");

  const auditEntries = [
    // Product Requirement: CREATE then PUBLISH
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PRODUCT_REQ_ID,
      changes: { title: "User Authentication System", status: "DRAFT" },
      createdAt: new Date("2026-03-01T09:00:00Z"),
    },
    {
      actorId: ALICE_ID,
      action: "PUBLISH" as const,
      entityType: "ProductRequirement",
      entityId: PRODUCT_REQ_ID,
      changes: { status: { from: "DRAFT", to: "PUBLISHED" } },
      createdAt: new Date("2026-03-01T10:00:00Z"),
    },
    // Sub-Requirement 1: CREATE then PUBLISH
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SUB_REQ_1_ID,
      changes: { title: "Login and session management", status: "DRAFT" },
      createdAt: new Date("2026-03-02T09:00:00Z"),
    },
    {
      actorId: ALICE_ID,
      action: "PUBLISH" as const,
      entityType: "SubRequirement",
      entityId: SUB_REQ_1_ID,
      changes: { status: { from: "DRAFT", to: "PUBLISHED" } },
      createdAt: new Date("2026-03-02T10:00:00Z"),
    },
    // Sub-Requirement 2: CREATE only (still DRAFT)
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SUB_REQ_2_ID,
      changes: { title: "Password reset flow", status: "DRAFT" },
      createdAt: new Date("2026-03-02T11:00:00Z"),
    },
    // Test Procedure: CREATE
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TEST_PROC_ID,
      changes: { title: "Login Flow Verification" },
      createdAt: new Date("2026-03-03T09:00:00Z"),
    },
    // Test Procedure Version 1: CREATE then PUBLISH
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TEST_PROC_V1_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: new Date("2026-03-03T10:00:00Z"),
    },
    {
      actorId: CAROL_ID,
      action: "PUBLISH" as const,
      entityType: "TestProcedureVersion",
      entityId: TEST_PROC_V1_ID,
      changes: { status: { from: "DRAFT", to: "PUBLISHED" } },
      createdAt: new Date("2026-03-03T11:00:00Z"),
    },
    // Test Procedure Version 2: CREATE only (still DRAFT)
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TEST_PROC_V2_ID,
      changes: { versionNumber: 2, status: "DRAFT" },
      createdAt: new Date("2026-03-04T09:00:00Z"),
    },
    // Test Cases: CREATE
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TEST_CASE_1_ID,
      changes: { title: "Successful login with valid credentials" },
      createdAt: new Date("2026-03-05T09:00:00Z"),
    },
    {
      actorId: BOB_ID,
      action: "RECORD_RESULT" as const,
      entityType: "TestCase",
      entityId: TEST_CASE_1_ID,
      changes: { status: { from: "PENDING", to: "PASSED" }, result: "PASS" },
      createdAt: new Date("2026-03-05T14:30:00Z"),
    },
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TEST_CASE_2_ID,
      changes: { title: "Login fails with incorrect password" },
      createdAt: new Date("2026-03-05T15:00:00Z"),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }
  console.log(`  Created ${auditEntries.length} audit log entries.\n`);

  // ── Done ──────────────────────────────────────────────────

  console.log("Seed complete!");
  console.log("  2 teams, 3 users");
  console.log("  1 product requirement (PUBLISHED)");
  console.log("  2 sub-requirements (1 PUBLISHED, 1 DRAFT)");
  console.log("  1 test procedure (ACTIVE)");
  console.log("  2 procedure versions (v1 PUBLISHED, v2 DRAFT)");
  console.log("  2 test cases (1 PASSED, 1 PENDING)");
  console.log(`  ${auditEntries.length} audit log entries`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
