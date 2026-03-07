/**
 * テスト: メール送信モジュール
 * Resend API をモックして各テンプレートが呼ばれることを検証
 */

// fetch をモック
global.fetch = jest.fn();

// 環境変数をリセット（APIキーなし → コンソール出力モード）
delete process.env.RESEND_API_KEY;

import {
  sendRejectionEmail,
  sendAcceptedEmail,
  sendPreviewEmail,
  sendRevisionEmail,
  sendPaymentRequestEmail,
  sendDeliveryEmail,
} from "@/lib/email/mailer";

// console.log をスパイ（DEV出力確認）
const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

afterEach(() => { jest.clearAllMocks(); });

describe("sendRejectionEmail", () => {
  it("APIキーなし → console.log でお断りメール内容を出力", async () => {
    await sendRejectionEmail("test@example.com", "テストタイトル", ["予算不足", "要件不明"]);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[DEV] Email would be sent:"),
      expect.objectContaining({ to: "test@example.com", subject: expect.stringContaining("お断り") })
    );
  });
});

describe("sendAcceptedEmail", () => {
  it("制作開始通知メールを送信（DEVモード）", async () => {
    await sendAcceptedEmail("user@example.com", "Webアプリ制作", 7, "req_123");
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[DEV]"),
      expect.objectContaining({ subject: expect.stringContaining("受け付けました") })
    );
  });
});

describe("sendPreviewEmail", () => {
  it("プレビューURLを含む確認メールを送信", async () => {
    const exp = new Date("2026-12-31");
    await sendPreviewEmail("user@example.com", "サイト", "https://preview.example.com/xyz", exp);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[DEV]"),
      expect.objectContaining({ subject: expect.stringContaining("完成") })
    );
  });
});

describe("sendDeliveryEmail", () => {
  it("納品完了メールを送信", async () => {
    await sendDeliveryEmail("user@example.com", "サイト", "https://github.com/user/project");
    expect(consoleSpy).toHaveBeenCalled();
  });
});
