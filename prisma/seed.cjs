/**
 * Database seed for SafeMeds.
 *
 * Creates the four login roles plus demo data so every dashboard shows content.
 * Idempotent: users are upserted by username; demo content is only created the
 * first time (guarded on the medications table being empty).
 *
 * Run with:  npm run db:seed
 *
 * PASSWORDS COME FROM THE ENVIRONMENT:
 *
 *   SEED_ADMIN_PASSWORD     SEED_CLIENT_PASSWORD
 *   SEED_COURIER_PASSWORD   SEED_PHARMACY_PASSWORD
 *   SEED_PHARMACY_LICENSE   (optional, defaults to the demo license)
 *
 * Against a local database, any of these left unset falls back to a well-known
 * development password and the seed says so loudly. Against a remote database
 * it refuses to run instead, because this file is committed to a public
 * repository: hardcoded defaults on a live deployment would publish a working
 * admin login to anyone who opens the repo. Local convenience is worth a weak
 * default; a public site is not.
 *
 * Every seeded account is created email-verified. Sign-in rejects any account
 * with a null emailVerifiedAt (see src/app/auth.ts), and the backfill in the
 * 20260813210000_email_verification migration only reached rows that already
 * existed when it ran — so without this, a freshly seeded database would hand
 * out four accounts that all fail login with EMAIL_NOT_VERIFIED.
 */
const { PrismaClient } = require("../src/lib/prisma-client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function hash(pw) {
  return bcrypt.hash(pw, 12);
}

// Applied to both create and update so re-seeding an older database that
// predates the verification requirement also repairs those accounts.
const VERIFIED = { isVerified: true, emailVerifiedAt: new Date() };

// --- Credentials -----------------------------------------------------------

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1", "host.docker.internal"];

/**
 * Whether DATABASE_URL points somewhere only this machine can reach. Used to
 * decide if a weak fallback password is acceptable. Anything unparseable is
 * treated as remote — failing closed is the safe direction here.
 */
