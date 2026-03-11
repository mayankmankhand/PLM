/**
 * Seed script for PLM database.
 *
 * Creates demo teams, users, and a smartwatch product lifecycle dataset
 * with requirements, test procedures, versions, and test cases.
 *
 * Run with: npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { DEMO_TEAMS, DEMO_USERS } from "../src/lib/demo-users";

const prisma = new PrismaClient();

// ── Team IDs from the shared demo-users module ──────────────

const TEAM_ELECTRICAL_ID = DEMO_TEAMS[0].id;
const TEAM_MECHANICAL_ID = DEMO_TEAMS[1].id;
const TEAM_APP_ID = DEMO_TEAMS[2].id;
const TEAM_ALGORITHM_ID = DEMO_TEAMS[3].id;
const TEAM_HARDWARE_ID = DEMO_TEAMS[4].id;
const TEAM_TESTING_ID = DEMO_TEAMS[5].id;

// ── User IDs from the shared demo-users module ──────────────

const ALICE_ID = DEMO_USERS[0].id; // PM - Hardware
const BOB_ID = DEMO_USERS[1].id; // Engineer - Electrical
const CAROL_ID = DEMO_USERS[2].id; // QA Lead - Testing

// ── Deterministic IDs for seed entities ─────────────────────

// Product Requirements (6)
const PR1_ID = "c0000000-0001-4000-8000-000000000001";
const PR2_ID = "c0000000-0002-4000-8000-000000000002";
const PR3_ID = "c0000000-0003-4000-8000-000000000003";
const PR4_ID = "c0000000-0004-4000-8000-000000000004";
const PR5_ID = "c0000000-0005-4000-8000-000000000005";
const PR6_ID = "c0000000-0006-4000-8000-000000000006";

// Sub-Requirements (8)
const SR1_1_ID = "d0000000-0001-4000-8000-000000000001";
const SR1_2_ID = "d0000000-0002-4000-8000-000000000002";
const SR2_1_ID = "d0000000-0003-4000-8000-000000000003";
const SR2_2_ID = "d0000000-0004-4000-8000-000000000004";
const SR3_1_ID = "d0000000-0005-4000-8000-000000000005";
const SR4_1_ID = "d0000000-0006-4000-8000-000000000006";
const SR5_1_ID = "d0000000-0007-4000-8000-000000000007";
const SR6_1_ID = "d0000000-0008-4000-8000-000000000008";

// Test Procedures (8)
const TP1_ID = "e0000000-0001-4000-8000-000000000001";
const TP2_ID = "e0000000-0002-4000-8000-000000000002";
const TP3_ID = "e0000000-0003-4000-8000-000000000003";
const TP4_ID = "e0000000-0004-4000-8000-000000000004";
const TP5_ID = "e0000000-0005-4000-8000-000000000005";
const TP6_ID = "e0000000-0006-4000-8000-000000000006";
const TP7_ID = "e0000000-0007-4000-8000-000000000007";
const TP8_ID = "e0000000-0008-4000-8000-000000000008";

// Test Procedure Versions (8)
const TPV1_ID = "f0000000-0001-4000-8000-000000000001";
const TPV2_ID = "f0000000-0002-4000-8000-000000000002";
const TPV3_ID = "f0000000-0003-4000-8000-000000000003";
const TPV4_ID = "f0000000-0004-4000-8000-000000000004";
const TPV5_ID = "f0000000-0005-4000-8000-000000000005";
const TPV6_ID = "f0000000-0006-4000-8000-000000000006";
const TPV7_ID = "f0000000-0007-4000-8000-000000000007";
const TPV8_ID = "f0000000-0008-4000-8000-000000000008";

// Test Cases (8)
const TC1_ID = "11000000-0001-4000-8000-000000000001";
const TC2_ID = "11000000-0002-4000-8000-000000000002";
const TC3_ID = "11000000-0003-4000-8000-000000000003";
const TC4_ID = "11000000-0004-4000-8000-000000000004";
const TC5_ID = "11000000-0005-4000-8000-000000000005";
const TC6_ID = "11000000-0006-4000-8000-000000000006";
const TC7_ID = "11000000-0007-4000-8000-000000000007";
const TC8_ID = "11000000-0008-4000-8000-000000000008";

// ── All seed entity IDs (for cleanup) ───────────────────────

const ALL_PR_IDS = [PR1_ID, PR2_ID, PR3_ID, PR4_ID, PR5_ID, PR6_ID];
const ALL_SR_IDS = [SR1_1_ID, SR1_2_ID, SR2_1_ID, SR2_2_ID, SR3_1_ID, SR4_1_ID, SR5_1_ID, SR6_1_ID];
const ALL_TP_IDS = [TP1_ID, TP2_ID, TP3_ID, TP4_ID, TP5_ID, TP6_ID, TP7_ID, TP8_ID];
const ALL_TPV_IDS = [TPV1_ID, TPV2_ID, TPV3_ID, TPV4_ID, TPV5_ID, TPV6_ID, TPV7_ID, TPV8_ID];
const ALL_TC_IDS = [TC1_ID, TC2_ID, TC3_ID, TC4_ID, TC5_ID, TC6_ID, TC7_ID, TC8_ID];

// ── Anchor date with offset helper ──────────────────────────

const ANCHOR = new Date("2026-02-01T09:00:00Z");

/** Returns a Date offset from the anchor by days and hours. */
function at(dayOffset: number, hourOffset = 0): Date {
  const d = new Date(ANCHOR);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(d.getUTCHours() + hourOffset);
  return d;
}

