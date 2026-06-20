/**
 * Database seed for SafeMeds.
 *
 * Creates the three login roles plus demo data so every dashboard shows content.
 * Idempotent: users are upserted by username; demo content is only created the
 * first time (guarded on the medications table being empty).
 *
 * Run with:  npm run db:seed
 *
 * Demo credentials (also printed at the end):
 *   Admin     -> username: admin     password: Admin@123
 *   Client    -> username: client    password: Client@123
 *   Pharmacy  -> email: pharmacy@safemeds.app  password: Pharma@123  license: PH-1234567
 */
const { PrismaClient } = require("../src/lib/prisma-client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function hash(pw) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  console.log("Seeding database...");

  // --- Users (the three roles) ----------------------------------------------
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: { isVerified: true },
    create: {
      username: "admin",
      email: "admin@safemeds.app",
      passwordHash: await hash("Admin@123"),
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isVerified: true,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  const client = await prisma.user.upsert({
    where: { username: "client" },
    update: { isVerified: true },
    create: {
      username: "client",
      email: "client@safemeds.app",
      passwordHash: await hash("Client@123"),
      firstName: "Demo",
      lastName: "Client",
      role: "CLIENT",
      phone: "+233200000001",
      isVerified: true,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  const pharmacy = await prisma.user.upsert({
    where: { username: "pharmacy" },
    update: { isVerified: true, licenseNumber: "PH-1234567" },
    create: {
      username: "pharmacy",
      email: "pharmacy@safemeds.app",
      passwordHash: await hash("Pharma@123"),
      firstName: "Demo",
      lastName: "Pharmacist",
      role: "PHARMACY",
      pharmacyName: "SafeMeds Campus Pharmacy",
      licenseNumber: "PH-1234567",
      phone: "+233200000002",
      address: "1 University Ave",
      city: "Kumasi",
      state: "Ashanti",
      zipCode: "00233",
      isVerified: true,
      termsAcceptedAt: new Date(),
      termsVersion: "1.0",
    },
  });

  console.log("Users ready: admin, client, pharmacy");

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
      licenseNumber: "PH-1234567",
      licenseType: "Pharmacist",
      issuingBody: "Pharmacy Council of Ghana",
      verified: false,
    },
  });

  console.log("Notifications, contact messages, and license verification created.");
  console.log("\nSeed complete. Login with:");
  console.log("  Admin    -> username: admin    | password: Admin@123");
  console.log("  Client   -> username: client   | password: Client@123");
  console.log("  Pharmacy -> email: pharmacy@safemeds.app | password: Pharma@123 | license: PH-1234567");
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
