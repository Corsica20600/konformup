import { NextResponse } from "next/server";
import { sendAutomaticAttendanceReminders } from "@/lib/attendance";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();
  const userAgent = request.headers.get("user-agent") ?? "";

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  if (userAgent.toLowerCase().includes("vercel-cron")) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendAutomaticAttendanceReminders({
      minimumHoursSinceLastSend: 4
    });

    return NextResponse.json({
      ok: true,
      ...result
    });
  } catch (error) {
    console.error("[attendance cron] reminder failed", {
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
