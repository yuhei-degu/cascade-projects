/**
 * メール送信サービス — Resend API
 *
 * 全送信パターンをテンプレート化して管理する。
 * Resend が使えない場合は SMTP フォールバック（TODO）。
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/** Resend API でメール送信 */
async function sendEmail({ to, subject, html }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL ?? "noreply@requestforge.dev";

  if (!apiKey) {
    // 開発環境: コンソールに出力
    console.log("📧 [DEV] Email would be sent:", { to, subject });
    console.log(html.replace(/<[^>]*>/g, ""));
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${err}`);
  }
}

// ── メールテンプレート ────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 600px; margin: 0 auto; background: #fff;
`;

function wrapTemplate(content: string): string {
  return `
<div style="${baseStyle}">
  <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⚡ RequestForge</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">何でも作成依頼サービス</p>
  </div>
  <div style="padding: 32px;">
    ${content}
  </div>
  <div style="background: #f9fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px;">
    RequestForge — ご不明点は <a href="mailto:support@requestforge.dev">support@requestforge.dev</a> まで
  </div>
</div>`;
}

/** お断りメール（AI審査不可）*/
export async function sendRejectionEmail(
  to: string,
  title: string,
  concerns: string[]
): Promise<void> {
  const concernList = concerns.map((c) => `<li>${c}</li>`).join("");
  await sendEmail({
    to,
    subject: `【RequestForge】ご依頼の件について（お断り）`,
    html: wrapTemplate(`
      <p>この度はRequestForgeにご依頼いただきありがとうございます。</p>
      <p>お客様のご依頼「<strong>${title}</strong>」について、
      AIシステムによる審査の結果、現時点での対応が難しいと判断いたしました。</p>
      <h3 style="color: #ef4444;">審査結果の理由</h3>
      <ul style="color: #374151;">${concernList}</ul>
      <p>ご要件を調整・追加情報をいただければ、再審査も承ります。
      お気軽に再度ご投稿ください。</p>
      <p>この度はご検討いただきありがとうございました。</p>
    `),
  });
}

/** 受付完了・制作開始通知 */
export async function sendAcceptedEmail(
  to: string,
  title: string,
  estimatedDays: number,
  requestId: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `【RequestForge】ご依頼を受け付けました！`,
    html: wrapTemplate(`
      <p>お客様のご依頼「<strong>${title}</strong>」を承りました！</p>
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #166534;">
          ✅ 制作開始 | 完成後に確認URLをお送りします<br>
          ⏱ 目安: ${estimatedDays}日以内
        </p>
      </div>
      <p>制作が完了しましたら、確認用URLをこのメールアドレスにお送りします。
      今しばらくお待ちください。</p>
      <p style="color: #9ca3af; font-size: 12px;">依頼ID: ${requestId}</p>
    `),
  });
}

/** プレビュー確認依頼メール */
export async function sendPreviewEmail(
  to: string,
  title: string,
  previewUrl: string,
  expiresAt: Date
): Promise<void> {
  const expires = expiresAt.toLocaleDateString("ja-JP");
  await sendEmail({
    to,
    subject: `【RequestForge】成果物が完成しました！ご確認をお願いします`,
    html: wrapTemplate(`
      <p>お待たせしました！「<strong>${title}</strong>」が完成しました🎉</p>
      <p>以下のURLから成果物をご確認ください：</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${previewUrl}" style="
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; padding: 14px 32px; border-radius: 8px;
          text-decoration: none; font-weight: bold; font-size: 16px;
        ">
          ✅ 成果物を確認する
        </a>
      </div>
      <p style="color: #ef4444; font-size: 13px;">
        ⚠️ このリンクの有効期限: ${expires}
      </p>
      <p>「これでOK」「修正が必要」をページ上でお知らせください。</p>
    `),
  });
}

/** 修正承りメール */
export async function sendRevisionEmail(
  to: string,
  title: string,
  comment: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `【RequestForge】修正内容を承りました`,
    html: wrapTemplate(`
      <p>「<strong>${title}</strong>」の修正依頼を受け付けました。</p>
      <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; color: #7c2d12;"><strong>修正内容：</strong><br>${comment}</p>
      </div>
      <p>修正完了後、再度確認URLをお送りします。</p>
    `),
  });
}

/** 決済依頼メール */
export async function sendPaymentRequestEmail(
  to: string,
  title: string,
  paymentUrl: string,
  amount: number
): Promise<void> {
  await sendEmail({
    to,
    subject: `【RequestForge】お支払いのお願い`,
    html: wrapTemplate(`
      <p>「<strong>${title}</strong>」をご承認いただきありがとうございます！</p>
      <p>以下より料金のお支払いをお願いします：</p>
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0; color: #166534; font-size: 24px; font-weight: bold; text-align: center;">
          ¥${amount.toLocaleString()}
        </p>
      </div>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${paymentUrl}" style="
          background: #16a34a; color: white; padding: 14px 32px;
          border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;
        ">
          💳 今すぐ支払う
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280;">Stripe の安全な決済ページに移動します。</p>
    `),
  });
}

/** 納品完了メール */
export async function sendDeliveryEmail(
  to: string,
  title: string,
  deliverableUrl: string,
  note?: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `【RequestForge】納品完了のお知らせ🎉`,
    html: wrapTemplate(`
      <p>お支払いが確認できました！「<strong>${title}</strong>」をお届けします。</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${deliverableUrl}" style="
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white; padding: 14px 32px; border-radius: 8px;
          text-decoration: none; font-weight: bold; font-size: 16px;
        ">
          📦 成果物を受け取る
        </a>
      </div>
      ${note ? `<div style="background: #f8fafc; border-radius: 8px; padding: 16px; color: #374151;">${note}</div>` : ""}
      <p>ご利用ありがとうございました！ご不明点があればお気軽にご連絡ください。</p>
    `),
  });
}
