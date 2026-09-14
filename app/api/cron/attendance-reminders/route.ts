import { NextResponse } from "next/server";
import { sendAutomaticAttendanceReminders } from "@/lib/attendance";
import { runPreTrainingDocumentDeliveryCron } from "@/lib/pre-training-document-deliveries";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [attendance, preTrainingDocuments] = await Promise.all([
      sendAutomaticAttendanceReminders({ minimumHoursSinceLastSend: 4 }),
      runPreTrainingDocumentDeliveryCron()
    ]);

    return NextResponse.json({
      ok: true,
      attendance,
      preTrainingDocuments
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
