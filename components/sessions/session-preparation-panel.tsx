"use client";

import { useActionState } from "react";
import { prepareMissingSessionDocumentsAction, sendMissingSessionDocumentsAction, type ActionState } from "@/app/(dashboard)/sessions/actions";
import { Button } from "@/components/ui/button";
import { ConfirmedSubmitButton } from "@/components/ui/confirmed-submit-button";

const initialState: ActionState = {};

export type PreparationRecipient = { id: string; name: string; email: string | null; status: "missing" | "ready" | "sent" };

export function SessionPreparationPanel({ sessionId, recipients, preparedDocumentCount }: { sessionId: string; recipients: PreparationRecipient[]; preparedDocumentCount: number }) {
  const missingEmailCount = recipients.filter((recipient) => !recipient.email).length;
  const selectableRecipients = recipients.filter((recipient) => recipient.email && recipient.status !== "sent");
  const [prepareState, prepareAction, preparing] = useActionState(prepareMissingSessionDocumentsAction, initialState);
  const [sendState, sendAction, sending] = useActionState(sendMissingSessionDocumentsAction, initialState);
  return <section className="grid gap-4"><div className="grid gap-3 text-sm md:grid-cols-3"><p><strong>{preparedDocumentCount}</strong><br />documents avant formation prêts</p><p><strong>{missingEmailCount}</strong><br />candidat(s) sans email</p><p><strong>{recipients.filter((recipient) => recipient.status === "sent").length}</strong><br />dossier(s) déjà envoyé(s)</p></div><div className="rounded-2xl border border-ink/10 p-4"><p className="font-semibold">Destinataires et état des dossiers</p><form action={sendAction} className="mt-3 grid gap-2"><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="confirmed" value="true" />{recipients.map((recipient) => <label key={recipient.id} className="flex items-center justify-between gap-3 rounded-xl bg-canvas/60 px-3 py-2 text-sm"><span><input className="mr-2" type="checkbox" name="candidateId" value={recipient.id} defaultChecked={Boolean(recipient.email && recipient.status !== "sent")} disabled={!recipient.email || recipient.status === "sent"} />{recipient.name}<span className="ml-2 text-ink/55">{recipient.email || "Email manquant"}</span></span><span>{recipient.status === "sent" ? "Déjà envoyé" : recipient.status === "ready" ? "Prêt à envoyer" : "Documents manquants"}</span></label>)}<ConfirmedSubmitButton disabled={sending || selectableRecipients.length === 0} confirmation={`Envoyer uniquement les documents non envoyés aux destinataires sélectionnés (${selectableRecipients.length} proposé(s)) ?`}>{sending ? "Envoi…" : "Envoyer les documents sélectionnés"}</ConfirmedSubmitButton></form></div><form action={prepareAction}><input type="hidden" name="sessionId" value={sessionId} /><Button type="submit" variant="secondary" disabled={preparing}>{preparing ? "Préparation…" : "Générer les documents manquants"}</Button></form>{prepareState.error ? <p role="alert" className="text-sm text-accent">{prepareState.error}</p> : null}{prepareState.success ? <p role="status" className="text-sm text-pine">{prepareState.success}</p> : null}{sendState.error ? <p role="alert" className="text-sm text-accent">{sendState.error}</p> : null}{sendState.success ? <p role="status" className="text-sm text-pine">{sendState.success}</p> : null}</section>;
}
