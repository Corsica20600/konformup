import { NextResponse } from "next/server";
import { runMacSstReminderCron } from "@/lib/mac-sst-reminders";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await runMacSstReminderCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[mac-sst cron] failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ ok: false, error: "Traitement des rappels indisponible." }, { status: 500 });
  }
}
