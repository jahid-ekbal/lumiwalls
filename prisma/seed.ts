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
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
