/**
 * メール送信 — Resend API
 * 全テンプレートを一元管理
 */

interface MailParams { to: string; subject: string; html: string; }

async function send(p: MailParams) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL ?? "noreply@aidevmarket.dev";
  if (!key) {
    console.log(`📧[DEV] ${p.subject}\nTo: ${p.to}`);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: p.to, subject: p.subject, html: p.html }),
  });
  if (!r.ok) throw new Error(`Resend: ${await r.text()}`);
}

const wrap = (body: string) => `
<div style="font-family:-apple-system,sans-serif;max-width:580px;margin:0 auto;background:#fff">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:22px">⚡ AI Dev Market</h1>
    <p style="color:rgba(255,255,255,.75);margin:4px 0 0;font-size:13px">AIで作る小規模開発サービス</p>
  </div>
  <div style="padding:28px">${body}</div>
  <div style="background:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px">
    ご不明点: <a href="mailto:support@aidevmarket.dev">support@aidevmarket.dev</a>
  </div>
</div>`;

/** C判定 — お断りメール */
export async function sendRejectionMail(to: string, title: string, concerns: string[]) {
  await send({
    to, subject: "【AI Dev Market】ご依頼について（対応が難しいご連絡）",
    html: wrap(`
      <p>この度はご依頼いただきありがとうございます。</p>
      <p>「<strong>${title}</strong>」についてAI審査を行いましたが、
      現時点での対応が難しいと判断いたしました。</p>
      <h3 style="color:#ef4444">主な理由</h3>
      <ul style="color:#374151">${concerns.map(c=>`<li>${c}</li>`).join("")}</ul>
      <p>要件を調整した上で再度ご依頼いただければ、改めて審査いたします。<br>
      ご検討いただきありがとうございました。</p>`),
  });
}

/** A/B判定 — プロトタイプ確認メール */
export async function sendPrototypeMail(
  to: string, title: string, previewUrl: string, verdict: "A" | "B", conditions?: string
) {
  const badge = verdict === "A"
    ? `<div style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:12px;color:#065f46">✅ <strong>作成可能です！</strong></div>`
    : `<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;color:#78350f">⚠️ <strong>条件付きで対応可能です</strong>${conditions ? `<br><small>${conditions}</small>` : ""}</div>`;
  await send({
    to, subject: `【AI Dev Market】試作プロトタイプができました — ${title}`,
    html: wrap(`
      <p>お待たせしました！「<strong>${title}</strong>」の試作版が完成しました。</p>
      ${badge}
      <p style="margin-top:16px">下のボタンから試作版をご確認ください：</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${previewUrl}" style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
          🔍 試作版を確認する
        </a>
      </div>
      <p style="color:#6b7280;font-size:13px">「OK」ならそのまま決済へ。「修正希望」もページ上から送れます。</p>`),
  });
}

/** 決済依頼メール */
export async function sendPaymentMail(
  to: string, title: string, payUrl: string, amount: number
) {
  await send({
    to, subject: `【AI Dev Market】お支払いのご案内 — ${title}`,
    html: wrap(`
      <p>「<strong>${title}</strong>」のご発注ありがとうございます！</p>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px;text-align:center;font-size:28px;font-weight:bold;color:#166534">
        ¥${amount.toLocaleString()}
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${payUrl}" style="background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
          💳 今すぐ支払う
        </a>
      </div>
      <p style="font-size:13px;color:#6b7280">Stripeの安全な決済ページに移動します。お支払い確認後、開発を開始します。</p>`),
  });
}

/** 開発開始通知 */
export async function sendStartMail(to: string, title: string, days: number) {
  await send({
    to, subject: `【AI Dev Market】開発を開始しました — ${title}`,
    html: wrap(`
      <p>お支払いを確認しました！「<strong>${title}</strong>」の開発を開始します。</p>
      <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:8px;padding:16px">
        <p style="margin:0;color:#4c1d95">⚡ 開発中<br>
        <strong>目安完成期間: ${days}日以内</strong></p>
      </div>
      <p>完成しましたら改めてご連絡します。チャットでいつでもご質問いただけます。</p>`),
  });
}

/** 納品完了メール */
export async function sendDeliveryMail(
  to: string, title: string, deliverUrl: string, note?: string
) {
  await send({
    to, subject: `【AI Dev Market】納品完了のお知らせ 🎉 — ${title}`,
    html: wrap(`
      <p>「<strong>${title}</strong>」が完成しました！🎉</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${deliverUrl}" style="background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold">
          📦 成果物を受け取る
        </a>
      </div>
      ${note ? `<div style="background:#f8fafc;border-radius:8px;padding:16px;font-size:14px;color:#374151">${note}</div>` : ""}
      <p style="margin-top:16px">修正が必要な場合は無料対応（1回）でチャットからご依頼ください。</p>
      <p>ご利用ありがとうございました！</p>`),
  });
}

/** 修正依頼受付メール */
export async function sendRevisionMail(to: string, title: string, comment: string) {
  await send({
    to, subject: `【AI Dev Market】修正内容を承りました — ${title}`,
    html: wrap(`
      <p>「<strong>${title}</strong>」の修正依頼を承りました。</p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px">
        <p style="margin:0;color:#7c2d12"><strong>修正内容：</strong><br>${comment}</p>
      </div>
      <p style="margin-top:16px">修正完了後、再度確認URLをお送りします。しばらくお待ちください。</p>`),
  });
}
