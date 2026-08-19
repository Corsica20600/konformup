import { describe, expect, it } from "vitest";
import { canSendAttendanceMessage, isFinalAttendanceSlot } from "@/lib/attendance-delivery";

const pending = { deliveryStatus: "pending" as const, responseStatus: "pending" as const, trainerOverrideStatus: null, deliverySentAt: null };

describe("attendance delivery safeguards", () => {
  it("sends a missing request once and never creates another token", () => {
    expect(canSendAttendanceMessage(pending, { reminder: false })).toBe(true);
    expect(canSendAttendanceMessage({ ...pending, deliveryStatus: "sent" }, { reminder: false })).toBe(false);
  });
  it("limits reminders to sent pending responses after four hours", () => {
    const now = Date.parse("2026-08-19T12:00:00.000Z");
    expect(canSendAttendanceMessage({ ...pending, deliveryStatus: "sent", deliverySentAt: "2026-08-19T09:00:01.000Z" }, { reminder: true, minimumHoursSinceLastSend: 4 }, now)).toBe(false);
    expect(canSendAttendanceMessage({ ...pending, deliveryStatus: "sent", deliverySentAt: "2026-08-19T07:59:59.000Z" }, { reminder: true, minimumHoursSinceLastSend: 4 }, now)).toBe(true);
  });
  it("does not remind signed, absent or manually treated candidates", () => {
    for (const responseStatus of ["present", "absent", "issue"] as const) expect(canSendAttendanceMessage({ ...pending, deliveryStatus: "sent", responseStatus }, { reminder: true })).toBe(false);
    expect(canSendAttendanceMessage({ ...pending, deliveryStatus: "sent", trainerOverrideStatus: "present" }, { reminder: true })).toBe(false);
  });
  it("identifies the real final slot from date and end time", () => {
    const slots = [{ id: "morning", slotDate: "2026-08-20", endsAt: "2026-08-20T10:00:00Z", createdAt: "1" }, { id: "afternoon", slotDate: "2026-08-20", endsAt: "2026-08-20T16:00:00Z", createdAt: "1" }];
    expect(isFinalAttendanceSlot(slots, "morning")).toBe(false);
    expect(isFinalAttendanceSlot(slots, "afternoon")).toBe(true);
  });
});