// ── Main seed function ──────────────────────────────────────

async function main() {
  console.log("Seeding PLM database...\n");

  // ── 1. Clean up existing seed data (reverse dependency order) ──

  console.log("Cleaning up old seed data...");

  const allEntityIds = [...ALL_PR_IDS, ...ALL_SR_IDS, ...ALL_TP_IDS, ...ALL_TPV_IDS, ...ALL_TC_IDS];

  await prisma.auditLog.deleteMany({
    where: { entityId: { in: allEntityIds } },
  });

  await prisma.attachment.deleteMany({
    where: {
      OR: [
        { productRequirementId: { in: ALL_PR_IDS } },
        { subRequirementId: { in: ALL_SR_IDS } },
        { testProcedureId: { in: ALL_TP_IDS } },
        { testCaseId: { in: ALL_TC_IDS } },
      ],
    },
  });

  await prisma.testCase.deleteMany({
    where: { id: { in: ALL_TC_IDS } },
  });

  await prisma.testProcedureVersion.deleteMany({
    where: { id: { in: ALL_TPV_IDS } },
  });

  await prisma.testProcedure.deleteMany({
    where: { id: { in: ALL_TP_IDS } },
  });

  await prisma.subRequirement.deleteMany({
    where: { id: { in: ALL_SR_IDS } },
  });

  await prisma.productRequirement.deleteMany({
    where: { id: { in: ALL_PR_IDS } },
  });

  console.log("  Done.\n");

  // ── 2. Teams (upsert) ────────────────────────────────────

  console.log("Seeding teams...");

  for (const team of DEMO_TEAMS) {
    const t = await prisma.team.upsert({
      where: { id: team.id },
      update: { name: team.name },
      create: { id: team.id, name: team.name },
    });
    console.log(`  Team: ${t.name}`);
  }
  console.log();

  // ── 3. Users (upsert) ────────────────────────────────────

  console.log("Seeding users...");

  for (const user of DEMO_USERS) {
    const u = await prisma.user.upsert({
      where: { id: user.id },
      update: { name: user.name, email: user.email, role: user.role, teamId: user.teamId },
      create: { id: user.id, name: user.name, email: user.email, role: user.role, teamId: user.teamId },
    });
    console.log(`  User: ${u.name} (${u.role})`);
  }
  console.log();

  // ── 4. Product Requirements (6) ──────────────────────────

  console.log("Seeding product requirements...");

  const prData = [
    {
      id: PR1_ID,
      title: "Continuous Heart Rate Monitoring",
      description:
        "The smartwatch shall continuously measure the user's heart rate using an optical PPG sensor " +
        "and display the value in the health monitoring interface.",
      status: "APPROVED" as const,
      createdBy: ALICE_ID,
    },
    {
      id: PR2_ID,
      title: "Outdoor Activity GPS Tracking",
      description: "The smartwatch shall track outdoor workouts using GPS and store route data.",
      status: "APPROVED" as const,
      createdBy: ALICE_ID,
    },
    {
      id: PR3_ID,
      title: "Smartwatch Battery Life",
      description:
        "The smartwatch shall support at least 24 hours of typical usage on a full charge.",
      status: "APPROVED" as const,
      createdBy: ALICE_ID,
    },
    {
      id: PR4_ID,
      title: "Water Resistance Capability",
      description:
        "The smartwatch shall maintain functionality after exposure to water equivalent to 50 meters depth.",
      status: "APPROVED" as const,
      createdBy: ALICE_ID,
    },
    {
      id: PR5_ID,
      title: "Smartphone Notification Display",
      description:
        "The smartwatch shall display notifications received from a paired smartphone.",
      status: "CANCELED" as const,
      createdBy: ALICE_ID,
    },
    {
      id: PR6_ID,
      title: "System Functional Verification",
      description:
        "All smartwatch subsystems shall be validated through integration testing before release.",
      status: "APPROVED" as const,
      createdBy: ALICE_ID,
    },
  ];

  for (const pr of prData) {
    const created = await prisma.productRequirement.create({ data: pr });
    console.log(`  PR: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 5. Sub-Requirements (8) ──────────────────────────────

  console.log("Seeding sub-requirements...");

  const srData = [
    {
      id: SR1_1_ID,
      title: "Heart Rate Sensor Hardware Integration",
      description:
        "The smartwatch shall integrate an optical heart rate sensor capable of sampling at least once per second.",
      status: "APPROVED" as const,
      productRequirementId: PR1_ID,
      teamId: TEAM_HARDWARE_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR1_2_ID,
      title: "Heart Rate Calculation Algorithm",
      description:
        "The system shall compute heart rate from PPG sensor signals with an accuracy " +
        "within plus/minus 5 BPM under resting conditions.",
      status: "APPROVED" as const,
      productRequirementId: PR1_ID,
      teamId: TEAM_ALGORITHM_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR2_1_ID,
      title: "GPS Hardware Receiver",
      description:
        "The smartwatch shall include a GPS receiver capable of recording location coordinates " +
        "during outdoor activity tracking.",
      status: "APPROVED" as const,
      productRequirementId: PR2_ID,
      teamId: TEAM_ELECTRICAL_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR2_2_ID,
      title: "Workout Route Recording",
      description:
        "The smartwatch shall store GPS coordinates during workouts and display route maps " +
        "in the mobile application.",
      status: "APPROVED" as const,
      productRequirementId: PR2_ID,
      teamId: TEAM_APP_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR3_1_ID,
      title: "Battery Capacity and Power Delivery",
      description:
        "The smartwatch battery system shall provide sufficient capacity to support 24 hours " +
        "of operation under typical usage conditions.",
      status: "APPROVED" as const,
      productRequirementId: PR3_ID,
      teamId: TEAM_ELECTRICAL_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR4_1_ID,
      title: "Waterproof Mechanical Sealing",
      description:
        "The smartwatch enclosure shall be sealed to prevent water ingress during water exposure " +
        "equivalent to 50 meters depth.",
      status: "APPROVED" as const,
      productRequirementId: PR4_ID,
      teamId: TEAM_MECHANICAL_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR5_1_ID,
      title: "Notification Delivery and Display",
      description:
        "The smartwatch shall receive and display notifications from a paired smartphone within 3 seconds.",
      status: "APPROVED" as const,
      productRequirementId: PR5_ID,
      teamId: TEAM_APP_ID,
      createdBy: ALICE_ID,
    },
    {
      id: SR6_1_ID,
      title: "End-to-End System Validation",
      description:
        "The smartwatch shall pass system-level functional validation covering sensors, " +
        "connectivity, battery, and application integration.",
      status: "DRAFT" as const,
      productRequirementId: PR6_ID,
      teamId: TEAM_TESTING_ID,
      createdBy: ALICE_ID,
    },
  ];

  for (const sr of srData) {
    const created = await prisma.subRequirement.create({ data: sr });
    console.log(`  SR: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 6. Test Procedures (8) ───────────────────────────────

  console.log("Seeding test procedures...");

  const tpData = [
    { id: TP1_ID, title: "Sensor Data Availability", subRequirementId: SR1_1_ID },
    { id: TP2_ID, title: "Algorithm Accuracy Validation", subRequirementId: SR1_2_ID },
    { id: TP3_ID, title: "GPS Signal Acquisition", subRequirementId: SR2_1_ID },
    { id: TP4_ID, title: "Route Recording Verification", subRequirementId: SR2_2_ID },
    { id: TP5_ID, title: "Battery Runtime Test", subRequirementId: SR3_1_ID },
    { id: TP6_ID, title: "Water Pressure Test", subRequirementId: SR4_1_ID },
    { id: TP7_ID, title: "Notification Delivery Test", subRequirementId: SR5_1_ID },
    { id: TP8_ID, title: "System Integration Test", subRequirementId: SR6_1_ID },
  ];

  for (const tp of tpData) {
    const created = await prisma.testProcedure.create({
      data: { ...tp, status: "ACTIVE", createdBy: CAROL_ID },
    });
    console.log(`  TP: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 7. Test Procedure Versions (8) ───────────────────────

  console.log("Seeding test procedure versions...");

  const tpvData = [
    {
      id: TPV1_ID,
      versionNumber: 1,
      description: "Verify the sensor provides heart rate data continuously.",
      steps:
        "1. Power on smartwatch.\n" +
        "2. Attach smartwatch to test wrist fixture.\n" +
        "3. Enable heart rate monitoring.\n" +
        "4. Record sensor output for 60 seconds.\n" +
        "5. Verify heart rate samples are generated at least once per second.",
      status: "APPROVED" as const,
      testProcedureId: TP1_ID,
    },
    {
      id: TPV2_ID,
      versionNumber: 1,
      description: "Verify heart rate algorithm accuracy compared with reference device.",
      steps:
        "1. Wear smartwatch on test subject.\n" +
        "2. Measure heart rate using medical reference monitor.\n" +
        "3. Record smartwatch heart rate value.\n" +
        "4. Compare smartwatch value to reference monitor.\n" +
        "5. Verify deviation does not exceed plus/minus 5 BPM.",
      status: "APPROVED" as const,
      testProcedureId: TP2_ID,
    },
    {
      id: TPV3_ID,
      versionNumber: 1,
      description: "Verify the smartwatch acquires GPS signal within acceptable time.",
      steps:
        "1. Power on smartwatch outdoors.\n" +
        "2. Start activity tracking mode.\n" +
        "3. Measure time required to acquire GPS lock.\n" +
        "4. Verify lock occurs within 60 seconds.",
      status: "APPROVED" as const,
      testProcedureId: TP3_ID,
    },
    {
      id: TPV4_ID,
      versionNumber: 1,
      description: "Verify route is correctly recorded during activity.",
      steps:
        "1. Start outdoor running activity.\n" +
        "2. Walk predefined test route.\n" +
        "3. Stop activity recording.\n" +
        "4. Sync activity to mobile application.\n" +
        "5. Verify route map matches actual path.",
      status: "APPROVED" as const,
      testProcedureId: TP4_ID,
    },
    {
      id: TPV5_ID,
      versionNumber: 1,
      description: "Validate battery duration under normal usage.",
      steps:
        "1. Fully charge smartwatch battery.\n" +
        "2. Enable heart rate monitoring.\n" +
        "3. Enable Bluetooth connection.\n" +
        "4. Simulate notification usage.\n" +
        "5. Run GPS workout for 30 minutes.\n" +
        "6. Measure total runtime until battery reaches 5%.",
      status: "APPROVED" as const,
      testProcedureId: TP5_ID,
    },
    {
      id: TPV6_ID,
      versionNumber: 1,
      description: "Verify enclosure prevents water ingress under pressure.",
      steps:
        "1. Place smartwatch in pressure chamber.\n" +
        "2. Apply pressure equivalent to 50 meters water depth.\n" +
        "3. Maintain pressure for 30 minutes.\n" +
        "4. Remove smartwatch from chamber.\n" +
        "5. Inspect device for water ingress.\n" +
        "6. Verify device powers on and functions normally.",
      status: "APPROVED" as const,
      testProcedureId: TP6_ID,
    },
    {
      id: TPV7_ID,
      versionNumber: 1,
      description: "Verify notifications appear on the smartwatch.",
      steps:
        "1. Pair smartwatch with smartphone.\n" +
        "2. Send test message to phone.\n" +
        "3. Observe smartwatch notification display.\n" +
        "4. Measure time between phone receipt and smartwatch display.",
      status: "APPROVED" as const,
      testProcedureId: TP7_ID,
    },
    {
      id: TPV8_ID,
      versionNumber: 1,
      description: "Validate major smartwatch features operate correctly together.",
      steps:
        "1. Power on smartwatch.\n" +
        "2. Pair device with smartphone.\n" +
        "3. Enable heart rate monitoring.\n" +
        "4. Start GPS workout.\n" +
        "5. Send notification to phone.\n" +
        "6. Verify smartwatch receives notification while tracking workout.",
      status: "DRAFT" as const,
      testProcedureId: TP8_ID,
    },
  ];

  for (const tpv of tpvData) {
    const created = await prisma.testProcedureVersion.create({
      data: { ...tpv, createdBy: CAROL_ID },
    });
    console.log(`  TPV: v${created.versionNumber} for TP ${tpv.testProcedureId.slice(-1)} [${created.status}]`);
  }
  console.log();

  // ── 8. Test Cases (8) ────────────────────────────────────

  console.log("Seeding test cases...");

  const tcData = [
    {
      id: TC1_ID,
      title: "Heart rate samples generated continuously",
      description: "Verify heart rate sensor produces samples at the required rate.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV1_ID,
      createdBy: CAROL_ID,
    },
    {
      id: TC2_ID,
      title: "Heart rate accuracy within tolerance",
      description: "Verify computed heart rate matches reference device within plus/minus 5 BPM.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV2_ID,
      createdBy: CAROL_ID,
    },
    {
      id: TC3_ID,
      title: "GPS lock acquired within expected time",
      description: "Verify GPS signal acquisition completes within 60 seconds.",
      status: "PASSED" as const,
      result: "PASS" as const,
      notes: "GPS lock achieved in 34 seconds. Within 60-second threshold.",
      testProcedureVersionId: TPV3_ID,
      executedBy: BOB_ID,
      executedAt: at(8, 5), // Day 9, 14:00 UTC
      createdBy: CAROL_ID,
    },
    {
      id: TC4_ID,
      title: "Route displayed correctly in mobile app",
      description: "Verify recorded GPS route matches the actual path walked.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV4_ID,
      createdBy: CAROL_ID,
    },
    {
      id: TC5_ID,
      title: "Battery runtime meets minimum requirement",
      description: "Verify battery lasts at least 24 hours under typical usage.",
      status: "FAILED" as const,
      result: "FAIL" as const,
      notes: "Battery depleted after 18.5 hours. Below 24-hour threshold. Suspect GPS power draw.",
      testProcedureVersionId: TPV5_ID,
      executedBy: BOB_ID,
      executedAt: at(9, 3), // Day 10, 12:00 UTC
      createdBy: CAROL_ID,
    },
    {
      id: TC6_ID,
      title: "Device remains functional after water pressure test",
      description: "Verify smartwatch operates normally after pressure chamber exposure.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV6_ID,
      createdBy: CAROL_ID,
    },
    {
      id: TC7_ID,
      title: "Notification appears within expected time",
      description: "Verify phone notifications display on smartwatch within 3 seconds.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV7_ID,
      createdBy: CAROL_ID,
    },
    {
      id: TC8_ID,
      title: "All major smartwatch subsystems operate simultaneously",
      description: "Verify sensors, connectivity, and app features work together.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV8_ID,
      createdBy: CAROL_ID,
    },
  ];

  for (const tc of tcData) {
    const created = await prisma.testCase.create({ data: tc });
    console.log(`  TC: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 9. Audit Logs ────────────────────────────────────────

  console.log("Seeding audit logs...");

  const auditEntries = [
    // ── Day 1-2: Alice creates and approves all 6 PRs ──────

    // PR1: Continuous Heart Rate Monitoring
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PR1_ID,
      changes: { title: "Continuous Heart Rate Monitoring", status: "DRAFT" },
      createdAt: at(0, 0), // Day 1, 09:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "ProductRequirement",
      entityId: PR1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(0, 1), // Day 1, 10:00
    },

    // PR2: Outdoor Activity GPS Tracking
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PR2_ID,
      changes: { title: "Outdoor Activity GPS Tracking", status: "DRAFT" },
      createdAt: at(0, 2), // Day 1, 11:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "ProductRequirement",
      entityId: PR2_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(0, 3), // Day 1, 12:00
    },

    // PR3: Smartwatch Battery Life
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PR3_ID,
      changes: { title: "Smartwatch Battery Life", status: "DRAFT" },
      createdAt: at(0, 4), // Day 1, 13:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "ProductRequirement",
      entityId: PR3_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(0, 5), // Day 1, 14:00
    },

    // PR4: Water Resistance Capability
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PR4_ID,
      changes: { title: "Water Resistance Capability", status: "DRAFT" },
      createdAt: at(1, 0), // Day 2, 09:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "ProductRequirement",
      entityId: PR4_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(1, 1), // Day 2, 10:00
    },

    // PR5: Smartphone Notification Display (will be canceled later)
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PR5_ID,
      changes: { title: "Smartphone Notification Display", status: "DRAFT" },
      createdAt: at(1, 2), // Day 2, 11:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "ProductRequirement",
      entityId: PR5_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(1, 3), // Day 2, 12:00
    },

    // PR6: System Functional Verification
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "ProductRequirement",
      entityId: PR6_ID,
      changes: { title: "System Functional Verification", status: "DRAFT" },
      createdAt: at(1, 4), // Day 2, 13:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "ProductRequirement",
      entityId: PR6_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(1, 5), // Day 2, 14:00
    },

    // ── Day 3-5: Alice creates and approves sub-requirements ──

    // SR1.1: Heart Rate Sensor Hardware Integration -> Hardware
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR1_1_ID,
      changes: { title: "Heart Rate Sensor Hardware Integration", status: "DRAFT" },
      createdAt: at(2, 0), // Day 3, 09:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR1_1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(2, 1), // Day 3, 10:00
    },

    // SR1.2: Heart Rate Calculation Algorithm -> Algorithm
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR1_2_ID,
      changes: { title: "Heart Rate Calculation Algorithm", status: "DRAFT" },
      createdAt: at(2, 2), // Day 3, 11:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR1_2_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(2, 3), // Day 3, 12:00
    },

    // SR2.1: GPS Hardware Receiver -> Electrical
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR2_1_ID,
      changes: { title: "GPS Hardware Receiver", status: "DRAFT" },
      createdAt: at(2, 4), // Day 3, 13:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR2_1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(2, 5), // Day 3, 14:00
    },

    // SR2.2: Workout Route Recording -> App
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR2_2_ID,
      changes: { title: "Workout Route Recording", status: "DRAFT" },
      createdAt: at(3, 0), // Day 4, 09:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR2_2_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(3, 1), // Day 4, 10:00
    },

    // SR3.1: Battery Capacity and Power Delivery -> Electrical
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR3_1_ID,
      changes: { title: "Battery Capacity and Power Delivery", status: "DRAFT" },
      createdAt: at(3, 2), // Day 4, 11:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR3_1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(3, 3), // Day 4, 12:00
    },

    // SR4.1: Waterproof Mechanical Sealing -> Mechanical
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR4_1_ID,
      changes: { title: "Waterproof Mechanical Sealing", status: "DRAFT" },
      createdAt: at(3, 4), // Day 4, 13:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR4_1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(3, 5), // Day 4, 14:00
    },

    // SR5.1: Notification Delivery and Display -> App
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR5_1_ID,
      changes: { title: "Notification Delivery and Display", status: "DRAFT" },
      createdAt: at(4, 0), // Day 5, 09:00
    },
    {
      actorId: ALICE_ID,
      action: "APPROVE" as const,
      entityType: "SubRequirement",
      entityId: SR5_1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(4, 1), // Day 5, 10:00
    },

    // SR6.1: End-to-End System Validation -> Testing (DRAFT only)
    {
      actorId: ALICE_ID,
      action: "CREATE" as const,
      entityType: "SubRequirement",
      entityId: SR6_1_ID,
      changes: { title: "End-to-End System Validation", status: "DRAFT" },
      createdAt: at(4, 2), // Day 5, 11:00
    },

    // ── Day 6-8: Carol creates test procedures and versions ──

    // TP1: Sensor Data Availability
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP1_ID,
      changes: { title: "Sensor Data Availability" },
      createdAt: at(5, 0), // Day 6, 09:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV1_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(5, 1), // Day 6, 10:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV1_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(5, 2), // Day 6, 11:00
    },

    // TP2: Algorithm Accuracy Validation
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP2_ID,
      changes: { title: "Algorithm Accuracy Validation" },
      createdAt: at(5, 3), // Day 6, 12:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV2_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(5, 4), // Day 6, 13:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV2_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(5, 5), // Day 6, 14:00
    },

    // TP3: GPS Signal Acquisition
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP3_ID,
      changes: { title: "GPS Signal Acquisition" },
      createdAt: at(6, 0), // Day 7, 09:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV3_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(6, 1), // Day 7, 10:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV3_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(6, 2), // Day 7, 11:00
    },

    // TP4: Route Recording Verification
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP4_ID,
      changes: { title: "Route Recording Verification" },
      createdAt: at(6, 3), // Day 7, 12:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV4_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(6, 4), // Day 7, 13:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV4_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(6, 5), // Day 7, 14:00
    },

    // TP5: Battery Runtime Test
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP5_ID,
      changes: { title: "Battery Runtime Test" },
      createdAt: at(7, 0), // Day 8, 09:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV5_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(7, 1), // Day 8, 10:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV5_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(7, 2), // Day 8, 11:00
    },

    // TP6: Water Pressure Test
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP6_ID,
      changes: { title: "Water Pressure Test" },
      createdAt: at(7, 3), // Day 8, 12:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV6_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(7, 4), // Day 8, 13:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV6_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(7, 5), // Day 8, 14:00
    },

    // TP7: Notification Delivery Test
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP7_ID,
      changes: { title: "Notification Delivery Test" },
      createdAt: at(7, 6), // Day 8, 15:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV7_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(7, 7), // Day 8, 16:00
    },
    {
      actorId: CAROL_ID,
      action: "APPROVE" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV7_ID,
      changes: { status: { from: "DRAFT", to: "APPROVED" } },
      createdAt: at(7, 8), // Day 8, 17:00
    },

    // TP8: System Integration Test (DRAFT version - no APPROVE)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestProcedure",
      entityId: TP8_ID,
      changes: { title: "System Integration Test" },
      createdAt: at(7, 9), // Day 8, 18:00
    },
    {
      actorId: CAROL_ID,
      action: "CREATE_VERSION" as const,
      entityType: "TestProcedureVersion",
      entityId: TPV8_ID,
      changes: { versionNumber: 1, status: "DRAFT" },
      createdAt: at(7, 10), // Day 8, 19:00
    },

    // ── Day 6-8: Carol creates test cases ──────────────────

    // TC1: Heart rate samples (PENDING)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC1_ID,
      changes: { title: "Heart rate samples generated continuously" },
      createdAt: at(5, 2), // Day 6, 11:00 (after TPV1 published)
    },

    // TC2: Heart rate accuracy (PENDING)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC2_ID,
      changes: { title: "Heart rate accuracy within tolerance" },
      createdAt: at(5, 5), // Day 6, 14:00 (after TPV2 published)
    },

    // TC3: GPS lock (will be executed Day 9)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC3_ID,
      changes: { title: "GPS lock acquired within expected time" },
      createdAt: at(6, 2), // Day 7, 11:00 (after TPV3 published)
    },

    // TC4: Route displayed (PENDING)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC4_ID,
      changes: { title: "Route displayed correctly in mobile app" },
      createdAt: at(6, 5), // Day 7, 14:00 (after TPV4 published)
    },

    // TC5: Battery runtime (will be executed Day 10)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC5_ID,
      changes: { title: "Battery runtime meets minimum requirement" },
      createdAt: at(7, 2), // Day 8, 11:00 (after TPV5 published)
    },

    // TC6: Water pressure (PENDING)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC6_ID,
      changes: { title: "Device remains functional after water pressure test" },
      createdAt: at(7, 5), // Day 8, 14:00 (after TPV6 published)
    },

    // TC7: Notification timing (PENDING)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC7_ID,
      changes: { title: "Notification appears within expected time" },
      createdAt: at(7, 8), // Day 8, 17:00 (after TPV7 published)
    },

    // TC8: System integration (PENDING)
    {
      actorId: CAROL_ID,
      action: "CREATE" as const,
      entityType: "TestCase",
      entityId: TC8_ID,
      changes: { title: "All major smartwatch subsystems operate simultaneously" },
      createdAt: at(7, 10), // Day 8, 19:00 (after TPV8 created)
    },

    // ── Day 9-10: Bob executes GPS test (PASS) and battery test (FAIL) ──

    // TC3: GPS lock - PASS
    {
      actorId: BOB_ID,
      action: "RECORD_RESULT" as const,
      entityType: "TestCase",
      entityId: TC3_ID,
      changes: { status: { from: "PENDING", to: "PASSED" }, result: "PASS" },
      createdAt: at(8, 5), // Day 9, 14:00
    },

    // TC5: Battery runtime - FAIL
    {
      actorId: BOB_ID,
      action: "RECORD_RESULT" as const,
      entityType: "TestCase",
      entityId: TC5_ID,
      changes: { status: { from: "PENDING", to: "FAILED" }, result: "FAIL" },
      createdAt: at(9, 3), // Day 10, 12:00
    },

    // ── Day 11: Alice cancels PR5 ──────────────────────────

    {
      actorId: ALICE_ID,
      action: "CANCEL" as const,
      entityType: "ProductRequirement",
      entityId: PR5_ID,
      changes: { status: { from: "APPROVED", to: "CANCELED" } },
      createdAt: at(10, 0), // Day 11, 09:00
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }
  console.log(`  Created ${auditEntries.length} audit log entries.\n`);

  // ── Done ──────────────────────────────────────────────────

  console.log("Seed complete!");
  console.log("  6 teams, 3 users");
  console.log("  6 product requirements (5 APPROVED, 1 CANCELED)");
  console.log("  8 sub-requirements (7 APPROVED, 1 DRAFT)");
  console.log("  8 test procedures (all ACTIVE)");
  console.log("  8 procedure versions (7 APPROVED, 1 DRAFT)");
  console.log("  8 test cases (6 PENDING, 1 PASSED, 1 FAILED)");
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
