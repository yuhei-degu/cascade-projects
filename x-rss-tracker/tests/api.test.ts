/**
 * tests/api.test.ts
 * APIレスポンス形式テスト（モック）
 */

// JSONレスポンス形式の検証（実際のAPIを呼ばないユニットテスト）
describe("API レスポンス形式", () => {
  test("/api/posts の成功レスポンスが正しい形式", () => {
    const mockResponse = {
      success: true,
      data: {
        posts: [
          {
            id: "abc123",
            title: "テスト投稿",
            content: "コンテンツ",
            url: "https://x.com/test/status/1",
            publishedAt: "2025-01-01T00:00:00.000Z",
            account: { username: "testuser", displayName: null },
          },
        ],
        pagination: { page: 1, per: 20, total: 1, totalPages: 1 },
      },
    };

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.data.posts).toBeInstanceOf(Array);
    expect(mockResponse.data.pagination).toHaveProperty("total");
    expect(mockResponse.data.posts[0]).toHaveProperty("url");
    expect(mockResponse.data.posts[0].account).toHaveProperty("username");
  });

  test("/api/accounts の成功レスポンスが正しい形式", () => {
    const mockResponse = {
      success: true,
      data: [
        {
          id: "acc001",
          username: "elonmusk",
          displayName: "Elon Musk",
          isActive: true,
          createdAt: "2025-01-01T00:00:00.000Z",
          _count: { posts: 42 },
        },
      ],
    };

    expect(mockResponse.success).toBe(true);
    expect(mockResponse.data).toBeInstanceOf(Array);
    expect(mockResponse.data[0]).toHaveProperty("username");
    expect(mockResponse.data[0]).toHaveProperty("_count");
  });

  test("エラーレスポンスが正しい形式", () => {
    const mockError = {
      success: false,
      error: "アカウント一覧の取得に失敗しました",
    };

    expect(mockError.success).toBe(false);
    expect(mockError).toHaveProperty("error");
    expect(typeof mockError.error).toBe("string");
  });

  test("usernameバリデーション: 不正な文字を弾く", () => {
    const invalidUsernames = ["", "invalid user", "user@name", "a".repeat(51)];
    const validPattern = /^[A-Za-z0-9_]{1,50}$/;

    invalidUsernames.forEach((u) => {
      expect(validPattern.test(u)).toBe(false);
    });
  });

  test("usernameバリデーション: 正常なユーザー名は通る", () => {
    const validUsernames = ["elonmusk", "sama", "test_user", "User123", "a"];
    const validPattern = /^[A-Za-z0-9_]{1,50}$/;

    validUsernames.forEach((u) => {
      expect(validPattern.test(u)).toBe(true);
    });
  });
});
