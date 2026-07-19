import { PrismaClient } from "@generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const seed = async () => {
  const databaseUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    throw new Error("DIRECT_URL environment variable is required for seeding");
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...");

  // Check if an admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { email: "admin@lumiwalls.app" },
  });

  if (existingAdmin) {
    console.log("ℹ️  Admin user already exists, skipping seed.");
    await prisma.$disconnect();
    return;
  }

  // Create an initial admin user
  // Note: Password hashing is handled by BetterAuth on sign-up.
  // This creates a placeholder user record; the actual admin
  // should sign up through the auth flow and be promoted via the admin plugin.
  await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      name: "Admin",
      email: "admin@lumiwalls.app",
      emailVerified: true,
    },
  });

  console.log("✅ Seed completed — admin user created.");
  await prisma.$disconnect();
};

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
