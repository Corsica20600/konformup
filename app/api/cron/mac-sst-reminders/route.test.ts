import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { getMacSstReminderDiagnostic, runMacSstReminderCron } from "@/lib/mac-sst-reminders";

vi.mock("@/lib/mac-sst-reminders", () => ({
  getMacSstReminderDiagnostic: vi.fn(),
  runMacSstReminderCron: vi.fn(),
  isMacSstRemindersEnabled: () => process.env.MAC_SST_REMINDERS_ENABLED?.trim().toLowerCase() === "true"
}));

describe("MAC SST reminders cron route", () => {
  const originalSecret = process.env.CRON_SECRET;
  const originalEnabled = process.env.MAC_SST_REMINDERS_ENABLED;

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
    process.env.MAC_SST_REMINDERS_ENABLED = originalEnabled;
    vi.mocked(runMacSstReminderCron).mockReset();
    vi.mocked(getMacSstReminderDiagnostic).mockReset();
  });

  it("returns disabled without writing or sending when the kill switch is absent or false", async () => {
    process.env.CRON_SECRET = "test-secret";
    delete process.env.MAC_SST_REMINDERS_ENABLED;
    const response = await GET(new Request("https://example.test/api/cron/mac-sst-reminders", { headers: { authorization: "Bearer test-secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, status: "disabled" });
    expect(runMacSstReminderCron).not.toHaveBeenCalled();
    expect(getMacSstReminderDiagnostic).not.toHaveBeenCalled();
  });

  it("runs the read-only diagnostic through the protected route even while delivery is disabled", async () => {
    process.env.CRON_SECRET = "test-secret";
    process.env.MAC_SST_REMINDERS_ENABLED = "false";
    vi.mocked(getMacSstReminderDiagnostic).mockResolvedValue({ eligibleMonth22: 2, eligibleMonth23: 1, identityMissing: 3, sharedEmailBlocked: 4, noEmail: 5, alreadySent: 6, renewedByNewerMac: 7 });
    const response = await GET(new Request("https://example.test/api/cron/mac-sst-reminders?diagnostic=true", { headers: { authorization: "Bearer test-secret" } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, mode: "diagnostic", eligibleMonth22: 2, eligibleMonth23: 1, identityMissing: 3, sharedEmailBlocked: 4, noEmail: 5, alreadySent: 6, renewedByNewerMac: 7 });
    expect(runMacSstReminderCron).not.toHaveBeenCalled();
  });

  it("requires the cron secret before revealing aggregate diagnostic counts", async () => {
    process.env.CRON_SECRET = "test-secret";
    const response = await GET(new Request("https://example.test/api/cron/mac-sst-reminders?diagnostic=true"));
    expect(response.status).toBe(401);
    expect(getMacSstReminderDiagnostic).not.toHaveBeenCalled();
  });
});
