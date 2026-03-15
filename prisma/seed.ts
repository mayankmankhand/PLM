/**
 * Seed script for PLM database.
 *
 * Creates demo teams, users, and a smartwatch product lifecycle dataset
 * with realistic volume and status variety for demo purposes.
 * Uses Friends characters as the 6 demo engineers.
 *
 * Dataset: 10 PRs, 21 SRs, 18 TPs, 19 TPVs, 20 TCs, 6 attachments, ~150 audit entries
 *
 * Run with: npx tsx prisma/seed.ts
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { DEMO_TEAMS, DEMO_USERS } from "../src/lib/demo-users";

const prisma = new PrismaClient();

// ── User aliases ────────────────────────────────────────────

const MONICA = DEMO_USERS[0].id; // Hardware
const ROSS = DEMO_USERS[1].id; // Algorithm
const RACHEL = DEMO_USERS[2].id; // App
const CHANDLER = DEMO_USERS[3].id; // Electrical
const JOEY = DEMO_USERS[4].id; // Mechanical
const PHOEBE = DEMO_USERS[5].id; // Testing

// ── Team aliases ────────────────────────────────────────────

const TEAM_ELECTRICAL = DEMO_TEAMS[0].id;
const TEAM_MECHANICAL = DEMO_TEAMS[1].id;
const TEAM_APP = DEMO_TEAMS[2].id;
const TEAM_ALGORITHM = DEMO_TEAMS[3].id;
const TEAM_HARDWARE = DEMO_TEAMS[4].id;
const TEAM_TESTING = DEMO_TEAMS[5].id;

// ── Deterministic IDs for seed entities ─────────────────────

// Product Requirements (10)
const PR1 = "c0000000-0001-4000-8000-000000000001"; // Heart Rate Monitoring
const PR2 = "c0000000-0002-4000-8000-000000000002"; // GPS Tracking
const PR3 = "c0000000-0003-4000-8000-000000000003"; // Battery Life
const PR4 = "c0000000-0004-4000-8000-000000000004"; // Water Resistance
const PR5 = "c0000000-0005-4000-8000-000000000005"; // Notifications (CANCELED)
const PR6 = "c0000000-0006-4000-8000-000000000006"; // Sleep Tracking
const PR7 = "c0000000-0007-4000-8000-000000000007"; // ECG (DRAFT)
const PR8 = "c0000000-0008-4000-8000-000000000008"; // NFC Payments
const PR9 = "c0000000-0009-4000-8000-000000000009"; // Fall Detection
const PR10 = "c0000000-0010-4000-8000-000000000010"; // Ambient Light & UV

// Sub-Requirements (21)
const SR1_1 = "d0000000-0001-4000-8000-000000000001"; // HR Sensor Hardware
const SR1_2 = "d0000000-0002-4000-8000-000000000002"; // HR Algorithm
const SR2_1 = "d0000000-0003-4000-8000-000000000003"; // GPS Receiver
const SR2_2 = "d0000000-0004-4000-8000-000000000004"; // Route Recording
const SR3_1 = "d0000000-0005-4000-8000-000000000005"; // Battery Capacity
const SR3_2 = "d0000000-0006-4000-8000-000000000006"; // Power Management
const SR4_1 = "d0000000-0007-4000-8000-000000000007"; // Waterproof Sealing
const SR4_2 = "d0000000-0008-4000-8000-000000000008"; // Button Seal
const SR5_1 = "d0000000-0009-4000-8000-000000000009"; // Notification Delivery (CANCELED)
const SR6_1 = "d0000000-0010-4000-8000-000000000010"; // Sleep Stage Algorithm
const SR6_2 = "d0000000-0011-4000-8000-000000000011"; // Sleep Data Visualization
const SR7_1 = "d0000000-0012-4000-8000-000000000012"; // ECG Sensor Hardware (DRAFT)
const SR7_2 = "d0000000-0013-4000-8000-000000000013"; // ECG Signal Processing (DRAFT)
const SR8_1 = "d0000000-0014-4000-8000-000000000014"; // NFC Antenna
const SR8_2 = "d0000000-0015-4000-8000-000000000015"; // Payment App Integration
const SR9_1 = "d0000000-0016-4000-8000-000000000016"; // Accelerometer Calibration
const SR9_2 = "d0000000-0017-4000-8000-000000000017"; // Fall Detection Algorithm
const SR9_3 = "d0000000-0018-4000-8000-000000000018"; // Emergency SOS UI
const SR10_1 = "d0000000-0019-4000-8000-000000000019"; // Light Sensor Module
const SR10_2 = "d0000000-0020-4000-8000-000000000020"; // UV Index Calculation
const SR10_3 = "d0000000-0021-4000-8000-000000000021"; // Auto-Brightness (DRAFT, coverage gap)

// Test Procedures (18) - no TPs for SR7_1, SR7_2 (DRAFT PR), SR10_3 (coverage gap)
const TP1 = "e0000000-0001-4000-8000-000000000001"; // Sensor Data Availability
const TP2 = "e0000000-0002-4000-8000-000000000002"; // Algorithm Accuracy
const TP3 = "e0000000-0003-4000-8000-000000000003"; // GPS Signal Acquisition
const TP4 = "e0000000-0004-4000-8000-000000000004"; // Route Recording
const TP5 = "e0000000-0005-4000-8000-000000000005"; // Battery Runtime
const TP6 = "e0000000-0006-4000-8000-000000000006"; // Power Management
const TP7 = "e0000000-0007-4000-8000-000000000007"; // Water Pressure
const TP8 = "e0000000-0008-4000-8000-000000000008"; // Button Seal
const TP9 = "e0000000-0009-4000-8000-000000000009"; // Notification Delivery (CANCELED)
const TP10 = "e0000000-0010-4000-8000-000000000010"; // Sleep Stage Accuracy
const TP11 = "e0000000-0011-4000-8000-000000000011"; // Sleep Dashboard
const TP12 = "e0000000-0012-4000-8000-000000000012"; // NFC Range
const TP13 = "e0000000-0013-4000-8000-000000000013"; // Payment Flow
const TP14 = "e0000000-0014-4000-8000-000000000014"; // Drop Test Calibration
const TP15 = "e0000000-0015-4000-8000-000000000015"; // Fall Detection Accuracy
const TP16 = "e0000000-0016-4000-8000-000000000016"; // SOS Trigger
const TP17 = "e0000000-0017-4000-8000-000000000017"; // Light Sensor Linearity
const TP18 = "e0000000-0018-4000-8000-000000000018"; // UV Index Validation

// Test Procedure Versions (19) - TP1 has v1 (APPROVED) + v2 (DRAFT)
const TPV1 = "f0000000-0001-4000-8000-000000000001"; // TP1 v1
const TPV2 = "f0000000-0002-4000-8000-000000000002"; // TP2 v1
const TPV3 = "f0000000-0003-4000-8000-000000000003"; // TP3 v1
const TPV4 = "f0000000-0004-4000-8000-000000000004"; // TP4 v1
const TPV5 = "f0000000-0005-4000-8000-000000000005"; // TP5 v1
const TPV6 = "f0000000-0006-4000-8000-000000000006"; // TP6 v1
const TPV7 = "f0000000-0007-4000-8000-000000000007"; // TP7 v1
const TPV8 = "f0000000-0008-4000-8000-000000000008"; // TP8 v1
const TPV9 = "f0000000-0009-4000-8000-000000000009"; // TP9 v1
const TPV10 = "f0000000-0010-4000-8000-000000000010"; // TP10 v1
const TPV11 = "f0000000-0011-4000-8000-000000000011"; // TP11 v1
const TPV12 = "f0000000-0012-4000-8000-000000000012"; // TP12 v1
const TPV13 = "f0000000-0013-4000-8000-000000000013"; // TP13 v1
const TPV14 = "f0000000-0014-4000-8000-000000000014"; // TP14 v1
const TPV15 = "f0000000-0015-4000-8000-000000000015"; // TP15 v1
const TPV16 = "f0000000-0016-4000-8000-000000000016"; // TP16 v1
const TPV17 = "f0000000-0017-4000-8000-000000000017"; // TP17 v1
const TPV18 = "f0000000-0018-4000-8000-000000000018"; // TP18 v1 (DRAFT)
const TPV1B = "f0000000-0019-4000-8000-000000000019"; // TP1 v2 (DRAFT, multi-version)

// Test Cases (20)
const TC1 = "11000000-0001-4000-8000-000000000001"; // HR samples [PASSED]
const TC2 = "11000000-0002-4000-8000-000000000002"; // HR accuracy [PASSED]
const TC3 = "11000000-0003-4000-8000-000000000003"; // GPS lock [PASSED]
const TC4 = "11000000-0004-4000-8000-000000000004"; // Route display [PENDING]
const TC5 = "11000000-0005-4000-8000-000000000005"; // Battery 24hr [FAILED]
const TC6 = "11000000-0006-4000-8000-000000000006"; // Power draw [PASSED]
const TC7 = "11000000-0007-4000-8000-000000000007"; // Water 50m [PASSED]
const TC8 = "11000000-0008-4000-8000-000000000008"; // Button seal [PENDING]
const TC9 = "11000000-0009-4000-8000-000000000009"; // Notification 3s [SKIPPED]
const TC10 = "11000000-0010-4000-8000-000000000010"; // Sleep stages [PASSED]
const TC11 = "11000000-0011-4000-8000-000000000011"; // Sleep dashboard [PENDING]
const TC12 = "11000000-0012-4000-8000-000000000012"; // NFC range [PASSED]
const TC13 = "11000000-0013-4000-8000-000000000013"; // Payment e2e [BLOCKED]
const TC14 = "11000000-0014-4000-8000-000000000014"; // Drop test [PASSED]
const TC15 = "11000000-0015-4000-8000-000000000015"; // Fall detection [FAILED]
const TC16 = "11000000-0016-4000-8000-000000000016"; // SOS alert [PENDING]
const TC17 = "11000000-0017-4000-8000-000000000017"; // Light sensor [PASSED]
const TC18 = "11000000-0018-4000-8000-000000000018"; // UV index [PENDING]
const TC19 = "11000000-0019-4000-8000-000000000019"; // HR v2 warmup [PENDING]
const TC20 = "11000000-0020-4000-8000-000000000020"; // Battery GPS draw [PENDING]

// Attachments (6)
const ATT1 = "22000000-0001-4000-8000-000000000001";
const ATT2 = "22000000-0002-4000-8000-000000000002";
const ATT3 = "22000000-0003-4000-8000-000000000003";
const ATT4 = "22000000-0004-4000-8000-000000000004";
const ATT5 = "22000000-0005-4000-8000-000000000005";
const ATT6 = "22000000-0006-4000-8000-000000000006";

// ── Cleanup arrays ──────────────────────────────────────────

const ALL_PR_IDS = [PR1, PR2, PR3, PR4, PR5, PR6, PR7, PR8, PR9, PR10];
const ALL_SR_IDS = [
  SR1_1, SR1_2, SR2_1, SR2_2, SR3_1, SR3_2, SR4_1, SR4_2, SR5_1,
  SR6_1, SR6_2, SR7_1, SR7_2, SR8_1, SR8_2, SR9_1, SR9_2, SR9_3,
  SR10_1, SR10_2, SR10_3,
];
const ALL_TP_IDS = [
  TP1, TP2, TP3, TP4, TP5, TP6, TP7, TP8, TP9,
  TP10, TP11, TP12, TP13, TP14, TP15, TP16, TP17, TP18,
];
const ALL_TPV_IDS = [
  TPV1, TPV2, TPV3, TPV4, TPV5, TPV6, TPV7, TPV8, TPV9,
  TPV10, TPV11, TPV12, TPV13, TPV14, TPV15, TPV16, TPV17, TPV18, TPV1B,
];
const ALL_TC_IDS = [
  TC1, TC2, TC3, TC4, TC5, TC6, TC7, TC8, TC9, TC10,
  TC11, TC12, TC13, TC14, TC15, TC16, TC17, TC18, TC19, TC20,
];
const ALL_ATT_IDS = [ATT1, ATT2, ATT3, ATT4, ATT5, ATT6];

// ── Anchor date with offset helper ──────────────────────────

const ANCHOR = new Date("2026-02-01T09:00:00Z");

/** Returns a Date offset from the anchor by days and hours. */
function at(dayOffset: number, hourOffset = 0): Date {
  const d = new Date(ANCHOR);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(d.getUTCHours() + hourOffset);
  return d;
}

