/**
 * Connectivity check: runs one read against the database and prints a summary.
 * Run with:  node scripts/verify-prisma.cjs   (Prisma CLI-style env load not applied,
 * so DATABASE_URL must be in the environment; npm run db:seed-style invocation works).
 */
const { PrismaClient } = require("../src/lib/prisma-client");
const prisma = new PrismaClient();

async function main() {
  const [users, meds, consults, orders] = await Promise.all([
    prisma.user.count(),
    prisma.medication.count(),
    prisma.consultation.count(),
    prisma.order.count(),
  ]);
  console.log("✅ Connected to Prisma Postgres");
  console.log(`   users=${users} medications=${meds} consultations=${consults} orders=${orders}`);
  const admin = await prisma.user.findUnique({ where: { username: "admin" }, select: { email: true, role: true } });
  console.log(`   admin account: ${admin ? admin.email + " (" + admin.role + ")" : "MISSING"}`);
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error("❌ Connection/read failed:", e.message || e);
    await prisma.$disconnect();
    process.exit(1);
  });