function targetIsLocal() {
  const url = process.env.DATABASE_URL || "";
  try {
    return LOCAL_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

const ACCOUNTS = [
  { key: "admin", env: "SEED_ADMIN_PASSWORD", devDefault: "Admin@123" },
  { key: "client", env: "SEED_CLIENT_PASSWORD", devDefault: "Client@123" },
  { key: "courier", env: "SEED_COURIER_PASSWORD", devDefault: "Courier@123" },
  { key: "pharmacy", env: "SEED_PHARMACY_PASSWORD", devDefault: "Pharma@123" },
];

/**
 * Resolves each account's password, returning both the value and whether it
 * came from the environment — the summary at the end prints the password only
 * when it is the public development default, so a real one never lands in a
 * terminal scrollback or a CI log.
 */
function resolveCredentials() {
  const isLocal = targetIsLocal();
  const resolved = {};
  const missing = [];
  const tooShort = [];

  for (const { key, env, devDefault } of ACCOUNTS) {
    const supplied = process.env[env];
    if (supplied) {
      // Matches the signup policy in src/app/api/auth/signup/route.ts, so a
      // seeded account can never be one the app itself would have rejected.
      if (supplied.length < 8) tooShort.push(env);
      resolved[key] = { password: supplied, fromEnv: true };
    } else {
      missing.push(env);
      resolved[key] = { password: devDefault, fromEnv: false };
    }
  }

  if (tooShort.length) {
    throw new Error(
      `These seed passwords are shorter than 8 characters: ${tooShort.join(", ")}.`
    );
  }

  if (missing.length && !isLocal) {
    throw new Error(
      "Refusing to seed a non-local database with development passwords.\n" +
        `  Unset: ${missing.join(", ")}\n` +
        "  These defaults are committed to a public repository, so seeding them\n" +
        "  onto a live deployment would publish a working admin login.\n" +
        "  Set the variables above and run again."
    );
  }

  if (missing.length) {
    console.warn(
      `\n  WARNING: using development passwords for ${missing.length} account(s).` +
        "\n  Fine for localhost. Never for a deployed database.\n"
    );
  }

  return resolved;
}

const CREDENTIALS = resolveCredentials();
const PHARMACY_LICENSE = process.env.SEED_PHARMACY_LICENSE || "PH-1234567";

/**
 * What to print for an account's password in the closing summary. A supplied
 * password is named, never echoed: this output routinely ends up in terminal
 * scrollback and CI logs. The development defaults are already public, so
 * printing those costs nothing and keeps local onboarding a copy-paste.
 */
function shown(key) {
  const { password, fromEnv } = CREDENTIALS[key];
  const envVar = ACCOUNTS.find((a) => a.key === key).env;
  return fromEnv ? `(from ${envVar})` : password;
}

async function main() {
  console.log("Seeding database...");

  // Hashed once and applied to both create and update, so re-running the seed
  // after changing a SEED_*_PASSWORD actually rotates the existing account
  // rather than silently leaving the old password in place.
  const hashes = {
    admin: await hash(CREDENTIALS.admin.password),
    client: await hash(CREDENTIALS.client.password),
    courier: await hash(CREDENTIALS.courier.password),
    pharmacy: await hash(CREDENTIALS.pharmacy.password),
  };

  // --- Users (the four roles) -----------------------------------------------
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { ...VERIFIED, passwordHash: hashes.admin },
    create: {
      username: "admin",
      email: "admin@safemeds.app",
      passwordHash: hashes.admin,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      ...VERIFIED,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  const client = await prisma.user.upsert({
    where: { username: "client" },
    update: { ...VERIFIED, passwordHash: hashes.client },
    create: {
      username: "client",
      email: "client@safemeds.app",
      passwordHash: hashes.client,
      firstName: "Demo",
      lastName: "Client",
      role: "CLIENT",
      phone: "+233200000001",
      ...VERIFIED,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  const pharmacy = await prisma.user.upsert({
    where: { username: "pharmacy" },
    update: { ...VERIFIED, licenseNumber: PHARMACY_LICENSE, passwordHash: hashes.pharmacy },
    create: {
      username: "pharmacy",
      email: "pharmacy@safemeds.app",
      passwordHash: hashes.pharmacy,
      firstName: "Demo",
      lastName: "Pharmacist",
      role: "PHARMACY",
      pharmacyName: "SafeMeds Campus Pharmacy",
      licenseNumber: PHARMACY_LICENSE,
      phone: "+233200000002",
      address: "1 University Ave",
      city: "Kumasi",
      state: "Ashanti",
      zipCode: "00233",
      ...VERIFIED,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  // Couriers sign in with a username, same as students and admins. The phone
  // number is not decorative: signup requires one for this role, because
  // dispatch contacts the courier directly when a delivery needs attention.
  await prisma.user.upsert({
    where: { username: "courier" },
    update: { ...VERIFIED, passwordHash: hashes.courier },
    create: {
      username: "courier",
      email: "courier@safemeds.app",
      passwordHash: hashes.courier,
      firstName: "Demo",
      lastName: "Courier",
      role: "COURIER",
      phone: "+233200000003",
      ...VERIFIED,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  console.log("Users ready: admin, client, pharmacy, courier");

  // --- Demo content (only seed once) ----------------------------------------
  const medCount = await prisma.medication.count();
  if (medCount > 0) {
    console.log("Demo content already present — skipping content seed.");
    return;
  }

  // Medications
  const medData = [
    { name: "Paracetamol", genericName: "Acetaminophen", dosageForm: "Tablet", strength: "500mg", manufacturer: "Generic Pharma", isPrescription: false, price: 5.0, description: "Pain reliever and fever reducer." },
    { name: "Ibuprofen", genericName: "Ibuprofen", dosageForm: "Tablet", strength: "200mg", manufacturer: "Generic Pharma", isPrescription: false, price: 7.5, description: "NSAID for pain and inflammation." },
    { name: "Amoxicillin", genericName: "Amoxicillin", dosageForm: "Capsule", strength: "250mg", manufacturer: "MediCorp", isPrescription: true, price: 18.0, description: "Antibiotic for bacterial infections." },
    { name: "Cetirizine", genericName: "Cetirizine", dosageForm: "Tablet", strength: "10mg", manufacturer: "AllerCare", isPrescription: false, price: 6.0, description: "Antihistamine for allergies." },
    { name: "Metformin", genericName: "Metformin", dosageForm: "Tablet", strength: "500mg", manufacturer: "DiaHealth", isPrescription: true, price: 12.0, description: "Type 2 diabetes management." },
  ];
  const meds = [];
  for (const m of medData) {
    meds.push(await prisma.medication.create({ data: m }));
  }
  console.log(`Medications created: ${meds.length}`);

  // Inventory for the pharmacy
  for (const m of meds) {
    await prisma.inventoryItem.create({
      data: {
        medicationId: m.id,
        pharmacyId: pharmacy.id,
        quantity: Math.floor(Math.random() * 200) + 20,
        minQuantity: 10,
        maxQuantity: 500,
        location: "Aisle A",
      },
    });
  }
  console.log("Inventory stocked for pharmacy.");

  // Consultations
  const consult1 = await prisma.consultation.create({
    data: {
      userId: client.id,
      type: "general",
      status: "PENDING",
      description: "Persistent headache for 3 days.",
      symptoms: "Headache, mild fever",
      age: 21,
      gender: "female",
      assignedPharmacistId: pharmacy.id,
    },
  });
  await prisma.consultation.create({
    data: {
      type: "general",
      status: "IN_PROGRESS",
      description: "Anonymous allergy question.",
      symptoms: "Sneezing, itchy eyes",
      isAnonymous: true,
      anonymousId: "anon-demo-001",
      assignedPharmacistId: pharmacy.id,
    },
  });
  console.log("Consultations created.");

  // Prescription + Order + Delivery chain
  const prescription = await prisma.prescription.create({
    data: {
      consultationId: consult1.id,
      userId: client.id,
      medicationId: meds[0].id,
      prescribedBy: `${pharmacy.firstName} ${pharmacy.lastName}`,
      dosage: "500mg",
      frequency: "Twice daily",
      duration: "5 days",
      quantity: 10,
      refills: 1,
      instructions: "Take after meals.",
      status: "APPROVED",
    },
  });

  const order = await prisma.order.create({
    data: {
      prescriptionId: prescription.id,
      userId: client.id,
      orderNumber: "ORD-" + Date.now(),
      status: "PROCESSING",
      totalAmount: 25.0,
      paymentStatus: "PAID",
      paymentMethod: "card",
    },
  });

  await prisma.delivery.create({
    data: {
      orderId: order.id,
      userId: client.id,
      status: "IN_TRANSIT",
      trackingNumber: "TRK-" + Date.now(),
      address: "Hall 3, Room 21",
      city: "Kumasi",
      state: "Ashanti",
      zipCode: "00233",
      packageType: "DISCREET",
      dropPoint: "Main Library Drop Point",
    },
  });
  console.log("Prescription, order, and delivery created.");

  // Notifications
  await prisma.notification.createMany({
    data: [
      { userId: client.id, title: "Order shipped", message: "Your order is on the way.", type: "DELIVERY" },
      { userId: client.id, title: "Consultation update", message: "A pharmacist replied to your consultation.", type: "CONSULTATION" },
      { userId: pharmacy.id, title: "New consultation", message: "A new consultation has been assigned to you.", type: "CONSULTATION" },
    ],
  });

  // Contact messages (admin dashboard)
  await prisma.contactMessage.createMany({
    data: [
      { name: "Jane Mensah", email: "jane@example.com", subject: "Delivery question", message: "How discreet is the packaging?" },
      { name: "Kwame Owusu", email: "kwame@example.com", subject: "Account help", message: "I cannot reset my password." },
    ],
  });

  // Pending license verification (admin dashboard "Licenses" tab)
  await prisma.licenseVerification.upsert({
    where: { userId: pharmacy.id },
    update: {},
    create: {
      userId: pharmacy.id,
      licenseNumber: PHARMACY_LICENSE,
      licenseType: "Pharmacist",
      issuingBody: "Pharmacy Council of Ghana",
      verified: false,
    },
  });

  console.log("Notifications, contact messages, and license verification created.");
  console.log("\nSeed complete. Login with:");
  console.log(`  Admin    -> username: admin    | password: ${shown("admin")}`);
  console.log(`  Client   -> username: client   | password: ${shown("client")}`);
  console.log(`  Courier  -> username: courier  | password: ${shown("courier")}`);
  console.log(
    `  Pharmacy -> email: pharmacy@safemeds.app | password: ${shown("pharmacy")} | license: ${PHARMACY_LICENSE}`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
