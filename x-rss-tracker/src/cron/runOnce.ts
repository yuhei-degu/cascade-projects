/**
 * cron/runOnce.ts
 * RSS取得を1回だけ手動実行するスクリプト
 * 使い方: npm run cron:run
 */
import "dotenv/config";
import { runOnce } from "./scheduler";
import { prisma } from "@/lib/db/client";

async function main(): Promise<void> {
  try {
    await runOnce();
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[RunOnce] Fatal error:", err);
  process.exit(1);
});
