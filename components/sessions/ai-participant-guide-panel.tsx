"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { prepareAIParticipantGuidesAction, sendAIParticipantGuidesAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import type { AIGuideAttendanceStatus, AIGuideDeliveryHistoryItem } from "@/lib/queries";
import { isAIGuideRecipientEligible } from "@/lib/ai-participant-guide-content";

type Recipient = {
  id: string;
  name: string;
  email: string | null;
  attendance: AIGuideAttendanceStatus;
  document: { id: string; file_url: string | null } | null;
};

const initialState: ActionState = {};

function attendanceLabel(status: AIGuideAttendanceStatus) {
  return ({ present: "Présent à tous les créneaux", absent: "Absent", partial: "Présence partielle", issue: "Anomalie", pending: "En attente", unknown: "Présence non établie" })[status];
}

function deliveryLabel(status: string) {
  return ({ pending: "En attente", processing: "En cours", sent: "Envoyé", skipped: "Ignoré", error: "Échec" } as Record<string, string>)[status] ?? status;
}

export function AIParticipantGuidePanel({ sessionId, sessionTitle, recipients, history, requestId }: {
  sessionId: string;
  sessionTitle: string;
  recipients: Recipient[];
  history: AIGuideDeliveryHistoryItem[];
  requestId: string;
}) {
  const [prepareState, prepareAction, preparing] = useActionState(prepareAIParticipantGuidesAction, initialState);
  const [sendState, sendAction, sending] = useActionState(sendAIParticipantGuidesAction, initialState);
  const selectable = recipients.filter((recipient) => isAIGuideRecipientEligible({ email: recipient.email, attendance: recipient.attendance, hasDocument: Boolean(recipient.document?.file_url) }));
  function confirmSelectedRecipients(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    const selectedIds = new Set(Array.from(form?.querySelectorAll<HTMLInputElement>('input[name="candidateId"]:checked') ?? []).map((input) => input.value));
    const selected = recipients.filter((recipient) => selectedIds.has(recipient.id));
    if (!selected.length) {
      event.preventDefault();
      window.alert("Cochez au moins un destinataire.");
      return;
    }
    const recipientLines = selected.map((recipient) => `${recipient.name} - ${recipient.email}`).join("\n");
    if (!window.confirm(`Confirmer l’envoi ?\nSession : ${sessionTitle}\nFormation : Intelligence artificielle\nCandidats et adresses :\n${recipientLines}\nDocument joint : Livret participant IA (PDF).`)) event.preventDefault();
  }

  return <section className="grid gap-5">
    <div><p className="text-sm uppercase tracking-[0.2em] text-ink/45">Document pédagogique</p><h3 className="mt-1 text-xl font-bold">Livret participant IA</h3><p className="mt-2 text-sm text-ink/65">Le livret est généré à partir du socle commun et des objectifs/contenus de cette formation. Sa préparation ne déclenche aucun email.</p></div>
    <form action={prepareAction}><input type="hidden" name="sessionId" value={sessionId} /><Button type="submit" variant="secondary" disabled={preparing}>{preparing ? "Génération…" : "Générer / actualiser les livrets"}</Button></form>
    {prepareState.error ? <p role="alert" className="text-sm text-accent">{prepareState.error}</p> : null}{prepareState.success ? <p role="status" className="text-sm text-pine">{prepareState.success}</p> : null}
    <div className="grid gap-2"><h4 className="font-semibold">Candidats et documents disponibles</h4>{recipients.map((recipient) => <div key={recipient.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 px-3 py-3 text-sm"><div><p className="font-semibold">{recipient.name}</p><p className="text-ink/60">{recipient.email || "Adresse email manquante"} · {attendanceLabel(recipient.attendance)}</p></div><div className="flex items-center gap-3">{recipient.document?.file_url ? <a className="rounded-full bg-sand px-3 py-2 font-semibold" href={recipient.document.file_url} target="_blank" rel="noreferrer">Prévisualiser / télécharger</a> : <span className="text-ink/50">Livret à générer</span>}</div></div>)}</div>
    <form action={sendAction} className="grid gap-3 rounded-2xl border border-ink/10 bg-sand/20 p-4"><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="confirmed" value="true" /><input type="hidden" name="requestId" value={requestId} /><div><h4 className="font-semibold">Envoyer le livret aux candidats</h4><p className="mt-1 text-xs text-ink/60">Aucun destinataire n’est présélectionné. Seuls les candidats présents à tous les créneaux, avec adresse email et PDF disponible, peuvent être cochés.</p></div>{recipients.map((recipient) => { const eligible = isAIGuideRecipientEligible({ email: recipient.email, attendance: recipient.attendance, hasDocument: Boolean(recipient.document?.file_url) }); return <label key={recipient.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-3 py-2 text-sm"><span><input className="mr-2" type="checkbox" name="candidateId" value={recipient.id} disabled={!eligible || sending} />{recipient.name}<span className="ml-2 text-ink/55">{recipient.email || "Email manquant"}</span></span><span className="text-right text-xs text-ink/60">{eligible ? "Prêt - Livret participant IA PDF" : attendanceLabel(recipient.attendance)}</span></label>; })}<Button type="submit" disabled={sending || !selectable.length} onClick={confirmSelectedRecipients}>{sending ? "Envoi…" : "Envoyer le livret aux candidats cochés"}</Button>{sendState.error ? <p role="alert" className="text-sm text-accent">{sendState.error}</p> : null}{sendState.success ? <p role="status" className="text-sm text-pine">{sendState.success}</p> : null}</form>
    <div className="grid gap-2"><h4 className="font-semibold">Historique des envois</h4>{history.length ? history.map((item) => { const recipient = recipients.find((candidate) => candidate.id === item.candidate_id); return <div key={item.id} className="rounded-xl bg-canvas/70 px-3 py-2 text-sm"><p><strong>{recipient?.name ?? "Candidat"}</strong> · {item.recipient_email} · {deliveryLabel(item.status)}</p><p className="text-xs text-ink/55">{new Date(item.sent_at ?? item.created_at).toLocaleString("fr-FR")} · tentative {item.attempt_count}{item.requested_by ? ` · déclenché par ${item.requested_by}` : ""}{item.technical_error ? ` · ${item.technical_error}` : ""}</p></div>; }) : <p className="text-sm text-ink/60">Aucun envoi manuel enregistré.</p>}</div>
  </section>;
}
