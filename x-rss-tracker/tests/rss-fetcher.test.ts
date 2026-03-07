/**
 * tests/rss-fetcher.test.ts
 * RSS取得テスト
 */
import { buildRssUrl } from "../src/lib/rss/fetcher";

describe("buildRssUrl()", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test("Nitter形式のURLが組み立てられる", () => {
    process.env.RSS_BRIDGE_BASE_URL = "https://nitter.net";
    expect(buildRssUrl("elonmusk")).toBe("https://nitter.net/elonmusk/rss");
  });

  test("末尾スラッシュがあっても正しく組み立てられる", () => {
    process.env.RSS_BRIDGE_BASE_URL = "https://nitter.net/";
    expect(buildRssUrl("elonmusk")).toBe("https://nitter.net/elonmusk/rss");
  });

  test("rsshub形式のURLが組み立てられる", () => {
    process.env.RSS_BRIDGE_BASE_URL = "https://rsshub.app/twitter/user";
    expect(buildRssUrl("sama")).toBe(
      "https://rsshub.app/twitter/user/sama"
    );
  });

  test("環境変数未設定ならデフォルト(nitter.net)を使う", () => {
    delete process.env.RSS_BRIDGE_BASE_URL;
    expect(buildRssUrl("test")).toBe("https://nitter.net/test/rss");
  });
});
