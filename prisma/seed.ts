import "dotenv/config";

import { hashPasswordFunction } from "@/lib/argon2";
import prisma from "@/lib/database/dbClient";
import { z } from "zod";

const seedEnvSchema = z.object({
  SEED_ADMIN_EMAIL: z
    .email({ error: "SEED_ADMIN_EMAIL must be a valid email address" })
    .transform((value) => value.trim().toLowerCase()),
  SEED_ADMIN_PASSWORD: z
    .string({ error: "SEED_ADMIN_PASSWORD is required" })
    .min(16, { error: "SEED_ADMIN_PASSWORD must be at least 16 characters" }),
});

const parsedEnv = seedEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid seed environment:");
  for (const issue of parsedEnv.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const ADMIN_EMAIL = parsedEnv.data.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = parsedEnv.data.SEED_ADMIN_PASSWORD;

const PLACEHOLDER_EMAILS = new Set(["admin@example.com", "you@example.com"]);
const PLACEHOLDER_PASSWORDS = new Set([
  "admin",
  "admin@example.com",
  "changeme",
  "change-me",
  "letmein",
  "password",
  "password123",
  "qwerty",
]);

function assertSecureAdminCredentials(email: string, password: string) {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  const normalizedPassword = password.toLowerCase();

  if (PLACEHOLDER_EMAILS.has(email)) {
    throw new Error(
      "SEED_ADMIN_EMAIL is a placeholder. Set a real admin email.",
    );
  }

  if (
    PLACEHOLDER_PASSWORDS.has(normalizedPassword) ||
    normalizedPassword.startsWith("replace-with") ||
    normalizedPassword.startsWith("your-") ||
    normalizedPassword === email ||
    normalizedPassword === localPart
  ) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is a placeholder or too predictable. Set a unique value.",
    );
  }
}

async function seedAdmin() {
  assertSecureAdminCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);

  // Reuse the canonical hashing function from src/lib/argon2.ts so the
  // seeded password is always verifiable by BetterAuth's verify step.
  const hashedPassword = await hashPasswordFunction(ADMIN_PASSWORD);

  const result = await prisma.$transaction(async (tx) => {
    // Upsert the admin user. Re-running the seed re-asserts the role and
    // clears any ban so the primary admin can always recover access.
    const user = await tx.user.upsert({
      where: { email: ADMIN_EMAIL },
      update: {
        role: "admin",
        emailVerified: true,
        banned: false,
        banReason: null,
        banExpires: null,
      },
      create: {
        id: crypto.randomUUID(),
        name: "Admin",
        email: ADMIN_EMAIL,
        emailVerified: true,
        role: "admin",
        banned: false,
      },
    });

    // Upsert the credential account so BetterAuth can authenticate.
    // Better Auth sets accountId = userId for credential accounts (see its
    // sign-up route), so we mirror that convention here.
    const existingAccount = await tx.account.findFirst({
      where: { providerId: "credential", userId: user.id },
    });

    if (existingAccount) {
      await tx.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword, accountId: user.id },
      });
    } else {
      await tx.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          providerId: "credential",
          accountId: user.id,
          password: hashedPassword,
        },
      });
    }

    // Rotating the password must invalidate any existing admin sessions.
    const revokedSessions = await tx.session.deleteMany({
      where: { userId: user.id },
    });

    return { user, revokedSessions: revokedSessions.count };
  });

  console.log(`✅ Admin ready: ${result.user.email}`);
  console.log("   Role: admin, email verified, password rotated from .env");
  console.log(`   Sessions revoked: ${result.revokedSessions}`);
}

async function seedCategories() {
  const categories = [
    {
      name: "Nature",
      slug: "nature",
      icon: "Leaf",
      color: "#22C55E",
    },
    {
      name: "Abstract",
      slug: "abstract",
      icon: "Shapes",
      color: "#A855F7",
    },
    {
      name: "Minimal",
      slug: "minimal",
      icon: "Minus",
      color: "#E5E7EB",
    },
    {
      name: "Dark",
      slug: "dark",
      icon: "Moon",
      color: "#18181B",
    },
    {
      name: "Anime",
      slug: "anime",
      icon: "Sparkles",
      color: "#EC4899",
    },
    {
      name: "Cityscape",
      slug: "cityscape",
      icon: "Building2",
      color: "#64748B",
    },
    {
      name: "Space",
      slug: "space",
      icon: "Rocket",
      color: "#0EA5E9",
    },
    {
      name: "Technology",
      slug: "technology",
      icon: "Cpu",
      color: "#06B6D4",
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      },
      create: cat,
    });
  }

  console.log(`✅ Seeded ${categories.length} categories`);
}

async function main() {
  console.log("🌱 Seeding database...");
  await seedAdmin();
  await seedCategories();
}

try {
  await main();
} catch (error) {
  console.error(
    "❌ Seed failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
