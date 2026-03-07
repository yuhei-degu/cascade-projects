/**
 * テスト: スコアラベル・色・ユーティリティ関数
 */
import {
  STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, BUDGET_LABELS,
  type RequestStatus, type RequestCategory, type BudgetRange,
} from "@/types";

describe("STATUS_LABELS", () => {
  const statuses: RequestStatus[] = [
    "pending","reviewing","rejected","accepted","building",
    "review_ready","revision","payment_pending","paid","delivered",
  ];

  it("すべてのステータスに日本語ラベルが存在する", () => {
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeDefined();
      expect(typeof STATUS_LABELS[s]).toBe("string");
      expect(STATUS_LABELS[s].length).toBeGreaterThan(0);
    }
  });

  it("すべてのステータスに色クラスが存在する", () => {
    for (const s of statuses) {
      expect(STATUS_COLORS[s]).toBeDefined();
      expect(STATUS_COLORS[s]).toContain("bg-");
    }
  });
});

describe("CATEGORY_LABELS", () => {
  const categories: RequestCategory[] = [
    "website","webapp","script","design","consultation","other",
  ];

  it("すべてのカテゴリに日本語ラベルが存在する", () => {
    for (const c of categories) {
      expect(CATEGORY_LABELS[c]).toBeDefined();
      expect(typeof CATEGORY_LABELS[c]).toBe("string");
    }
  });
});

describe("BUDGET_LABELS", () => {
  const budgets: BudgetRange[] = [
    "under_5k","under_10k","under_30k","under_50k","negotiable",
  ];

  it("すべての予算レンジに日本語ラベルが存在する", () => {
    for (const b of budgets) {
      expect(BUDGET_LABELS[b]).toBeDefined();
      expect(BUDGET_LABELS[b]).toContain("¥");
    }
  });

  it("negotiableは¥を含まないか要相談を含む", () => {
    expect(BUDGET_LABELS["negotiable"]).toContain("相談");
  });
});
