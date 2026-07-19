import prisma from "@/lib/database/dbClient";
import "dotenv/config";

const seed = async () => {
  console.log("🌱 Seeding database...");

  // Create or update admin user (idempotent)
  // Note: Password hashing is handled by BetterAuth on sign-up.
  // This creates a placeholder user record; the actual admin
  // should sign up through the auth flow and be promoted via the admin plugin.
  await prisma.user.upsert({
    where: { email: "admin@lumiwalls.app" },
    update: {},
    create: {
      id: crypto.randomUUID(),
      name: "Admin",
      email: "admin@lumiwalls.app",
      emailVerified: true,
    },
  });

  console.log("✅ Seed completed — admin user ensured.");
  await prisma.$disconnect();
};

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
