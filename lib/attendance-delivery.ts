export type AttendanceDeliveryCandidate = {
  deliveryStatus: "pending" | "sent" | "failed";
  responseStatus: "pending" | "present" | "absent" | "issue";
  trainerOverrideStatus: "pending" | "present" | "absent" | "issue" | null;
  deliverySentAt: string | null;
};

export function canSendAttendanceMessage(candidate: AttendanceDeliveryCandidate, options: { reminder: boolean; minimumHoursSinceLastSend?: number }, now = Date.now()) {
  const effectiveStatus = candidate.trainerOverrideStatus ?? candidate.responseStatus;
  if (effectiveStatus !== "pending") return false;
  if (options.reminder && candidate.deliveryStatus !== "sent") return false;
  if (!options.reminder && candidate.deliveryStatus === "sent") return false;
  if (options.minimumHoursSinceLastSend && candidate.deliverySentAt) {
    const elapsed = now - new Date(candidate.deliverySentAt).getTime();
    if (elapsed < options.minimumHoursSinceLastSend * 60 * 60 * 1000) return false;
  }
  return true;
}

export function isFinalAttendanceSlot<T extends { slotDate: string; endsAt: string | null; createdAt: string; id: string }>(slots: T[], slotId: string) {
  const latest = [...slots].sort((left, right) => `${right.slotDate}|${right.endsAt ?? ""}|${right.createdAt}`.localeCompare(`${left.slotDate}|${left.endsAt ?? ""}|${left.createdAt}`))[0];
  return latest?.id === slotId;
}