// ── Audit log helper ────────────────────────────────────────

type AuditEntry = {
  actorId: string;
  action: "CREATE" | "UPDATE" | "APPROVE" | "CANCEL" | "SKIP" | "ADD_ATTACHMENT" | "REMOVE_ATTACHMENT" | "CREATE_VERSION" | "RECORD_RESULT";
  entityType: string;
  entityId: string;
  changes: Prisma.InputJsonObject;
  createdAt: Date;
};

function audit(
  actorId: string,
  action: AuditEntry["action"],
  entityType: string,
  entityId: string,
  changes: Prisma.InputJsonObject,
  day: number,
  hour: number,
): AuditEntry {
  return { actorId, action, entityType, entityId, changes, createdAt: at(day, hour) };
}

// ── Main seed function ──────────────────────────────────────

async function main() {
  console.log("Seeding PLM database...\n");

  // ── 1. Clean up existing seed data (reverse dependency order) ──

  console.log("Cleaning up old seed data...");

  const allEntityIds = [
    ...ALL_PR_IDS, ...ALL_SR_IDS, ...ALL_TP_IDS,
    ...ALL_TPV_IDS, ...ALL_TC_IDS, ...ALL_ATT_IDS,
  ];

  await prisma.auditLog.deleteMany({
    where: { entityId: { in: allEntityIds } },
  });

  await prisma.attachment.deleteMany({
    where: { id: { in: ALL_ATT_IDS } },
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

  // ── 4. Product Requirements (10) ──────────────────────────
  //
  // Status mix: 7 APPROVED, 1 CANCELED, 2 DRAFT
  //
  // Narrative: Monica leads requirements gathering for the smartwatch.
  // Domain owners create PRs in their area. PR5 (Notifications) gets
  // canceled mid-project. PR7 (ECG) is still in draft.

  console.log("Seeding product requirements...");

  const prData = [
    {
      id: PR1,
      title: "Continuous Heart Rate Monitoring",
      description:
        "The smartwatch shall continuously measure the user's heart rate using an optical PPG sensor " +
        "and display the value in the health monitoring interface.",
      status: "APPROVED" as const,
      createdBy: MONICA,
    },
    {
      id: PR2,
      title: "Outdoor Activity GPS Tracking",
      description:
        "The smartwatch shall track outdoor workouts using GPS and store route data " +
        "for review in the companion mobile application.",
      status: "APPROVED" as const,
      createdBy: CHANDLER,
    },
    {
      id: PR3,
      title: "Battery Life",
      description:
        "The smartwatch shall support at least 24 hours of typical usage on a full charge " +
        "including heart rate monitoring, Bluetooth, and periodic GPS.",
      status: "APPROVED" as const,
      createdBy: CHANDLER,
    },
    {
      id: PR4,
      title: "Water Resistance",
      description:
        "The smartwatch shall maintain full functionality after exposure to water " +
        "equivalent to 50 meters depth (5 ATM rating).",
      status: "APPROVED" as const,
      createdBy: JOEY,
    },
    {
      id: PR5,
      title: "Smartphone Notification Mirroring",
      description:
        "The smartwatch shall mirror notifications from a paired smartphone " +
        "including calls, messages, and app alerts.",
      status: "CANCELED" as const,
      createdBy: RACHEL,
    },
    {
      id: PR6,
      title: "Sleep Tracking and Analysis",
      description:
        "The smartwatch shall track sleep stages (light, deep, REM) overnight " +
        "and present a sleep quality score each morning.",
      status: "APPROVED" as const,
      createdBy: ROSS,
    },
    {
      id: PR7,
      title: "ECG Heart Rhythm Detection",
      description:
        "The smartwatch shall record a single-lead ECG and detect irregular heart rhythms " +
        "such as atrial fibrillation. Requires regulatory review.",
      status: "DRAFT" as const,
      createdBy: MONICA,
    },
    {
      id: PR8,
      title: "NFC Contactless Payments",
      description:
        "The smartwatch shall support contactless payments via NFC at compatible terminals " +
        "using tokenized card credentials stored on device.",
      status: "APPROVED" as const,
      createdBy: CHANDLER,
    },
    {
      id: PR9,
      title: "Fall Detection and Emergency SOS",
      description:
        "The smartwatch shall detect hard falls using accelerometer and gyroscope data " +
        "and automatically send an SOS alert if the user is unresponsive for 60 seconds.",
      status: "APPROVED" as const,
      createdBy: MONICA,
    },
    {
      id: PR10,
      title: "Ambient Light and UV Sensor",
      description:
        "The smartwatch shall measure ambient light for auto-brightness " +
        "and UV index for sun exposure warnings.",
      status: "APPROVED" as const,
      createdBy: MONICA,
    },
  ];

  for (const pr of prData) {
    const created = await prisma.productRequirement.create({ data: pr });
    console.log(`  PR: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 5. Sub-Requirements (21) ──────────────────────────────
  //
  // Status mix: 15 APPROVED, 1 CANCELED, 5 DRAFT
  // Coverage gap: SR10_3 (Auto-Brightness) is DRAFT with no test procedure.
  // ECG sub-reqs (SR7_1, SR7_2) are DRAFT under a DRAFT PR.

  console.log("Seeding sub-requirements...");

  const srData = [
    // PR1: Heart Rate (2 SRs)
    {
      id: SR1_1,
      title: "Heart Rate Sensor Hardware Integration",
      description:
        "Integrate an optical PPG sensor capable of sampling at least once per second.",
      status: "APPROVED" as const,
      productRequirementId: PR1,
      teamId: TEAM_HARDWARE,
      createdBy: MONICA,
    },
    {
      id: SR1_2,
      title: "Heart Rate Calculation Algorithm",
      description:
        "Compute heart rate from PPG signals with accuracy within plus/minus 5 BPM at rest.",
      status: "APPROVED" as const,
      productRequirementId: PR1,
      teamId: TEAM_ALGORITHM,
      createdBy: ROSS,
    },

    // PR2: GPS (2 SRs)
    {
      id: SR2_1,
      title: "GPS Hardware Receiver",
      description:
        "Include a GPS receiver capable of recording coordinates during outdoor activity tracking.",
      status: "APPROVED" as const,
      productRequirementId: PR2,
      teamId: TEAM_ELECTRICAL,
      createdBy: CHANDLER,
    },
    {
      id: SR2_2,
      title: "Workout Route Recording",
      description:
        "Store GPS coordinates during workouts and display route maps in the mobile app.",
      status: "APPROVED" as const,
      productRequirementId: PR2,
      teamId: TEAM_APP,
      createdBy: RACHEL,
    },

    // PR3: Battery (2 SRs)
    {
      id: SR3_1,
      title: "Battery Capacity and Power Delivery",
      description:
        "Provide sufficient battery capacity to support 24 hours under typical usage.",
      status: "APPROVED" as const,
      productRequirementId: PR3,
      teamId: TEAM_ELECTRICAL,
      createdBy: CHANDLER,
    },
    {
      id: SR3_2,
      title: "Power Management Firmware",
      description:
        "Implement adaptive power management to throttle sensor polling based on activity state.",
      status: "APPROVED" as const,
      productRequirementId: PR3,
      teamId: TEAM_ALGORITHM,
      createdBy: ROSS,
    },

    // PR4: Water Resistance (2 SRs)
    {
      id: SR4_1,
      title: "Waterproof Mechanical Sealing",
      description:
        "Seal the enclosure to prevent water ingress at pressures equivalent to 50m depth.",
      status: "APPROVED" as const,
      productRequirementId: PR4,
      teamId: TEAM_MECHANICAL,
      createdBy: JOEY,
    },
    {
      id: SR4_2,
      title: "Button and Crown Seal Verification",
      description:
        "Verify all physical buttons and the crown maintain waterproof integrity under pressure.",
      status: "APPROVED" as const,
      productRequirementId: PR4,
      teamId: TEAM_MECHANICAL,
      createdBy: JOEY,
    },

    // PR5: Notifications - CANCELED (1 SR)
    {
      id: SR5_1,
      title: "Notification Delivery and Display",
      description:
        "Receive and display smartphone notifications within 3 seconds of arrival.",
      status: "CANCELED" as const,
      productRequirementId: PR5,
      teamId: TEAM_APP,
      createdBy: RACHEL,
    },

    // PR6: Sleep Tracking (2 SRs)
    {
      id: SR6_1,
      title: "Sleep Stage Detection Algorithm",
      description:
        "Classify sleep into light, deep, and REM stages using accelerometer and heart rate data.",
      status: "APPROVED" as const,
      productRequirementId: PR6,
      teamId: TEAM_ALGORITHM,
      createdBy: ROSS,
    },
    {
      id: SR6_2,
      title: "Sleep Data Visualization",
      description:
        "Display sleep stage timeline and quality score in the companion mobile app.",
      status: "APPROVED" as const,
      productRequirementId: PR6,
      teamId: TEAM_APP,
      createdBy: RACHEL,
    },

    // PR7: ECG - DRAFT (2 SRs, both DRAFT)
    {
      id: SR7_1,
      title: "ECG Sensor Hardware",
      description:
        "Integrate electrodes and analog front-end for single-lead ECG capture.",
      status: "DRAFT" as const,
      productRequirementId: PR7,
      teamId: TEAM_HARDWARE,
      createdBy: MONICA,
    },
    {
      id: SR7_2,
      title: "ECG Signal Processing",
      description:
        "Process raw ECG signals to detect QRS complexes and flag irregular rhythms.",
      status: "DRAFT" as const,
      productRequirementId: PR7,
      teamId: TEAM_ALGORITHM,
      createdBy: ROSS,
    },

    // PR8: NFC (2 SRs)
    {
      id: SR8_1,
      title: "NFC Antenna and Controller",
      description:
        "Integrate NFC antenna and secure element for contactless payment transactions.",
      status: "APPROVED" as const,
      productRequirementId: PR8,
      teamId: TEAM_ELECTRICAL,
      createdBy: CHANDLER,
    },
    {
      id: SR8_2,
      title: "Payment App Integration",
      description:
        "Implement tokenized card storage and payment flow in the smartwatch wallet app.",
      status: "APPROVED" as const,
      productRequirementId: PR8,
      teamId: TEAM_APP,
      createdBy: RACHEL,
    },

    // PR9: Fall Detection (3 SRs)
    {
      id: SR9_1,
      title: "Accelerometer and Gyroscope Calibration",
      description:
        "Calibrate IMU sensors to reliably distinguish falls from normal movement.",
      status: "APPROVED" as const,
      productRequirementId: PR9,
      teamId: TEAM_HARDWARE,
      createdBy: MONICA,
    },
    {
      id: SR9_2,
      title: "Fall Detection Algorithm",
      description:
        "Detect hard falls with fewer than 2% false positives during daily activity.",
      status: "APPROVED" as const,
      productRequirementId: PR9,
      teamId: TEAM_ALGORITHM,
      createdBy: ROSS,
    },
    {
      id: SR9_3,
      title: "Emergency SOS User Interface",
      description:
        "Display countdown timer after fall detection and send emergency alert with GPS location.",
      status: "APPROVED" as const,
      productRequirementId: PR9,
      teamId: TEAM_APP,
      createdBy: RACHEL,
    },

    // PR10: Ambient Light (3 SRs)
    {
      id: SR10_1,
      title: "Ambient Light Sensor Module",
      description:
        "Integrate a light sensor capable of measuring lux and UV index.",
      status: "APPROVED" as const,
      productRequirementId: PR10,
      teamId: TEAM_HARDWARE,
      createdBy: MONICA,
    },
    {
      id: SR10_2,
      title: "UV Index Calculation",
      description:
        "Calculate UV index from raw sensor data and trigger exposure warnings above UV 6.",
      status: "APPROVED" as const,
      productRequirementId: PR10,
      teamId: TEAM_ALGORITHM,
      createdBy: ROSS,
    },
    {
      id: SR10_3,
      title: "Auto-Brightness Controller",
      description:
        "Adjust display brightness automatically based on ambient light readings.",
      status: "DRAFT" as const,
      productRequirementId: PR10,
      teamId: TEAM_ELECTRICAL,
      createdBy: CHANDLER,
    },
  ];

  for (const sr of srData) {
    const created = await prisma.subRequirement.create({ data: sr });
    console.log(`  SR: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 6. Test Procedures (18) ───────────────────────────────
  //
  // Status mix: 17 ACTIVE, 1 CANCELED (TP9 - parent PR canceled)
  // No TPs for: SR7_1, SR7_2 (ECG DRAFT), SR10_3 (coverage gap)
  // Phoebe (Testing) creates most TPs; domain owners create a few.

  console.log("Seeding test procedures...");

  const tpData = [
    { id: TP1, title: "Sensor Data Availability", subRequirementId: SR1_1, createdBy: PHOEBE },
    { id: TP2, title: "Algorithm Accuracy Validation", subRequirementId: SR1_2, createdBy: PHOEBE },
    { id: TP3, title: "GPS Signal Acquisition", subRequirementId: SR2_1, createdBy: PHOEBE },
    { id: TP4, title: "Route Recording Verification", subRequirementId: SR2_2, createdBy: PHOEBE },
    { id: TP5, title: "Battery Runtime Test", subRequirementId: SR3_1, createdBy: CHANDLER },
    { id: TP6, title: "Power Management Validation", subRequirementId: SR3_2, createdBy: ROSS },
    { id: TP7, title: "Water Pressure Test", subRequirementId: SR4_1, createdBy: JOEY },
    { id: TP8, title: "Button Seal Integrity Test", subRequirementId: SR4_2, createdBy: JOEY },
    { id: TP9, title: "Notification Delivery Test", subRequirementId: SR5_1, createdBy: PHOEBE },
    { id: TP10, title: "Sleep Stage Accuracy Test", subRequirementId: SR6_1, createdBy: ROSS },
    { id: TP11, title: "Sleep Dashboard Rendering Test", subRequirementId: SR6_2, createdBy: RACHEL },
    { id: TP12, title: "NFC Range and Reliability Test", subRequirementId: SR8_1, createdBy: CHANDLER },
    { id: TP13, title: "Payment End-to-End Flow Test", subRequirementId: SR8_2, createdBy: RACHEL },
    { id: TP14, title: "Drop Test Calibration", subRequirementId: SR9_1, createdBy: MONICA },
    { id: TP15, title: "Fall Detection Sensitivity Test", subRequirementId: SR9_2, createdBy: PHOEBE },
    { id: TP16, title: "SOS Alert Trigger Test", subRequirementId: SR9_3, createdBy: PHOEBE },
    { id: TP17, title: "Light Sensor Linearity Test", subRequirementId: SR10_1, createdBy: MONICA },
    { id: TP18, title: "UV Index Validation Test", subRequirementId: SR10_2, createdBy: ROSS },
  ];

  // TP9 is CANCELED (its parent PR5 was canceled); all others ACTIVE
  for (const tp of tpData) {
    const status = tp.id === TP9 ? ("CANCELED" as const) : ("ACTIVE" as const);
    const created = await prisma.testProcedure.create({
      data: { id: tp.id, title: tp.title, status, subRequirementId: tp.subRequirementId, createdBy: tp.createdBy },
    });
    console.log(`  TP: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 7. Test Procedure Versions (19) ───────────────────────
  //
  // TP1 has two versions: v1 APPROVED, v2 DRAFT (multi-version demo)
  // TPV18 is DRAFT (UV test, procedure not yet finalized)
  // All others are v1 APPROVED.

  console.log("Seeding test procedure versions...");

  const tpvData = [
    {
      id: TPV1, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP1, createdBy: PHOEBE,
      description: "Verify the PPG sensor provides continuous heart rate data.",
      steps:
        "1. Power on smartwatch.\n" +
        "2. Attach smartwatch to test wrist fixture.\n" +
        "3. Enable heart rate monitoring.\n" +
        "4. Record sensor output for 60 seconds.\n" +
        "5. Verify heart rate samples are generated at least once per second.",
    },
    {
      id: TPV2, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP2, createdBy: PHOEBE,
      description: "Verify heart rate algorithm accuracy against a reference device.",
      steps:
        "1. Place smartwatch on test subject.\n" +
        "2. Attach medical-grade reference heart rate monitor.\n" +
        "3. Record both values at rest for 5 minutes.\n" +
        "4. Record both values during light exercise for 5 minutes.\n" +
        "5. Compare readings and verify deviation is within plus/minus 5 BPM.",
    },
    {
      id: TPV3, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP3, createdBy: PHOEBE,
      description: "Verify GPS signal acquisition within acceptable time.",
      steps:
        "1. Power on smartwatch outdoors with clear sky.\n" +
        "2. Start activity tracking mode.\n" +
        "3. Measure time to acquire GPS lock.\n" +
        "4. Verify lock occurs within 60 seconds.\n" +
        "5. Repeat in partially obstructed environment (urban canyon).",
    },
    {
      id: TPV4, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP4, createdBy: PHOEBE,
      description: "Verify GPS route is correctly recorded and displayed.",
      steps:
        "1. Start outdoor running activity.\n" +
        "2. Walk a predefined 1km test route.\n" +
        "3. Stop activity recording.\n" +
        "4. Sync activity to mobile app.\n" +
        "5. Overlay recorded route on map and verify it matches actual path.",
    },
    {
      id: TPV5, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP5, createdBy: CHANDLER,
      description: "Validate battery duration under typical daily usage.",
      steps:
        "1. Fully charge the smartwatch.\n" +
        "2. Enable heart rate monitoring (continuous).\n" +
        "3. Enable Bluetooth connection to phone.\n" +
        "4. Simulate 50 notifications per day.\n" +
        "5. Run a 30-minute GPS workout.\n" +
        "6. Measure total runtime until battery reaches 5%.",
    },
    {
      id: TPV6, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP6, createdBy: ROSS,
      description: "Validate power management reduces draw during idle periods.",
      steps:
        "1. Instrument smartwatch with current measurement probe.\n" +
        "2. Measure baseline current draw during active use.\n" +
        "3. Leave device idle for 30 minutes.\n" +
        "4. Verify current draw drops by at least 40% in idle state.\n" +
        "5. Resume active use and verify sensors wake within 2 seconds.",
    },
    {
      id: TPV7, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP7, createdBy: JOEY,
      description: "Verify enclosure prevents water ingress under pressure.",
      steps:
        "1. Place smartwatch in pressure chamber.\n" +
        "2. Apply pressure equivalent to 50 meters depth.\n" +
        "3. Maintain pressure for 30 minutes.\n" +
        "4. Remove and inspect for water ingress.\n" +
        "5. Power on device and verify all functions operate normally.",
    },
    {
      id: TPV8, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP8, createdBy: JOEY,
      description: "Verify button and crown seals maintain integrity under pressure.",
      steps:
        "1. Place smartwatch in pressure chamber.\n" +
        "2. Apply 5 ATM pressure.\n" +
        "3. Actuate each button 50 times under pressure.\n" +
        "4. Rotate crown 100 times under pressure.\n" +
        "5. Inspect seals for deformation or leakage.",
    },
    {
      id: TPV9, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP9, createdBy: PHOEBE,
      description: "Verify notifications appear on the smartwatch within 3 seconds.",
      steps:
        "1. Pair smartwatch with smartphone via Bluetooth.\n" +
        "2. Send test notification from phone.\n" +
        "3. Measure delay between phone receipt and watch display.\n" +
        "4. Verify delay is under 3 seconds.\n" +
        "5. Repeat for call, SMS, and app notification types.",
    },
    {
      id: TPV10, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP10, createdBy: ROSS,
      description: "Validate sleep stage classification against polysomnography reference.",
      steps:
        "1. Set up polysomnography (PSG) reference monitor on test subject.\n" +
        "2. Have subject wear smartwatch on same wrist.\n" +
        "3. Record full night of sleep (minimum 6 hours).\n" +
        "4. Compare smartwatch sleep stages to PSG results.\n" +
        "5. Verify agreement rate is above 80% for each stage.",
    },
    {
      id: TPV11, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP11, createdBy: RACHEL,
      description: "Verify sleep data renders correctly in the companion app.",
      steps:
        "1. Complete a tracked sleep session.\n" +
        "2. Open companion app sleep dashboard.\n" +
        "3. Verify sleep stage timeline displays all stages.\n" +
        "4. Verify sleep quality score is calculated.\n" +
        "5. Verify historical data loads for past 7 days.",
    },
    {
      id: TPV12, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP12, createdBy: CHANDLER,
      description: "Verify NFC communication range and transaction reliability.",
      steps:
        "1. Place smartwatch near NFC test terminal.\n" +
        "2. Verify communication at 0cm, 2cm, and 4cm distances.\n" +
        "3. Attempt transaction at each distance.\n" +
        "4. Verify all transactions complete within 500ms.\n" +
        "5. Verify no communication above 5cm (security boundary).",
    },
    {
      id: TPV13, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP13, createdBy: RACHEL,
      description: "Validate end-to-end payment flow from card add to terminal purchase.",
      steps:
        "1. Add a test payment card to the wallet app.\n" +
        "2. Verify card tokenization completes.\n" +
        "3. Tap smartwatch on payment terminal.\n" +
        "4. Verify transaction is authorized.\n" +
        "5. Check transaction appears in payment history.",
    },
    {
      id: TPV14, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP14, createdBy: MONICA,
      description: "Calibrate accelerometer thresholds using controlled drop tests.",
      steps:
        "1. Mount smartwatch on drop test rig.\n" +
        "2. Drop from 0.5m onto padded surface (should NOT trigger).\n" +
        "3. Drop from 1.0m onto hard surface (should trigger).\n" +
        "4. Drop from 1.5m onto hard surface (should trigger).\n" +
        "5. Record acceleration profiles for threshold calibration.",
    },
    {
      id: TPV15, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP15, createdBy: PHOEBE,
      description: "Validate fall detection sensitivity and false positive rate.",
      steps:
        "1. Simulate 20 controlled falls of varying severity.\n" +
        "2. Record detection rate (target: above 95%).\n" +
        "3. Perform 100 normal daily activities (stairs, sitting, gestures).\n" +
        "4. Record false positive count (target: fewer than 2).\n" +
        "5. Calculate overall sensitivity and specificity.",
    },
    {
      id: TPV16, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP16, createdBy: PHOEBE,
      description: "Verify SOS alert is sent after fall detection countdown.",
      steps:
        "1. Trigger a simulated fall event.\n" +
        "2. Verify 60-second countdown appears on screen.\n" +
        "3. Allow countdown to complete without user interaction.\n" +
        "4. Verify SOS message is sent to emergency contact.\n" +
        "5. Verify GPS coordinates are included in the alert.",
    },
    {
      id: TPV17, versionNumber: 1, status: "APPROVED" as const, testProcedureId: TP17, createdBy: MONICA,
      description: "Verify light sensor output is linear across lux range.",
      steps:
        "1. Place smartwatch in light-controlled chamber.\n" +
        "2. Sweep light intensity from 0 to 100,000 lux.\n" +
        "3. Record sensor output at 10 intensity levels.\n" +
        "4. Plot sensor output vs reference meter.\n" +
        "5. Verify linearity (R-squared above 0.98).",
    },
    {
      id: TPV18, versionNumber: 1, status: "DRAFT" as const, testProcedureId: TP18, createdBy: ROSS,
      description: "Validate UV index calculation against reference spectrometer.",
      steps:
        "1. Set up reference UV spectrometer outdoors.\n" +
        "2. Place smartwatch sensor facing same direction.\n" +
        "3. Record UV readings at 3 times of day (morning, noon, afternoon).\n" +
        "4. Compare smartwatch UV index to reference.\n" +
        "5. Verify deviation is within plus/minus 0.5 UV index.",
    },
    // Multi-version: TP1 v2 (DRAFT) adds a warmup period check
    {
      id: TPV1B, versionNumber: 2, status: "DRAFT" as const, testProcedureId: TP1, createdBy: PHOEBE,
      description: "Updated procedure adding sensor warmup validation (v2).",
      steps:
        "1. Power on smartwatch from cold state.\n" +
        "2. Start heart rate monitoring immediately.\n" +
        "3. Record time until first valid reading.\n" +
        "4. Verify warmup completes within 10 seconds.\n" +
        "5. Continue recording for 60 seconds.\n" +
        "6. Verify samples are generated at least once per second after warmup.",
    },
  ];

  for (const tpv of tpvData) {
    const created = await prisma.testProcedureVersion.create({ data: tpv });
    console.log(`  TPV: v${created.versionNumber} for TP ${tpv.testProcedureId.slice(-4)} [${created.status}]`);
  }
  console.log();

  // ── 8. Test Cases (20) ────────────────────────────────────
  //
  // Status mix: 8 PASSED, 2 FAILED, 7 PENDING, 1 BLOCKED, 1 SKIPPED, 1 PENDING (on DRAFT TPV)
  //
  // Interesting scenarios:
  // - TC5: Battery FAILED (18.5hr vs 24hr target - GPS power draw)
  // - TC9: SKIPPED (parent PR canceled)
  // - TC13: BLOCKED (waiting on bank test sandbox access)
  // - TC15: FAILED (too many false positives in fall detection)
  // - TC19: PENDING on v2 DRAFT version (multi-version)
  // - TC20: Second test case on same version as TC5

  console.log("Seeding test cases...");

  const tcData = [
    {
      id: TC1, title: "Heart rate samples generated continuously",
      description: "Verify PPG sensor produces samples at the required 1Hz rate.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "Sensor produced 61 samples in 60 seconds. Meets 1Hz requirement.",
      testProcedureVersionId: TPV1, executedBy: PHOEBE, executedAt: at(14, 2), createdBy: PHOEBE,
    },
    {
      id: TC2, title: "Heart rate accuracy within tolerance",
      description: "Verify computed heart rate matches reference within plus/minus 5 BPM.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "Max deviation 3 BPM at rest, 4 BPM during exercise. Within tolerance.",
      testProcedureVersionId: TPV2, executedBy: ROSS, executedAt: at(14, 4), createdBy: PHOEBE,
    },
    {
      id: TC3, title: "GPS lock acquired within 60 seconds",
      description: "Verify GPS signal acquisition completes within the required time.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "Clear sky: 28s. Urban canyon: 47s. Both within 60s threshold.",
      testProcedureVersionId: TPV3, executedBy: CHANDLER, executedAt: at(15, 1), createdBy: PHOEBE,
    },
    {
      id: TC4, title: "Route displayed correctly in mobile app",
      description: "Verify recorded GPS route matches the actual path walked.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV4, createdBy: PHOEBE,
    },
    {
      id: TC5, title: "Battery runtime meets 24-hour minimum",
      description: "Verify battery lasts at least 24 hours under typical usage profile.",
      status: "FAILED" as const, result: "FAIL" as const,
      notes: "Battery depleted after 18.5 hours. GPS workout consumed 34% in 30 minutes. Suspect GPS power draw is too high.",
      testProcedureVersionId: TPV5, executedBy: JOEY, executedAt: at(16, 6), createdBy: CHANDLER,
    },
    {
      id: TC6, title: "Power draw reduced during idle",
      description: "Verify power management reduces current draw by 40% when idle.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "Active: 45mA. Idle: 18mA. 60% reduction, exceeds 40% target.",
      testProcedureVersionId: TPV6, executedBy: CHANDLER, executedAt: at(15, 5), createdBy: ROSS,
    },
    {
      id: TC7, title: "Device functional after 50m water pressure test",
      description: "Verify smartwatch operates normally after pressure chamber exposure.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "No water ingress detected. All sensors and display functional post-test.",
      testProcedureVersionId: TPV7, executedBy: JOEY, executedAt: at(16, 2), createdBy: JOEY,
    },
    {
      id: TC8, title: "Button seals intact after pressure cycling",
      description: "Verify button and crown seals show no deformation after pressure test.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV8, createdBy: JOEY,
    },
    {
      id: TC9, title: "Notification displayed within 3 seconds",
      description: "Verify phone notifications appear on smartwatch within time limit.",
      status: "SKIPPED" as const, result: "SKIPPED" as const,
      notes: "Parent requirement PR5 (Notification Mirroring) was canceled. Test skipped.",
      testProcedureVersionId: TPV9, executedBy: PHOEBE, executedAt: at(18, 0), createdBy: PHOEBE,
    },
    {
      id: TC10, title: "Sleep stage classification matches reference",
      description: "Verify sleep stages agree with polysomnography above 80%.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "Light: 84% agreement. Deep: 81%. REM: 83%. All above 80% threshold.",
      testProcedureVersionId: TPV10, executedBy: ROSS, executedAt: at(17, 3), createdBy: ROSS,
    },
    {
      id: TC11, title: "Sleep dashboard renders correctly",
      description: "Verify sleep timeline and score display in the companion app.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV11, createdBy: RACHEL,
    },
    {
      id: TC12, title: "NFC transactions reliable within 4cm",
      description: "Verify NFC communication and transactions at specified distances.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "100% success at 0-4cm. No communication at 5cm+. Meets spec.",
      testProcedureVersionId: TPV12, executedBy: CHANDLER, executedAt: at(17, 5), createdBy: CHANDLER,
    },
    {
      id: TC13, title: "Payment end-to-end flow completes",
      description: "Verify full payment flow from card enrollment to terminal purchase.",
      status: "BLOCKED" as const, result: "BLOCKED" as const,
      notes: "Blocked: waiting for bank test sandbox credentials. Expected access by March 15.",
      testProcedureVersionId: TPV13, executedBy: RACHEL, executedAt: at(17, 7), createdBy: RACHEL,
    },
    {
      id: TC14, title: "Drop test triggers at correct thresholds",
      description: "Verify accelerometer thresholds are calibrated for fall detection.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "0.5m padded: no trigger (correct). 1.0m hard: triggered. 1.5m hard: triggered. Thresholds correct.",
      testProcedureVersionId: TPV14, executedBy: MONICA, executedAt: at(16, 4), createdBy: MONICA,
    },
    {
      id: TC15, title: "Fall detection sensitivity within target",
      description: "Verify fall detection rate above 95% with fewer than 2% false positives.",
      status: "FAILED" as const, result: "FAIL" as const,
      notes: "Detection rate: 97% (pass). But 5 false positives in 100 activities (5%). Stair climbing and sudden sitting trigger false alerts. Algorithm needs tuning.",
      testProcedureVersionId: TPV15, executedBy: PHOEBE, executedAt: at(18, 2), createdBy: PHOEBE,
    },
    {
      id: TC16, title: "SOS alert sent after countdown",
      description: "Verify emergency alert fires with GPS after 60s countdown.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV16, createdBy: PHOEBE,
    },
    {
      id: TC17, title: "Light sensor output linear across range",
      description: "Verify sensor linearity from 0 to 100,000 lux.",
      status: "PASSED" as const, result: "PASS" as const,
      notes: "R-squared = 0.993. Exceeds 0.98 linearity requirement.",
      testProcedureVersionId: TPV17, executedBy: MONICA, executedAt: at(17, 1), createdBy: MONICA,
    },
    {
      id: TC18, title: "UV index matches reference spectrometer",
      description: "Verify UV index accuracy within plus/minus 0.5.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV18, createdBy: ROSS,
    },
    {
      id: TC19, title: "Sensor warmup completes within 10 seconds",
      description: "Verify heart rate sensor produces valid readings within 10s of cold start (v2 procedure).",
      status: "PENDING" as const,
      testProcedureVersionId: TPV1B, createdBy: PHOEBE,
    },
    {
      id: TC20, title: "GPS power consumption during workout",
      description: "Measure GPS power draw during a 30-minute workout to investigate battery failure.",
      status: "PENDING" as const,
      testProcedureVersionId: TPV5, createdBy: CHANDLER,
    },
  ];

  for (const tc of tcData) {
    const created = await prisma.testCase.create({ data: tc });
    console.log(`  TC: ${created.title} [${created.status}]`);
  }
  console.log();

  // ── 9. Attachments (6) ────────────────────────────────────

  console.log("Seeding attachments...");

  const attData = [
    {
      id: ATT1, fileName: "hr-sensor-datasheet.pdf", fileUrl: "/files/hr-sensor-datasheet.pdf",
      fileType: "DOCUMENT" as const, fileSizeBytes: 245_000,
      productRequirementId: PR1, uploadedBy: MONICA,
    },
    {
      id: ATT2, fileName: "gps-test-route-map.png", fileUrl: "/files/gps-test-route-map.png",
      fileType: "IMAGE" as const, fileSizeBytes: 1_200_000,
      testCaseId: TC3, uploadedBy: CHANDLER,
    },
    {
      id: ATT3, fileName: "battery-test-results.xlsx", fileUrl: "/files/battery-test-results.xlsx",
      fileType: "SPREADSHEET" as const, fileSizeBytes: 89_000,
      testCaseId: TC5, uploadedBy: JOEY,
    },
    {
      id: ATT4, fileName: "waterproof-seal-diagram.png", fileUrl: "/files/waterproof-seal-diagram.png",
      fileType: "IMAGE" as const, fileSizeBytes: 530_000,
      subRequirementId: SR4_1, uploadedBy: JOEY,
    },
    {
      id: ATT5, fileName: "nfc-certification-report.pdf", fileUrl: "/files/nfc-certification-report.pdf",
      fileType: "DOCUMENT" as const, fileSizeBytes: 420_000,
      testProcedureId: TP12, uploadedBy: CHANDLER,
    },
    {
      id: ATT6, fileName: "fall-detection-false-positives.xlsx", fileUrl: "/files/fall-detection-false-positives.xlsx",
      fileType: "SPREADSHEET" as const, fileSizeBytes: 67_000,
      testCaseId: TC15, uploadedBy: PHOEBE,
    },
  ];

  for (const att of attData) {
    await prisma.attachment.create({ data: att });
    console.log(`  Attachment: ${att.fileName} (${att.fileType})`);
  }
  console.log();

  // ── 10. Audit Logs ────────────────────────────────────────
  //
  // Timeline narrative (anchor: 2026-02-01):
  //   Days 0-2:  PR creation and approval
  //   Days 3-6:  SR creation and approval
  //   Days 7-10: TP/TPV creation and approval
  //   Days 11-13: TC creation
  //   Days 14-18: Test execution, results, attachments
  //   Day 19:    PR5 canceled, TP9 canceled, SR5_1 canceled, TC9 skipped
  //   Day 20:    TPV1B (v2) created for TP1

  console.log("Seeding audit logs...");

  const auditEntries: AuditEntry[] = [
    // ── Days 0-2: Product Requirements ──────────────────────

    // PR1: Heart Rate
    audit(MONICA, "CREATE", "ProductRequirement", PR1, { title: "Continuous Heart Rate Monitoring", status: "DRAFT" }, 0, 0),
    audit(MONICA, "APPROVE", "ProductRequirement", PR1, { status: { from: "DRAFT", to: "APPROVED" } }, 0, 1),

    // PR2: GPS
    audit(CHANDLER, "CREATE", "ProductRequirement", PR2, { title: "Outdoor Activity GPS Tracking", status: "DRAFT" }, 0, 2),
    audit(MONICA, "APPROVE", "ProductRequirement", PR2, { status: { from: "DRAFT", to: "APPROVED" } }, 0, 3),

    // PR3: Battery
    audit(CHANDLER, "CREATE", "ProductRequirement", PR3, { title: "Battery Life", status: "DRAFT" }, 0, 4),
    audit(MONICA, "APPROVE", "ProductRequirement", PR3, { status: { from: "DRAFT", to: "APPROVED" } }, 0, 5),

    // PR4: Water Resistance
    audit(JOEY, "CREATE", "ProductRequirement", PR4, { title: "Water Resistance", status: "DRAFT" }, 1, 0),
    audit(MONICA, "APPROVE", "ProductRequirement", PR4, { status: { from: "DRAFT", to: "APPROVED" } }, 1, 1),

    // PR5: Notifications (will be canceled later)
    audit(RACHEL, "CREATE", "ProductRequirement", PR5, { title: "Smartphone Notification Mirroring", status: "DRAFT" }, 1, 2),
    audit(MONICA, "APPROVE", "ProductRequirement", PR5, { status: { from: "DRAFT", to: "APPROVED" } }, 1, 3),

    // PR6: Sleep
    audit(ROSS, "CREATE", "ProductRequirement", PR6, { title: "Sleep Tracking and Analysis", status: "DRAFT" }, 1, 4),
    audit(MONICA, "APPROVE", "ProductRequirement", PR6, { status: { from: "DRAFT", to: "APPROVED" } }, 1, 5),

    // PR7: ECG (stays DRAFT)
    audit(MONICA, "CREATE", "ProductRequirement", PR7, { title: "ECG Heart Rhythm Detection", status: "DRAFT" }, 2, 0),

    // PR8: NFC
    audit(CHANDLER, "CREATE", "ProductRequirement", PR8, { title: "NFC Contactless Payments", status: "DRAFT" }, 2, 1),
    audit(MONICA, "APPROVE", "ProductRequirement", PR8, { status: { from: "DRAFT", to: "APPROVED" } }, 2, 2),

    // PR9: Fall Detection
    audit(MONICA, "CREATE", "ProductRequirement", PR9, { title: "Fall Detection and Emergency SOS", status: "DRAFT" }, 2, 3),
    audit(MONICA, "APPROVE", "ProductRequirement", PR9, { status: { from: "DRAFT", to: "APPROVED" } }, 2, 4),

    // PR10: Ambient Light
    audit(MONICA, "CREATE", "ProductRequirement", PR10, { title: "Ambient Light and UV Sensor", status: "DRAFT" }, 2, 5),
    audit(MONICA, "APPROVE", "ProductRequirement", PR10, { status: { from: "DRAFT", to: "APPROVED" } }, 2, 6),

    // ── Days 3-6: Sub-Requirements ──────────────────────────

    // PR1 SRs
    audit(MONICA, "CREATE", "SubRequirement", SR1_1, { title: "Heart Rate Sensor Hardware Integration", status: "DRAFT" }, 3, 0),
    audit(MONICA, "APPROVE", "SubRequirement", SR1_1, { status: { from: "DRAFT", to: "APPROVED" } }, 3, 1),
    audit(ROSS, "CREATE", "SubRequirement", SR1_2, { title: "Heart Rate Calculation Algorithm", status: "DRAFT" }, 3, 2),
    audit(MONICA, "APPROVE", "SubRequirement", SR1_2, { status: { from: "DRAFT", to: "APPROVED" } }, 3, 3),

    // PR2 SRs
    audit(CHANDLER, "CREATE", "SubRequirement", SR2_1, { title: "GPS Hardware Receiver", status: "DRAFT" }, 3, 4),
    audit(MONICA, "APPROVE", "SubRequirement", SR2_1, { status: { from: "DRAFT", to: "APPROVED" } }, 3, 5),
    audit(RACHEL, "CREATE", "SubRequirement", SR2_2, { title: "Workout Route Recording", status: "DRAFT" }, 3, 6),
    audit(MONICA, "APPROVE", "SubRequirement", SR2_2, { status: { from: "DRAFT", to: "APPROVED" } }, 3, 7),

    // PR3 SRs
    audit(CHANDLER, "CREATE", "SubRequirement", SR3_1, { title: "Battery Capacity and Power Delivery", status: "DRAFT" }, 4, 0),
    audit(MONICA, "APPROVE", "SubRequirement", SR3_1, { status: { from: "DRAFT", to: "APPROVED" } }, 4, 1),
    audit(ROSS, "CREATE", "SubRequirement", SR3_2, { title: "Power Management Firmware", status: "DRAFT" }, 4, 2),
    audit(MONICA, "APPROVE", "SubRequirement", SR3_2, { status: { from: "DRAFT", to: "APPROVED" } }, 4, 3),

    // PR4 SRs
    audit(JOEY, "CREATE", "SubRequirement", SR4_1, { title: "Waterproof Mechanical Sealing", status: "DRAFT" }, 4, 4),
    audit(MONICA, "APPROVE", "SubRequirement", SR4_1, { status: { from: "DRAFT", to: "APPROVED" } }, 4, 5),
    audit(JOEY, "CREATE", "SubRequirement", SR4_2, { title: "Button and Crown Seal Verification", status: "DRAFT" }, 4, 6),
    audit(MONICA, "APPROVE", "SubRequirement", SR4_2, { status: { from: "DRAFT", to: "APPROVED" } }, 4, 7),

    // PR5 SR
    audit(RACHEL, "CREATE", "SubRequirement", SR5_1, { title: "Notification Delivery and Display", status: "DRAFT" }, 5, 0),
    audit(MONICA, "APPROVE", "SubRequirement", SR5_1, { status: { from: "DRAFT", to: "APPROVED" } }, 5, 1),

    // PR6 SRs
    audit(ROSS, "CREATE", "SubRequirement", SR6_1, { title: "Sleep Stage Detection Algorithm", status: "DRAFT" }, 5, 2),
    audit(MONICA, "APPROVE", "SubRequirement", SR6_1, { status: { from: "DRAFT", to: "APPROVED" } }, 5, 3),
    audit(RACHEL, "CREATE", "SubRequirement", SR6_2, { title: "Sleep Data Visualization", status: "DRAFT" }, 5, 4),
    audit(MONICA, "APPROVE", "SubRequirement", SR6_2, { status: { from: "DRAFT", to: "APPROVED" } }, 5, 5),

    // PR7 SRs (DRAFT)
    audit(MONICA, "CREATE", "SubRequirement", SR7_1, { title: "ECG Sensor Hardware", status: "DRAFT" }, 5, 6),
    audit(ROSS, "CREATE", "SubRequirement", SR7_2, { title: "ECG Signal Processing", status: "DRAFT" }, 5, 7),

    // PR8 SRs
    audit(CHANDLER, "CREATE", "SubRequirement", SR8_1, { title: "NFC Antenna and Controller", status: "DRAFT" }, 6, 0),
    audit(MONICA, "APPROVE", "SubRequirement", SR8_1, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 1),
    audit(RACHEL, "CREATE", "SubRequirement", SR8_2, { title: "Payment App Integration", status: "DRAFT" }, 6, 2),
    audit(MONICA, "APPROVE", "SubRequirement", SR8_2, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 3),

    // PR9 SRs
    audit(MONICA, "CREATE", "SubRequirement", SR9_1, { title: "Accelerometer and Gyroscope Calibration", status: "DRAFT" }, 6, 4),
    audit(MONICA, "APPROVE", "SubRequirement", SR9_1, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 5),
    audit(ROSS, "CREATE", "SubRequirement", SR9_2, { title: "Fall Detection Algorithm", status: "DRAFT" }, 6, 6),
    audit(MONICA, "APPROVE", "SubRequirement", SR9_2, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 7),
    audit(RACHEL, "CREATE", "SubRequirement", SR9_3, { title: "Emergency SOS User Interface", status: "DRAFT" }, 6, 8),
    audit(MONICA, "APPROVE", "SubRequirement", SR9_3, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 9),

    // PR10 SRs
    audit(MONICA, "CREATE", "SubRequirement", SR10_1, { title: "Ambient Light Sensor Module", status: "DRAFT" }, 6, 10),
    audit(MONICA, "APPROVE", "SubRequirement", SR10_1, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 11),
    audit(ROSS, "CREATE", "SubRequirement", SR10_2, { title: "UV Index Calculation", status: "DRAFT" }, 6, 12),
    audit(MONICA, "APPROVE", "SubRequirement", SR10_2, { status: { from: "DRAFT", to: "APPROVED" } }, 6, 13),
    audit(CHANDLER, "CREATE", "SubRequirement", SR10_3, { title: "Auto-Brightness Controller", status: "DRAFT" }, 6, 14),
    // SR10_3 stays DRAFT (coverage gap - no TP)

    // ── Days 7-10: Test Procedures and Versions ─────────────

    // TP1 + TPV1
    audit(PHOEBE, "CREATE", "TestProcedure", TP1, { title: "Sensor Data Availability" }, 7, 0),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV1, { versionNumber: 1, status: "DRAFT" }, 7, 1),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV1, { status: { from: "DRAFT", to: "APPROVED" } }, 7, 2),

    // TP2 + TPV2
    audit(PHOEBE, "CREATE", "TestProcedure", TP2, { title: "Algorithm Accuracy Validation" }, 7, 3),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV2, { versionNumber: 1, status: "DRAFT" }, 7, 4),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV2, { status: { from: "DRAFT", to: "APPROVED" } }, 7, 5),

    // TP3 + TPV3
    audit(PHOEBE, "CREATE", "TestProcedure", TP3, { title: "GPS Signal Acquisition" }, 7, 6),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV3, { versionNumber: 1, status: "DRAFT" }, 7, 7),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV3, { status: { from: "DRAFT", to: "APPROVED" } }, 7, 8),

    // TP4 + TPV4
    audit(PHOEBE, "CREATE", "TestProcedure", TP4, { title: "Route Recording Verification" }, 8, 0),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV4, { versionNumber: 1, status: "DRAFT" }, 8, 1),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV4, { status: { from: "DRAFT", to: "APPROVED" } }, 8, 2),

    // TP5 + TPV5
    audit(CHANDLER, "CREATE", "TestProcedure", TP5, { title: "Battery Runtime Test" }, 8, 3),
    audit(CHANDLER, "CREATE_VERSION", "TestProcedureVersion", TPV5, { versionNumber: 1, status: "DRAFT" }, 8, 4),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV5, { status: { from: "DRAFT", to: "APPROVED" } }, 8, 5),

    // TP6 + TPV6
    audit(ROSS, "CREATE", "TestProcedure", TP6, { title: "Power Management Validation" }, 8, 6),
    audit(ROSS, "CREATE_VERSION", "TestProcedureVersion", TPV6, { versionNumber: 1, status: "DRAFT" }, 8, 7),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV6, { status: { from: "DRAFT", to: "APPROVED" } }, 8, 8),

    // TP7 + TPV7
    audit(JOEY, "CREATE", "TestProcedure", TP7, { title: "Water Pressure Test" }, 9, 0),
    audit(JOEY, "CREATE_VERSION", "TestProcedureVersion", TPV7, { versionNumber: 1, status: "DRAFT" }, 9, 1),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV7, { status: { from: "DRAFT", to: "APPROVED" } }, 9, 2),

    // TP8 + TPV8
    audit(JOEY, "CREATE", "TestProcedure", TP8, { title: "Button Seal Integrity Test" }, 9, 3),
    audit(JOEY, "CREATE_VERSION", "TestProcedureVersion", TPV8, { versionNumber: 1, status: "DRAFT" }, 9, 4),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV8, { status: { from: "DRAFT", to: "APPROVED" } }, 9, 5),

    // TP9 + TPV9 (will be canceled later)
    audit(PHOEBE, "CREATE", "TestProcedure", TP9, { title: "Notification Delivery Test" }, 9, 6),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV9, { versionNumber: 1, status: "DRAFT" }, 9, 7),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV9, { status: { from: "DRAFT", to: "APPROVED" } }, 9, 8),

    // TP10 + TPV10
    audit(ROSS, "CREATE", "TestProcedure", TP10, { title: "Sleep Stage Accuracy Test" }, 10, 0),
    audit(ROSS, "CREATE_VERSION", "TestProcedureVersion", TPV10, { versionNumber: 1, status: "DRAFT" }, 10, 1),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV10, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 2),

    // TP11 + TPV11
    audit(RACHEL, "CREATE", "TestProcedure", TP11, { title: "Sleep Dashboard Rendering Test" }, 10, 3),
    audit(RACHEL, "CREATE_VERSION", "TestProcedureVersion", TPV11, { versionNumber: 1, status: "DRAFT" }, 10, 4),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV11, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 5),

    // TP12 + TPV12
    audit(CHANDLER, "CREATE", "TestProcedure", TP12, { title: "NFC Range and Reliability Test" }, 10, 6),
    audit(CHANDLER, "CREATE_VERSION", "TestProcedureVersion", TPV12, { versionNumber: 1, status: "DRAFT" }, 10, 7),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV12, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 8),

    // TP13 + TPV13
    audit(RACHEL, "CREATE", "TestProcedure", TP13, { title: "Payment End-to-End Flow Test" }, 10, 9),
    audit(RACHEL, "CREATE_VERSION", "TestProcedureVersion", TPV13, { versionNumber: 1, status: "DRAFT" }, 10, 10),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV13, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 11),

    // TP14 + TPV14
    audit(MONICA, "CREATE", "TestProcedure", TP14, { title: "Drop Test Calibration" }, 10, 12),
    audit(MONICA, "CREATE_VERSION", "TestProcedureVersion", TPV14, { versionNumber: 1, status: "DRAFT" }, 10, 13),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV14, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 14),

    // TP15 + TPV15
    audit(PHOEBE, "CREATE", "TestProcedure", TP15, { title: "Fall Detection Sensitivity Test" }, 10, 15),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV15, { versionNumber: 1, status: "DRAFT" }, 10, 16),
    audit(MONICA, "APPROVE", "TestProcedureVersion", TPV15, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 17),

    // TP16 + TPV16
    audit(PHOEBE, "CREATE", "TestProcedure", TP16, { title: "SOS Alert Trigger Test" }, 10, 18),
    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV16, { versionNumber: 1, status: "DRAFT" }, 10, 19),
    audit(MONICA, "APPROVE", "TestProcedureVersion", TPV16, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 20),

    // TP17 + TPV17
    audit(MONICA, "CREATE", "TestProcedure", TP17, { title: "Light Sensor Linearity Test" }, 10, 21),
    audit(MONICA, "CREATE_VERSION", "TestProcedureVersion", TPV17, { versionNumber: 1, status: "DRAFT" }, 10, 22),
    audit(PHOEBE, "APPROVE", "TestProcedureVersion", TPV17, { status: { from: "DRAFT", to: "APPROVED" } }, 10, 23),

    // TP18 + TPV18 (stays DRAFT)
    audit(ROSS, "CREATE", "TestProcedure", TP18, { title: "UV Index Validation Test" }, 10, 24),
    audit(ROSS, "CREATE_VERSION", "TestProcedureVersion", TPV18, { versionNumber: 1, status: "DRAFT" }, 10, 25),

    // ── Days 11-13: Test Case Creation ──────────────────────

    audit(PHOEBE, "CREATE", "TestCase", TC1, { title: "Heart rate samples generated continuously" }, 11, 0),
    audit(PHOEBE, "CREATE", "TestCase", TC2, { title: "Heart rate accuracy within tolerance" }, 11, 1),
    audit(PHOEBE, "CREATE", "TestCase", TC3, { title: "GPS lock acquired within 60 seconds" }, 11, 2),
    audit(PHOEBE, "CREATE", "TestCase", TC4, { title: "Route displayed correctly in mobile app" }, 11, 3),
    audit(CHANDLER, "CREATE", "TestCase", TC5, { title: "Battery runtime meets 24-hour minimum" }, 11, 4),
    audit(ROSS, "CREATE", "TestCase", TC6, { title: "Power draw reduced during idle" }, 11, 5),
    audit(JOEY, "CREATE", "TestCase", TC7, { title: "Device functional after 50m water pressure test" }, 12, 0),
    audit(JOEY, "CREATE", "TestCase", TC8, { title: "Button seals intact after pressure cycling" }, 12, 1),
    audit(PHOEBE, "CREATE", "TestCase", TC9, { title: "Notification displayed within 3 seconds" }, 12, 2),
    audit(ROSS, "CREATE", "TestCase", TC10, { title: "Sleep stage classification matches reference" }, 12, 3),
    audit(RACHEL, "CREATE", "TestCase", TC11, { title: "Sleep dashboard renders correctly" }, 12, 4),
    audit(CHANDLER, "CREATE", "TestCase", TC12, { title: "NFC transactions reliable within 4cm" }, 12, 5),
    audit(RACHEL, "CREATE", "TestCase", TC13, { title: "Payment end-to-end flow completes" }, 12, 6),
    audit(MONICA, "CREATE", "TestCase", TC14, { title: "Drop test triggers at correct thresholds" }, 13, 0),
    audit(PHOEBE, "CREATE", "TestCase", TC15, { title: "Fall detection sensitivity within target" }, 13, 1),
    audit(PHOEBE, "CREATE", "TestCase", TC16, { title: "SOS alert sent after countdown" }, 13, 2),
    audit(MONICA, "CREATE", "TestCase", TC17, { title: "Light sensor output linear across range" }, 13, 3),
    audit(ROSS, "CREATE", "TestCase", TC18, { title: "UV index matches reference spectrometer" }, 13, 4),

    // ── Days 14-18: Test Execution ──────────────────────────

    // Day 14: Heart rate tests pass
    audit(PHOEBE, "RECORD_RESULT", "TestCase", TC1, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 14, 2),
    audit(ROSS, "RECORD_RESULT", "TestCase", TC2, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 14, 4),

    // Day 15: GPS and power tests
    audit(CHANDLER, "RECORD_RESULT", "TestCase", TC3, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 15, 1),
    audit(CHANDLER, "RECORD_RESULT", "TestCase", TC6, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 15, 5),

    // Day 16: Mechanical and drop tests
    audit(JOEY, "RECORD_RESULT", "TestCase", TC7, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 16, 2),
    audit(MONICA, "RECORD_RESULT", "TestCase", TC14, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 16, 4),
    audit(JOEY, "RECORD_RESULT", "TestCase", TC5, { status: { from: "PENDING", to: "FAILED" }, result: "FAIL" }, 16, 6),

    // Day 17: Sleep, NFC, light sensor
    audit(MONICA, "RECORD_RESULT", "TestCase", TC17, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 17, 1),
    audit(ROSS, "RECORD_RESULT", "TestCase", TC10, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 17, 3),
    audit(CHANDLER, "RECORD_RESULT", "TestCase", TC12, { status: { from: "PENDING", to: "PASSED" }, result: "PASS" }, 17, 5),
    audit(RACHEL, "RECORD_RESULT", "TestCase", TC13, { status: { from: "PENDING", to: "BLOCKED" }, result: "BLOCKED" }, 17, 7),

    // Day 18: Fall detection and notification skip
    audit(PHOEBE, "RECORD_RESULT", "TestCase", TC15, { status: { from: "PENDING", to: "FAILED" }, result: "FAIL" }, 18, 2),

    // ── Day 19: Cancellation cascade ────────────────────────
    // Monica cancels PR5 -> SR5_1 canceled -> TP9 canceled -> TC9 skipped

    audit(MONICA, "CANCEL", "ProductRequirement", PR5, { status: { from: "APPROVED", to: "CANCELED" } }, 19, 0),
    audit(MONICA, "CANCEL", "SubRequirement", SR5_1, { status: { from: "APPROVED", to: "CANCELED" } }, 19, 1),
    audit(PHOEBE, "CANCEL", "TestProcedure", TP9, { status: { from: "ACTIVE", to: "CANCELED" } }, 19, 2),
    audit(PHOEBE, "SKIP", "TestCase", TC9, { status: { from: "PENDING", to: "SKIPPED" }, result: "SKIPPED" }, 19, 3),

    // ── Day 20: Multi-version and follow-up ─────────────────
    // Phoebe creates v2 of TP1 (adds warmup check after TC1 passed)
    // Chandler adds TC20 to investigate battery failure

    audit(PHOEBE, "CREATE_VERSION", "TestProcedureVersion", TPV1B, { versionNumber: 2, status: "DRAFT" }, 20, 0),
    audit(PHOEBE, "CREATE", "TestCase", TC19, { title: "Sensor warmup completes within 10 seconds" }, 20, 1),
    audit(CHANDLER, "CREATE", "TestCase", TC20, { title: "GPS power consumption during workout" }, 20, 2),

    // ── Attachment uploads (scattered across timeline) ──────

    audit(MONICA, "ADD_ATTACHMENT", "Attachment", ATT1, { fileName: "hr-sensor-datasheet.pdf" }, 3, 1),
    audit(CHANDLER, "ADD_ATTACHMENT", "Attachment", ATT2, { fileName: "gps-test-route-map.png" }, 15, 2),
    audit(JOEY, "ADD_ATTACHMENT", "Attachment", ATT3, { fileName: "battery-test-results.xlsx" }, 16, 7),
    audit(JOEY, "ADD_ATTACHMENT", "Attachment", ATT4, { fileName: "waterproof-seal-diagram.png" }, 4, 7),
    audit(CHANDLER, "ADD_ATTACHMENT", "Attachment", ATT5, { fileName: "nfc-certification-report.pdf" }, 10, 9),
    audit(PHOEBE, "ADD_ATTACHMENT", "Attachment", ATT6, { fileName: "fall-detection-false-positives.xlsx" }, 18, 3),

    // ── Day 16: Monica updates PR3 description after battery failure ──

    audit(MONICA, "UPDATE", "ProductRequirement", PR3, {
      description: {
        from: "The smartwatch shall support at least 24 hours of typical usage on a full charge.",
        to: "The smartwatch shall support at least 24 hours of typical usage on a full charge including heart rate monitoring, Bluetooth, and periodic GPS.",
      },
    }, 16, 8),
  ];

  // Sort by createdAt to ensure chronological insertion
  auditEntries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }
  console.log(`  Created ${auditEntries.length} audit log entries.\n`);

  // ── Done ──────────────────────────────────────────────────

  console.log("Seed complete!");
  console.log("  6 teams, 6 users (Friends cast)");
  console.log("  10 product requirements (7 APPROVED, 1 CANCELED, 2 DRAFT)");
  console.log("  21 sub-requirements (15 APPROVED, 1 CANCELED, 5 DRAFT)");
  console.log("  18 test procedures (17 ACTIVE, 1 CANCELED)");
  console.log("  19 procedure versions (16 APPROVED, 3 DRAFT)");
  console.log("  20 test cases (8 PASSED, 2 FAILED, 7 PENDING, 1 BLOCKED, 1 SKIPPED)");
  console.log("  6 attachments");
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
