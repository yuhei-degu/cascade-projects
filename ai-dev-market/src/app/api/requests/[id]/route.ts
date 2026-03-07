/**
 * API: GET/PATCH /api/requests/[id] — 管理者用詳細・操作
 */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { sendDeliveryMail } from "@/lib/email/mailer";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { data, error } = await supabase.from("requests").select(`
    *,
    ai_evaluations(*),
    messages(id,author,content,is_internal,created_at),
    activity_logs(id,action,detail,actor,created_at)
  `).eq("id", params.id).single();

  if (error) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { action, ...payload } = await req.json();
    const { data: request } = await supabase.from("requests").select("*").eq("id", params.id).single();
    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";

    switch (action) {

      case "update_status": {
        await supabase.from("requests").update({ status: payload.status }).eq("id", params.id);
        await supabase.from("activity_logs").insert({
          request_id: params.id, action: "status_changed",
          detail: `→ ${payload.status}`, actor: "admin",
        });
        return NextResponse.json({ success: true });
      }

      case "deliver": {
        await supabase.from("requests").update({
          status: "delivered",
          deliverable_url: payload.deliverableUrl,
          deliverable_note: payload.deliverableNote,
        }).eq("id", params.id);
        await sendDeliveryMail(request.email, request.title, payload.deliverableUrl, payload.deliverableNote);
        await supabase.from("activity_logs").insert({
          request_id: params.id, action: "delivered", detail: payload.deliverableUrl, actor: "admin",
        });
        return NextResponse.json({ success: true });
      }

      case "add_message": {
        await supabase.from("messages").insert({
          request_id: params.id, author: "admin",
          content: payload.content, is_internal: payload.isInternal ?? false,
        });
        return NextResponse.json({ success: true });
      }

      case "rerun_prototype": {
        // プロトタイプ再生成
        fetch(`${base}/api/ai/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: params.id }),
        }).catch(console.error);
        return NextResponse.json({ success: true, message: "再生成を開始しました" });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (e) {
    console.error("PATCH error:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
