/**
 * prisma/seed.ts
 * 初期監視アカウントデータの投入
 * 使い方: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const INITIAL_ACCOUNTS = [
  { username: "elonmusk",      displayName: "Elon Musk" },
  { username: "sama",          displayName: "Sam Altman" },
  { username: "demishassabis", displayName: "Demis Hassabis" },
];

async function main() {
  console.log("🌱 シードデータを投入中...");

  for (const acc of INITIAL_ACCOUNTS) {
    const result = await prisma.trackedAccount.upsert({
      where: { username: acc.username },
      update: {},
      create: acc,
    });
    console.log(`✅ @${result.username} (${result.id})`);
  }

  console.log(`✅ ${INITIAL_ACCOUNTS.length}件のアカウントを登録しました`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
