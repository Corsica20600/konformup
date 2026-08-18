export type AttendancePeriod = "morning" | "afternoon" | "custom";

const DEFAULT_SLOT_TIMES: Record<AttendancePeriod, { start: string; end: string }> = {
  morning: { start: "09:00", end: "12:00" },
  afternoon: { start: "13:00", end: "17:00" },
  custom: { start: "09:00", end: "17:00" }
};

const PARIS_TIME_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});

const PARIS_DATE_TIME_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

export function isAttendanceTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function getDefaultAttendanceTimes(period: AttendancePeriod) {
  return DEFAULT_SLOT_TIMES[period];
}

function getParisParts(value: Date) {
  return Object.fromEntries(
    PARIS_DATE_TIME_PARTS.formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  ) as Record<"year" | "month" | "day" | "hour" | "minute" | "second", number>;
}

export function buildParisDateTimeIso(slotDate: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate) || !isAttendanceTime(time)) {
    throw new Error("Date ou horaire invalide.");
  }

  const [year, month, day] = slotDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const targetWallClock = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = targetWallClock;

  // Two passes account for the daylight-saving offset at the target instant.
  for (let index = 0; index < 2; index += 1) {
    const parts = getParisParts(new Date(instant));
    const observedWallClock = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    instant += targetWallClock - observedWallClock;
  }

  return new Date(instant).toISOString();
}

export function formatAttendanceTime(value: string | null, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : PARIS_TIME_FORMATTER.format(date);
}

export function getAttendanceSlotTimes({
  startsAt,
  endsAt,
  period
}: {
  startsAt: string | null;
  endsAt: string | null;
  period: AttendancePeriod;
}) {
  const defaults = getDefaultAttendanceTimes(period);

  return {
    start: formatAttendanceTime(startsAt, defaults.start),
    end: formatAttendanceTime(endsAt, defaults.end)
  };
}

export function isValidAttendanceTimeRange(start: string, end: string) {
  return isAttendanceTime(start) && isAttendanceTime(end) && start < end;
}
