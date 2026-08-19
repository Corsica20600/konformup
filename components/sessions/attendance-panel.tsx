import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmedSubmitButton } from "@/components/ui/confirmed-submit-button";
import { getAttendanceOverviewForSession } from "@/lib/attendance";
import { getCandidateSatisfactionSurveys } from "@/lib/queries";
import { getAttendanceSlotTimes } from "@/lib/attendance-schedule";
import type { AttendanceCandidateResponse, SessionCandidate, SessionItem } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  closeAttendanceSlotFormAction,
  closeCompleteAttendanceSlotsFormAction,
  sendMissingAttendanceRequestsFormAction,
  sendPendingAttendanceRemindersFormAction,
  sendAttendanceSlotReminderFormAction,
  sendAttendanceSlotRequestsFormAction,
  setAttendanceResponseOverrideFormAction,
  updateAttendanceSlotScheduleFormAction
} from "@/app/(dashboard)/sessions/actions";

const slotStatus = {
  draft: { label: "Brouillon", tone: "neutral" },
  sent: { label: "Envoyé", tone: "warning" },
  open: { label: "Ouvert", tone: "warning" },
  closed: { label: "Clôturé", tone: "success" }
} as const;

function responsePresentation(response: AttendanceCandidateResponse) {
  const value = response.trainer_override_status ?? response.response_status;
  if (value === "present") return { label: "Présent", tone: "success" as const };
  if (value === "absent") return { label: "Absent", tone: "warning" as const };
  if (value === "issue") return { label: "Problème", tone: "warning" as const };
  return { label: "En attente", tone: "neutral" as const };
}

