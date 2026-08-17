import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { sendAutomaticAttendanceReminders } from "@/lib/attendance";

vi.mock("@/lib/attendance", () => ({
  sendAutomaticAttendanceReminders: vi.fn()
}));

describe("attendance reminders cron route", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
    vi.mocked(sendAutomaticAttendanceReminders).mockReset();
  });

  it("refuses requests without CRON_SECRET authorization", async () => {
    process.env.CRON_SECRET = "test-secret";

    const response = await GET(
      new Request("https://example.test/api/cron/attendance-reminders", {
        headers: {
          "user-agent": "vercel-cron/1.0"
        }
      })
    );

    expect(response.status).toBe(401);
    expect(sendAutomaticAttendanceReminders).not.toHaveBeenCalled();
  });

  it("accepts requests with the configured bearer token", async () => {
    process.env.CRON_SECRET = "test-secret";
    vi.mocked(sendAutomaticAttendanceReminders).mockResolvedValue({
      processedSlots: 0,
      sentCount: 0,
      failedCount: 0
    });

    const response = await GET(
      new Request("https://example.test/api/cron/attendance-reminders", {
        headers: {
          authorization: "Bearer test-secret"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(sendAutomaticAttendanceReminders).toHaveBeenCalledWith({
      minimumHoursSinceLastSend: 4
    });
  });
});
