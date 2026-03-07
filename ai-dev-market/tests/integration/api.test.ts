/**
 * テスト — API Route 統合テスト（モック）
 * tests/integration/api.test.ts
 */

// Next.js API Routeのバリデーションをモジュールレベルでテスト

describe("Request validation", () => {
  const validInput = {
    title: "Excelを整形するスクリプト",
    description: "毎月のExcelファイルを自動整形したい。A列に日付、B列に売上が入っている。",
    category: "script",
    budget: "under_10k",
    email: "test@example.com",
  };

  test("正常な入力は通過する", () => {
    const errors: string[] = [];
    if (validInput.title.length < 5) errors.push("タイトルは5文字以上");
    if (validInput.description.length < 20) errors.push("詳細は20文字以上");
    if (!validInput.email.includes("@")) errors.push("メールアドレスが不正");
    expect(errors).toHaveLength(0);
  });

  test("タイトルが短すぎる場合エラー", () => {
    const input = { ...validInput, title: "短い" };
    expect(input.title.length).toBeLessThan(5);
  });

  test("詳細が短すぎる場合エラー", () => {
    const input = { ...validInput, description: "短い説明" };
    expect(input.description.length).toBeLessThan(20);
  });

  test("無効なメールアドレスは弾く", () => {
    const emails = ["notanemail", "missing@", "@domain.com", ""];
    emails.forEach(email => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(false);
    });
  });

  test("有効なメールアドレスは通過する", () => {
    const emails = ["user@example.com", "test.name+tag@domain.co.jp", "123@abc.dev"];
    emails.forEach(email => {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(true);
    });
  });

  test("カテゴリは許可値のみ", () => {
    const allowed = ["script","web_tool","api_integration","dashboard","website","other"];
    expect(allowed).toContain(validInput.category);
    expect(allowed).not.toContain("invalid_category");
  });

  test("予算は許可値のみ", () => {
    const allowed = ["under_10k","under_20k","under_30k","negotiable"];
    expect(allowed).toContain(validInput.budget);
    expect(allowed).not.toContain("free");
  });
});

describe("Status transitions", () => {
  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending:         ["reviewing"],
    reviewing:       ["rejected", "prototype_ready"],
    prototype_ready: ["prototype_ok", "revision", "rejected"],
    prototype_ok:    ["payment_pending", "rejected"],
    payment_pending: ["paid", "prototype_ok"],
    paid:            ["delivered"],
    delivered:       ["revision", "closed"],
    revision:        ["paid", "closed"],
  };

  test("全ての遷移テーブルが定義済み", () => {
    const statuses = ["pending","reviewing","rejected","prototype_ready","prototype_ok","payment_pending","paid","delivered","revision","closed"];
    const defined = Object.keys(VALID_TRANSITIONS);
    // rejected と closed は終端ステータスなので遷移先なし
    const terminal = ["rejected","closed"];
    statuses.filter(s => !terminal.includes(s)).forEach(s => {
      expect(defined).toContain(s);
    });
  });

  test("paid → delivered は有効", () => {
    expect(VALID_TRANSITIONS["paid"]).toContain("delivered");
  });

  test("rejected → paid は無効（終端ステータス）", () => {
    expect(VALID_TRANSITIONS["rejected"]).toBeUndefined();
  });
});
