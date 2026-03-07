/**
 * tests/duplicate-check.test.ts
 * DB重複保存テスト（インメモリSQLiteを使用）
 */
import { PrismaClient } from "@prisma/client";

// テスト専用のインメモリDBクライアント
const prisma = new PrismaClient({
  datasources: { db: { url: "file::memory:?cache=shared" } },
  log: [],
});

describe("重複投稿の保存テスト", () => {
  beforeAll(async () => {
    // テーブルを作成（本来はprisma migrate devで行うがテスト用に手動実行）
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "tracked_accounts" (
        "id" TEXT PRIMARY KEY,
        "username" TEXT UNIQUE NOT NULL,
        "displayName" TEXT,
        "isActive" INTEGER DEFAULT 1,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
        "lastFetchAt" DATETIME,
        "fetchError" TEXT
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "posts" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "url" TEXT UNIQUE NOT NULL,
        "publishedAt" DATETIME NOT NULL,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "fetch_logs" (
        "id" TEXT PRIMARY KEY,
        "accountId" TEXT,
        "username" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "newPosts" INTEGER DEFAULT 0,
        "totalPosts" INTEGER DEFAULT 0,
        "errorMsg" TEXT,
        "durationMs" INTEGER,
        "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("同じURLの投稿は重複保存されない (skipDuplicates)", async () => {
    // アカウントを作成
    const acc = await prisma.trackedAccount.create({
      data: { id: "acc-001", username: "testuser" },
    });

    // 1回目の保存
    await prisma.post.createMany({
      data: [
        {
          id: "post-001",
          accountId: acc.id,
          title: "Test Post",
          content: "Content",
          url: "https://x.com/testuser/status/123",
          publishedAt: new Date("2025-01-01"),
        },
      ],
      skipDuplicates: true,
    });

    // 2回目: 同じURL（重複）
    await prisma.post.createMany({
      data: [
        {
          id: "post-002",
          accountId: acc.id,
          title: "Test Post (duplicate)",
          content: "Content",
          url: "https://x.com/testuser/status/123", // 同じURL
          publishedAt: new Date("2025-01-01"),
        },
      ],
      skipDuplicates: true,
    });

    const count = await prisma.post.count({
      where: { url: "https://x.com/testuser/status/123" },
    });

    expect(count).toBe(1); // 重複なし
  });

  test("異なるURLは正常に保存される", async () => {
    const acc = await prisma.trackedAccount.findFirst({
      where: { username: "testuser" },
    });
    if (!acc) throw new Error("acc not found");

    await prisma.post.createMany({
      data: [
        {
          id: "post-003",
          accountId: acc.id,
          title: "Post A",
          content: "A",
          url: "https://x.com/testuser/status/200",
          publishedAt: new Date("2025-01-02"),
        },
        {
          id: "post-004",
          accountId: acc.id,
          title: "Post B",
          content: "B",
          url: "https://x.com/testuser/status/201",
          publishedAt: new Date("2025-01-03"),
        },
      ],
      skipDuplicates: true,
    });

    const count = await prisma.post.count({ where: { accountId: acc.id } });
    expect(count).toBeGreaterThanOrEqual(3); // 1 + 2
  });
});
