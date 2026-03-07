// jest.setup.ts — グローバルセットアップ
// fetch のモック（Node.js 18+ は内蔵 fetch があるが、テスト環境用）
if (!global.fetch) {
  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    })
  );
}