function AttendancePdfLink({ sessionId, documentUrl }: { sessionId: string; documentUrl?: string | null }) {
  return <Link href={`/api/pdf/attendance/${sessionId}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-pine">{documentUrl ? "Ouvrir la feuille de présence" : "Générer la feuille de présence"}</Link>;
}

export async function AttendancePanel({ session, candidates, documentUrl, feedback }: { session: SessionItem; candidates: SessionCandidate[]; documentUrl?: string | null; feedback?: { success?: string | null; error?: string | null; slotId?: string | null } }) {
  const overview = await getAttendanceOverviewForSession(session, candidates);
  if (!overview.enabled) return <Card><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Émargement</p><h3 className="mt-2 text-2xl font-bold">Émargement numérique indisponible</h3><p className="mt-2 text-sm text-ink/65">Les tables nécessaires ne sont pas disponibles dans cette base.</p></Card>;

  const openSlots = overview.slots.filter((slot) => slot.status !== "closed");
  const missingRequests = overview.slots.reduce((count, slot) => count + slot.responses.filter((response) => response.delivery_status !== "sent").length, 0);
  const pending = overview.slots.reduce((count, slot) => count + slot.pending_count, 0);
  const anomalies = overview.slots.reduce((count, slot) => count + slot.issue_count, 0);
  const surveyEntries = await Promise.all(candidates.map(async (candidate) => {
    try { return [candidate.candidate.id, await getCandidateSatisfactionSurveys(candidate.candidate.id)] as const; } catch { return [candidate.candidate.id, [] as Awaited<ReturnType<typeof getCandidateSatisfactionSurveys>>] as const; }
  }));
  const surveysByCandidate = new Map(surveyEntries);
  const finalSlot = [...overview.slots].sort((left, right) => `${right.slot_date}|${right.ends_at ?? ""}`.localeCompare(`${left.slot_date}|${left.ends_at ?? ""}`))[0] ?? null;

  return <Card>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Émargement</p><h3 className="mt-2 text-2xl font-bold">Tableau de pilotage</h3><p className="mt-2 max-w-2xl text-sm text-ink/65">Les signatures, décisions manuelles et preuves existantes restent inchangées. Les demandes utilisent un lien personnel par candidat et créneau.</p></div><AttendancePdfLink sessionId={session.id} documentUrl={documentUrl} /></div>
    {feedback?.success ? <p role="status" className="mt-4 rounded-2xl bg-pine/10 px-4 py-3 text-sm text-pine">{feedback.success}</p> : null}
    {feedback?.error ? <p role="alert" className="mt-4 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">{feedback.error}</p> : null}
    <details className="mt-6 rounded-2xl border border-ink/10 bg-sand/30 p-4"><summary className="cursor-pointer text-base font-semibold">Gérer les émargements</summary><div className="mt-4 grid gap-3 text-sm md:grid-cols-4"><p><strong>{openSlots.length}</strong> créneau(x) ouvert(s)</p><p><strong>{missingRequests}</strong> demande(s) non envoyée(s)</p><p><strong>{pending}</strong> signature(s) attendue(s)</p><p><strong>{anomalies}</strong> anomalie(s)</p></div><div className="mt-4 flex flex-wrap gap-2"><form action={sendMissingAttendanceRequestsFormAction}><input type="hidden" name="sessionId" value={session.id} /><ConfirmedSubmitButton variant="secondary" disabled={missingRequests === 0} confirmation="Envoyer uniquement les demandes d’émargement manquantes ? Les demandes déjà envoyées ne seront pas renvoyées.">Envoyer les demandes manquantes</ConfirmedSubmitButton></form><form action={sendPendingAttendanceRemindersFormAction}><input type="hidden" name="sessionId" value={session.id} /><ConfirmedSubmitButton variant="secondary" disabled={pending === 0} confirmation="Relancer uniquement les signatures encore en attente, en respectant le délai minimal entre deux envois ?">Relancer les signatures en attente</ConfirmedSubmitButton></form><form action={closeCompleteAttendanceSlotsFormAction}><input type="hidden" name="sessionId" value={session.id} /><ConfirmedSubmitButton disabled={openSlots.length === 0} confirmation="Clôturer uniquement les créneaux complets, sans signature en attente ?">Clôturer les créneaux complets</ConfirmedSubmitButton></form></div><p className="mt-3 text-xs text-ink/60">Les actions sont explicites : aucun affichage de page ne déclenche d’email. La clôture reste confirmée par créneau afin de rendre visibles les anomalies.</p></details>
    <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10"><table className="min-w-[780px] w-full text-left text-sm"><thead className="bg-sand/50 text-xs uppercase tracking-[0.12em] text-ink/60"><tr><th className="px-4 py-3">Créneau</th><th className="px-4 py-3">État</th><th className="px-4 py-3">Signatures</th><th className="px-4 py-3">Attente</th><th className="px-4 py-3">Absences / problèmes</th><th className="px-4 py-3">Envois</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{overview.slots.map((slot) => {
      const times = getAttendanceSlotTimes({ startsAt: slot.starts_at, endsAt: slot.ends_at, period: slot.period }); const status = slotStatus[slot.status]; const recipients = slot.responses.filter((response) => response.delivery_status !== "sent");
      return <tr key={slot.id} className="border-t border-ink/10 align-top"><td className="px-4 py-4"><strong>{slot.slot_label}</strong><br /><span className="text-ink/60">{formatDate(slot.slot_date)} · {times.start}–{times.end}</span></td><td className="px-4 py-4"><Badge tone={status.tone}>{status.label}</Badge></td><td className="px-4 py-4">{slot.present_count}/{slot.total_candidates}</td><td className="px-4 py-4">{slot.pending_count}</td><td className="px-4 py-4">{slot.absent_count} absent(s) · {slot.issue_count} problème(s)</td><td className="px-4 py-4">{slot.delivered_count}/{slot.total_candidates} envoyée(s)</td><td className="px-4 py-4"><div className="flex flex-wrap gap-2"><form action={sendAttendanceSlotRequestsFormAction}><input type="hidden" name="slotId" value={slot.id} /><input type="hidden" name="sessionId" value={session.id} /><ConfirmedSubmitButton variant="secondary" disabled={slot.status === "closed" || recipients.length === 0} confirmation={`Envoyer les demandes manquantes pour ${slot.slot_label} à : ${recipients.map((response) => response.candidate_email || `${response.candidate_name} (email manquant)`).join(", ") || "aucun destinataire"} ?`}>Envoyer les manquantes</ConfirmedSubmitButton></form><form action={sendAttendanceSlotReminderFormAction}><input type="hidden" name="slotId" value={slot.id} /><input type="hidden" name="sessionId" value={session.id} /><ConfirmedSubmitButton variant="secondary" disabled={slot.status === "closed" || slot.pending_count === 0} confirmation={`Relancer uniquement les candidats encore en attente pour ${slot.slot_label} ?`}>Relancer</ConfirmedSubmitButton></form><form action={closeAttendanceSlotFormAction}><input type="hidden" name="slotId" value={slot.id} /><input type="hidden" name="sessionId" value={session.id} /><ConfirmedSubmitButton disabled={slot.status === "closed"} confirmation={slot.pending_count || slot.issue_count ? `Ce créneau comporte ${slot.pending_count} signature(s) en attente et ${slot.issue_count} problème(s). Confirmer la clôture ?` : `Clôturer ${slot.slot_label} ?`}>Clôturer</ConfirmedSubmitButton></form></div></td></tr>;
    })}</tbody></table></div>
    <section className="mt-6 overflow-x-auto rounded-2xl border border-ink/10" aria-label="Matrice des signatures"><div className="border-b border-ink/10 bg-sand/30 px-4 py-3"><h4 className="font-semibold">Matrice des signatures</h4><p className="text-xs text-ink/60">Ouvrez une cellule pour les décisions manuelles ; les coordonnées ne surchargent pas la vue principale.</p></div><table className="min-w-[820px] w-full text-left text-sm"><thead className="text-xs uppercase tracking-[0.12em] text-ink/60"><tr><th className="px-4 py-3">Candidat</th>{overview.slots.map((slot) => <th key={slot.id} className="px-4 py-3">{slot.slot_label}</th>)}<th className="px-4 py-3">Satisfaction</th></tr></thead><tbody>{candidates.map((candidate) => { const finalResponse = finalSlot?.responses.find((response) => response.candidate_id === candidate.candidate.id); const satisfactionStatus = surveysByCandidate.get(candidate.candidate.id)?.length ? "Complété" : !finalResponse ? "À envoyer" : finalResponse.delivery_status !== "sent" ? "À envoyer" : (finalResponse.trainer_override_status ?? finalResponse.response_status) === "pending" ? "Envoyé" : "En attente"; return <tr key={candidate.id} className="border-t border-ink/10"><td className="px-4 py-3 font-semibold">{candidate.candidate.first_name} {candidate.candidate.last_name}</td>{overview.slots.map((slot) => { const response = slot.responses.find((item) => item.candidate_id === candidate.candidate.id); if (!response) return <td key={slot.id} className="px-4 py-3 text-ink/50">—</td>; const presentation = responsePresentation(response); return <td key={slot.id} className="px-4 py-3"><details><summary className="cursor-pointer"><Badge tone={presentation.tone}>{presentation.label}</Badge></summary><div className="mt-3 grid gap-2"><p className="text-xs text-ink/60">Envoi : {response.delivery_status}{response.responded_at ? " · réponse enregistrée" : ""}</p><div className="flex flex-wrap gap-1">{(["present", "absent", "issue"] as const).map((value) => <form key={value} action={setAttendanceResponseOverrideFormAction}><input type="hidden" name="responseId" value={response.id} /><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="overrideStatus" value={value} /><Button type="submit" variant="ghost" className="px-2 py-1 text-xs">{value === "present" ? "Présent" : value === "absent" ? "Absent" : "Problème"}</Button></form>)}{response.trainer_override_status ? <form action={setAttendanceResponseOverrideFormAction}><input type="hidden" name="responseId" value={response.id} /><input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="overrideStatus" value="" /><Button type="submit" variant="secondary" className="px-2 py-1 text-xs">Réinitialiser</Button></form> : null}</div></div></details></td>; })}<td className="px-4 py-3">{satisfactionStatus}</td></tr>; })}</tbody></table></section>
    <details className="mt-6 rounded-2xl border border-ink/10 p-4"><summary className="cursor-pointer font-semibold">Horaires des créneaux</summary><div className="mt-4 grid gap-3">{overview.slots.map((slot) => { const times = getAttendanceSlotTimes({ startsAt: slot.starts_at, endsAt: slot.ends_at, period: slot.period }); return <form key={slot.id} action={updateAttendanceSlotScheduleFormAction} className="flex flex-wrap items-end gap-3"><input type="hidden" name="slotId" value={slot.id} /><input type="hidden" name="sessionId" value={session.id} /><span className="min-w-44 text-sm font-medium">{slot.slot_label}</span><label className="grid gap-1 text-xs">Début<input type="time" name="startTime" defaultValue={times.start} required className="rounded-xl border border-ink/10 px-3 py-2" /></label><label className="grid gap-1 text-xs">Fin<input type="time" name="endTime" defaultValue={times.end} required className="rounded-xl border border-ink/10 px-3 py-2" /></label><Button type="submit" variant="secondary">Enregistrer</Button></form>; })}</div></details>
  </Card>;
}
