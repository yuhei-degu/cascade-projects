/**
 * テスト: /api/requests POST バリデーション
 * NextRequest をモックして Zod バリデーションを検証する
 */
import { POST } from "@/app/api/requests/route";
import { NextRequest } from "next/server";

// Prisma をモック
jest.mock("@/lib/prisma", () => ({
  prisma: {
    request: {
      create: jest.fn().mockResolvedValue({ id: "mock_id_123" }),
    },
    activityLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

// fetch (evaluate API 呼び出し) をモック
global.fetch = jest.fn().mockResolvedValue({ ok: true });

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/requests", () => {
  const validBody = {
    title: "テストWebサイト制作依頼",
    description: "ポートフォリオサイトを作りたいです。シンプルなHTML/CSSで作成してください。",
    category: "website",
    budget: "under_10k",
    email: "test@example.com",
  };

  it("正常なリクエストで 200 を返す", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.requestId).toBe("mock_id_123");
  });

  it("タイトルが短すぎると 400 を返す", async () => {
    const res = await POST(makeRequest({ ...validBody, title: "短い" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain("5文字以上");
  });

  it("メールアドレスが不正だと 400 を返す", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "not-an-email" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("説明が短すぎると 400 を返す", async () => {
    const res = await POST(makeRequest({ ...validBody, description: "短い" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it("不正なカテゴリで 400 を返す", async () => {
    const res = await POST(makeRequest({ ...validBody, category: "invalid_category" }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });
});
