import { NextResponse } from "next/server";
import { getMacSstReminderDiagnostic, isMacSstRemindersEnabled, runMacSstReminderCron } from "@/lib/mac-sst-reminders";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (new URL(request.url).searchParams.get("diagnostic") === "true") {
    try {
      return NextResponse.json({ ok: true, mode: "diagnostic", ...(await getMacSstReminderDiagnostic()) });
    } catch (error) {
      console.error("[mac-sst diagnostic] failed", { message: error instanceof Error ? error.message : "Unknown error" });
      return NextResponse.json({ ok: false, error: "Diagnostic des rappels indisponible." }, { status: 500 });
    }
  }
  if (!isMacSstRemindersEnabled()) return NextResponse.json({ ok: true, status: "disabled" });
  try {
    const result = await runMacSstReminderCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[mac-sst cron] failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ ok: false, error: "Traitement des rappels indisponible." }, { status: 500 });
  }
}
