import { hashPasswordFunction } from "@/lib/argon2";
import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import "dotenv/config";

// Dev-only seed credentials. Override via SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
// for any non-local environment, or remove this seed entirely before deploying
// to production.
const ADMIN_EMAIL = serverEnv.SEED_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = serverEnv.SEED_ADMIN_PASSWORD ?? "admin@example.com";

async function main() {
  console.log("🌱 Seeding database...");

  // Reuse the canonical hashing function from src/lib/argon2.ts so the
  // seeded password is always verifiable by BetterAuth's verify step.
  const hashedPassword = await hashPasswordFunction(ADMIN_PASSWORD);

  // Upsert the admin user
  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "admin", emailVerified: true },
    create: {
      id: crypto.randomUUID(),
      name: "Admin",
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: "admin",
    },
  });

  // Upsert the credential account so BetterAuth can authenticate.
  // Better Auth sets accountId = userId for credential accounts (see its
  // sign-up route), so we mirror that convention here.
  const existingAccount = await prisma.account.findFirst({
    where: { providerId: "credential", userId: user.id },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        providerId: "credential",
        accountId: user.id,
        password: hashedPassword,
      },
    });
  }

  console.log(`✅ Seeded admin user: ${ADMIN_EMAIL}`);

  const categories = [
    {
      name: "Nature",
      slug: "nature",
      description: "Landscapes, forests, oceans",
      icon: "Leaf",
      color: "#22C55E",
    },
    {
      name: "Abstract",
      slug: "abstract",
      description: "Shapes, gradients, fluid",
      icon: "Shapes",
      color: "#A855F7",
    },
    {
      name: "Minimal",
      slug: "minimal",
      description: "Clean, whitespace",
      icon: "Minus",
      color: "#E5E7EB",
    },
    {
      name: "Dark",
      slug: "dark",
      description: "AMOLED, black",
      icon: "Moon",
      color: "#18181B",
    },
    {
      name: "Anime",
      slug: "anime",
      description: "Illustrated, anime",
      icon: "Sparkles",
      color: "#EC4899",
    },
    {
      name: "Cityscape",
      slug: "cityscape",
      description: "Urban, architecture",
      icon: "Building2",
      color: "#64748B",
    },
    {
      name: "Space",
      slug: "space",
      description: "Nebula, stars",
      icon: "Rocket",
      color: "#0EA5E9",
    },
    {
      name: "Technology",
      slug: "technology",
      description: "Cyber, futuristic",
      icon: "Cpu",
      color: "#06B6D4",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log(`✅ Seeded ${categories.length} categories`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
