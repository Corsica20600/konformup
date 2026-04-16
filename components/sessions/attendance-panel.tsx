import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAttendanceOverviewForSession } from "@/lib/attendance";
import type { SessionCandidate, SessionItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  closeAttendanceSlotFormAction,
  sendAttendanceSlotReminderFormAction,
  sendAttendanceSlotRequestsFormAction,
  setAttendanceResponseOverrideFormAction
} from "@/app/(dashboard)/sessions/actions";

const slotStatusTone = {
  draft: "neutral",
  sent: "warning",
  open: "warning",
  closed: "success"
} as const;

const slotStatusLabel = {
  draft: "Brouillon",
  sent: "Envoye",
  open: "Ouvert",
  closed: "Cloture"
} as const;

export async function AttendancePanel({
  session,
  candidates,
  feedback
}: {
  session: SessionItem;
  candidates: SessionCandidate[];
  feedback?: {
    success?: string | null;
    error?: string | null;
    slotId?: string | null;
  };
}) {
  const overview = await getAttendanceOverviewForSession(session, candidates);
  const targetedSlot = feedback?.slotId ? overview.slots.find((slot) => slot.id === feedback.slotId) ?? null : null;
  const hasContextualError = Boolean(feedback?.error && feedback?.slotId);
  const shouldHideError =
    hasContextualError &&
    Boolean(
      targetedSlot &&
        (targetedSlot.sent_at ||
          targetedSlot.status === "open" ||
          targetedSlot.status === "closed" ||
          targetedSlot.delivered_count > 0 ||
          targetedSlot.responded_count > 0)
    );

  if (!overview.enabled) {
    return (
      <Card>
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Emargement</p>
        <h3 className="mt-2 text-2xl font-bold">Emargement numerique</h3>
        <p className="mt-2 text-sm text-ink/65">
          Le module est pret dans l&apos;application, mais les tables Supabase d&apos;emargement ne sont pas encore
          creees.
        </p>
        <p className="mt-3 text-sm text-ink/65">
          Une fois le SQL ajoute, tu pourras envoyer les demandes de presence par email et suivre les confirmations par
          creneau.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Emargement</p>
          <h3 className="mt-2 text-2xl font-bold">Emargement numerique</h3>
          <p className="mt-2 text-sm text-ink/65">
            Envoi par email d&apos;un lien personnel de confirmation. Le formateur garde ensuite la main sur la cloture
            du creneau.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/api/pdf/attendance/${session.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-sand px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#d8ceb9]"
          >
            Synthese PDF formateur
          </Link>
        </div>
      </div>

      {feedback?.success ? (
        <div className="mt-4 rounded-2xl border border-pine/20 bg-pine/10 px-4 py-3 text-sm text-pine">
          {feedback.success}
        </div>
      ) : null}

      {hasContextualError && feedback?.error && !shouldHideError ? (
        <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
          {feedback.error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {overview.slots.map((slot) => (
          <section key={slot.id} className="rounded-[24px] border border-ink/10 bg-sand/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h4 className="text-lg font-semibold text-ink">{slot.slot_label}</h4>
                  <Badge tone={slotStatusTone[slot.status]}>{slotStatusLabel[slot.status]}</Badge>
                </div>
                <p className="mt-2 text-sm text-ink/65">{formatDate(slot.slot_date)}</p>
                <p className="mt-3 text-sm text-ink/70">
                  {slot.present_count}/{slot.total_candidates} presents confirmes • {slot.pending_count} en attente •{" "}
                  {slot.issue_count} probleme(s)
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={sendAttendanceSlotRequestsFormAction}>
                  <input type="hidden" name="slotId" value={slot.id} />
                  <input type="hidden" name="sessionId" value={session.id} />
                  <Button variant="secondary" type="submit" disabled={!slot.total_candidates}>
                    {slot.sent_at ? "Renvoyer a tous" : "Envoyer les demandes"}
                  </Button>
                </form>
                {slot.sent_at ? (
                  <form action={sendAttendanceSlotReminderFormAction}>
                    <input type="hidden" name="slotId" value={slot.id} />
                    <input type="hidden" name="sessionId" value={session.id} />
                    <Button variant="secondary" type="submit" disabled={!slot.pending_count}>
                      Relancer les en attente
                    </Button>
                  </form>
                ) : null}
                <form action={closeAttendanceSlotFormAction}>
                  <input type="hidden" name="slotId" value={slot.id} />
                  <input type="hidden" name="sessionId" value={session.id} />
                  <Button type="submit" disabled={slot.status === "closed"}>
                    Cloturer le creneau
                  </Button>
                </form>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {slot.responses.map((response) => {
                const effectiveStatus = response.trainer_override_status ?? response.response_status;
                const statusTone =
                  effectiveStatus === "present"
                    ? "success"
                    : effectiveStatus === "pending"
                      ? "neutral"
                      : "warning";
                const statusLabel =
                  effectiveStatus === "present"
                    ? "Present"
                    : effectiveStatus === "absent"
                      ? "Absent"
                      : effectiveStatus === "issue"
                        ? "Probleme"
                        : "En attente";

                return (
                  <div
                    key={response.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{response.candidate_name}</p>
                      <p className="text-xs text-ink/55">
                        {response.candidate_email || "Email manquant"} • Envoi {response.delivery_status}
                      </p>
                      {response.trainer_override_status ? (
                        <p className="mt-1 text-xs font-medium text-pine">
                          Validation manuelle formateur
                          {response.trainer_override_note ? ` • ${response.trainer_override_note}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={statusTone}>{statusLabel}</Badge>
                      <div className="flex flex-wrap justify-end gap-2">
                        <form action={setAttendanceResponseOverrideFormAction}>
                          <input type="hidden" name="responseId" value={response.id} />
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input type="hidden" name="overrideStatus" value="present" />
                          <Button type="submit" variant="ghost" className="px-3 py-1 text-xs">
                            Present
                          </Button>
                        </form>
                        <form action={setAttendanceResponseOverrideFormAction}>
                          <input type="hidden" name="responseId" value={response.id} />
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input type="hidden" name="overrideStatus" value="absent" />
                          <Button type="submit" variant="ghost" className="px-3 py-1 text-xs">
                            Absent
                          </Button>
                        </form>
                        <form action={setAttendanceResponseOverrideFormAction}>
                          <input type="hidden" name="responseId" value={response.id} />
                          <input type="hidden" name="sessionId" value={session.id} />
                          <input type="hidden" name="overrideStatus" value="issue" />
                          <Button type="submit" variant="ghost" className="px-3 py-1 text-xs">
                            Probleme
                          </Button>
                        </form>
                        {response.trainer_override_status ? (
                          <form action={setAttendanceResponseOverrideFormAction}>
                            <input type="hidden" name="responseId" value={response.id} />
                            <input type="hidden" name="sessionId" value={session.id} />
                            <input type="hidden" name="overrideStatus" value="" />
                            <Button type="submit" variant="secondary" className="px-3 py-1 text-xs">
                              Reinitialiser
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}
