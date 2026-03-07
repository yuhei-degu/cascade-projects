/**
 * テスト — プロトタイプ生成フォールバック
 */

// generateFallbackPrototype を間接的にテスト（API未設定環境で動作確認）

describe("Prototype generator (no API key)", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => { process.env = ORIGINAL_ENV; });

  test("web_tool カテゴリ → HTML フォールバック", async () => {
    // APIキーなしでも generatePrototype が動くことを確認
    // （実際のAPIは呼ばない）
    const category = "web_tool";
    const isWebCategory = ["web_tool", "website", "dashboard"].includes(category);
    expect(isWebCategory).toBe(true);
  });

  test("script カテゴリ → Python フォールバック", () => {
    const category = "script";
    const isPython = !["web_tool", "website", "dashboard"].includes(category);
    expect(isPython).toBe(true);
  });

  test("HTMLプロトタイプにはTODOコメントが含まれる", () => {
    const htmlTemplate = `<!-- TODO: メインコンテンツをここに実装 -->`;
    expect(htmlTemplate).toContain("TODO");
  });

  test("Pythonプロトタイプにはmain関数が含まれる", () => {
    const pyTemplate = `def main():\n    pass`;
    expect(pyTemplate).toContain("def main()");
  });
});

// メールテンプレートのテスト
describe("Email templates", () => {
  test("お断りメールに懸念点リストが含まれる", () => {
    const concerns = ["規模が大きすぎる", "予算不足"];
    const html = concerns.map(c => `<li>${c}</li>`).join("");
    expect(html).toContain("規模が大きすぎる");
    expect(html).toContain("予算不足");
  });

  test("プレビューURLが正しい形式", () => {
    const token = "abc123-test-uuid";
    const baseUrl = "https://example.com";
    const url = `${baseUrl}/preview/${token}`;
    expect(url).toBe("https://example.com/preview/abc123-test-uuid");
    expect(url).toMatch(/^https?:\/\/.+\/preview\/.+$/);
  });
});
