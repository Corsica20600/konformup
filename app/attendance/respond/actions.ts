"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { confirmAttendanceResponse } from "@/lib/attendance";

export async function confirmAttendanceResponseFormAction(formData: FormData) {
  const token = formData.get("token")?.toString().trim();
  const responseStatus = formData.get("responseStatus")?.toString().trim();

  if (!token) {
    redirect("/attendance/respond");
  }

  if (responseStatus !== "present" && responseStatus !== "absent" && responseStatus !== "issue") {
    redirect(`/attendance/respond?token=${encodeURIComponent(token)}`);
  }

  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0]?.trim() ?? null : null;
  const userAgent = headerStore.get("user-agent");

  try {
    await confirmAttendanceResponse({
      token,
      responseStatus,
      ipAddress,
      userAgent
    });

    redirect(`/attendance/respond?token=${encodeURIComponent(token)}&submitted=1`);
  } catch (error) {
    console.error("[attendance] public confirm failed", {
      token,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    redirect(`/attendance/respond?token=${encodeURIComponent(token)}&error=1`);
  }
}
