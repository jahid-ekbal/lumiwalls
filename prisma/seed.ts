import prisma from "@/lib/database/dbClient";
import { serverEnv } from "@/lib/env/serverEnv";
import { hash as argon2Hash } from "@node-rs/argon2";
import "dotenv/config";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin@example.com";

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await argon2Hash(ADMIN_PASSWORD, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
    secret: Buffer.from(serverEnv.BETTER_AUTH_SECRET),
  });

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

  // Upsert the credential account so BetterAuth can authenticate
  const existingAccount = await prisma.account.findFirst({
    where: { providerId: "credential", accountId: ADMIN_EMAIL },
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
        accountId: ADMIN_EMAIL,
        password: hashedPassword,
      },
    });
  }

  console.log(`✅ Seeded admin user: ${ADMIN_EMAIL}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
