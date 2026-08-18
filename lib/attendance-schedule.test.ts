import { describe, expect, it } from "vitest";
import {
  buildParisDateTimeIso,
  getAttendanceSlotTimes,
  isValidAttendanceTimeRange
} from "@/lib/attendance-schedule";

describe("attendance schedule", () => {
  it("propose des horaires distincts pour le matin et l'apres-midi", () => {
    expect(getAttendanceSlotTimes({ startsAt: null, endsAt: null, period: "morning" })).toEqual({
      start: "09:00",
      end: "12:00"
    });
    expect(getAttendanceSlotTimes({ startsAt: null, endsAt: null, period: "afternoon" })).toEqual({
      start: "13:00",
      end: "17:00"
    });
  });

  it("respecte le fuseau de Paris en hiver et en ete", () => {
    expect(buildParisDateTimeIso("2026-01-15", "09:00")).toBe("2026-01-15T08:00:00.000Z");
    expect(buildParisDateTimeIso("2026-07-15", "09:00")).toBe("2026-07-15T07:00:00.000Z");
  });

  it("refuse une fin anterieure ou egale au debut", () => {
    expect(isValidAttendanceTimeRange("09:00", "12:00")).toBe(true);
    expect(isValidAttendanceTimeRange("13:00", "12:00")).toBe(false);
    expect(isValidAttendanceTimeRange("13:00", "13:00")).toBe(false);
  });
});
