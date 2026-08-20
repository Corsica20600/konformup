"use client";

import { useActionState, useMemo, useState } from "react";
import { linkCandidateMacIdentityAction, mergeMacIdentitiesAction, type MacIdentityActionState } from "@/app/(dashboard)/candidates/actions";
import { isMacIdentitySuggestion, macIdentityOptionLabel, selectableMacIdentities, type MacIdentityOption } from "@/lib/mac-identity-presentation";
import { Button } from "@/components/ui/button";

type Summary = { id: string; status: "active" | "merged"; mergedIntoIdentityId: string | null; verifiedAt: string | null; candidateCount: number; operations: Array<{ id: string; operationType: string; reason: string | null; createdAt: string }>; sessions: Array<{ id: string; title: string; endDate: string; trainingType: string }>; macDueDate: string | null } | null;
const emptyState: MacIdentityActionState = {};
type Props = { candidateId: string; candidateName: string; candidateEmail: string | null; identity: Summary; availableIdentities: MacIdentityOption[]; isAdmin: boolean };

function IdentitySelect({ name, identities, value, onChange, candidate }: { name: string; identities: MacIdentityOption[]; value: string; onChange: (value: string) => void; candidate: { name: string; email: string | null } }) {
  return <select name={name} value={value} onChange={(event) => onChange(event.target.value)} required className="rounded-xl border border-ink/10 bg-white px-3 py-2">
    <option value="" disabled>Choisir précisément l’identité canonique</option>
    {identities.map((item) => <option key={item.id} value={item.id}>{macIdentityOptionLabel(item)}{isMacIdentitySuggestion(item, candidate) ? " — suggestion à vérifier" : ""}</option>)}
  </select>;
}

export function MacIdentityPanel({ candidateId, candidateName, candidateEmail, identity, availableIdentities, isAdmin }: Props) {
  const [linkState, linkAction, linking] = useActionState(linkCandidateMacIdentityAction, emptyState);
  const [mergeState, mergeAction, merging] = useActionState(mergeMacIdentitiesAction, emptyState);
  const [showControls, setShowControls] = useState(false);
  const [search, setSearch] = useState("");
  const [linkIdentityId, setLinkIdentityId] = useState("");
  const [mergeIdentityId, setMergeIdentityId] = useState("");
  const [linkConfirmed, setLinkConfirmed] = useState(false);
  const [mergeConfirmed, setMergeConfirmed] = useState(false);
  const choices = useMemo(() => selectableMacIdentities(availableIdentities, identity?.id ?? null, search), [availableIdentities, identity?.id, search]);
  const selectedLink = choices.find((item) => item.id === linkIdentityId) ?? null;
  const selectedMerge = choices.find((item) => item.id === mergeIdentityId) ?? null;
  const candidate = { name: candidateName, email: candidateEmail };
  const status = identity?.status === "active" && identity.verifiedAt ? "Identité MAC vérifiée" : "Identité MAC à vérifier";
  const resetControls = () => { setShowControls(false); setSearch(""); setLinkIdentityId(""); setMergeIdentityId(""); setLinkConfirmed(false); setMergeConfirmed(false); };
  return <section className="grid gap-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{status}</p>{identity ? <span className="text-xs text-ink/55">{identity.candidateCount} dossier(s) rattaché(s)</span> : null}</div>
    <p className="text-sm text-ink/65">Cette identité est indépendante de l’email, de la société et du nom. Les rapprochements restent toujours une décision administrative explicite.</p>
    {identity?.macDueDate ? <p className="rounded-xl bg-canvas/60 px-3 py-2 text-sm">Échéance SST connue : {new Date(`${identity.macDueDate}T00:00:00`).toLocaleDateString("fr-FR")}</p> : <p className="text-sm text-ink/55">Aucune formation SST validée de référence n’est encore disponible.</p>}
    {identity?.sessions.length ? <details className="rounded-xl border border-ink/10 p-3 text-sm"><summary className="cursor-pointer font-semibold">Sessions et inscriptions rattachées</summary><ul className="mt-3 grid gap-2 text-ink/65">{identity.sessions.map((session) => <li key={session.id}>{session.title} — {session.trainingType === "mac_sst" ? "MAC SST" : session.trainingType === "sst_initial" ? "SST initiale" : session.trainingType}</li>)}</ul></details> : null}
    {identity?.status === "merged" ? <p className="rounded-xl bg-sand px-3 py-2 text-sm">Identité fusionnée : seul le dossier canonique déclenche les rappels MAC.</p> : null}
    {identity?.operations.length ? <details className="rounded-xl border border-ink/10 p-3 text-sm"><summary className="cursor-pointer font-semibold">Historique administratif</summary><ul className="mt-3 grid gap-2 text-ink/65">{identity.operations.map((operation) => <li key={operation.id}>{operation.operationType === "merged" ? "Regroupement" : operation.operationType === "linked" ? "Rattachement" : operation.operationType === "backfill" ? "Backfill" : "Création"}{operation.reason ? ` — ${operation.reason}` : ""}</li>)}</ul></details> : null}
    {isAdmin && identity ? <>
      <Button type="button" variant="secondary" onClick={() => showControls ? resetControls() : setShowControls(true)}>{showControls ? "Annuler les modifications" : "Gérer l’identité MAC"}</Button>
      {showControls ? <div className="grid gap-5 rounded-2xl border border-ink/10 p-4">
        <div className="grid gap-1"><label htmlFor="mac-identity-search" className="text-sm font-medium">Rechercher une identité</label><input id="mac-identity-search" value={search} onChange={(event) => { setSearch(event.target.value); setLinkIdentityId(""); setMergeIdentityId(""); setLinkConfirmed(false); setMergeConfirmed(false); }} placeholder="Nom, prénom, email, société ou session" className="rounded-xl border border-ink/10 px-3 py-2" /><p className="text-xs text-ink/55">Les suggestions visuelles ne réalisent jamais de rapprochement automatique.</p></div>
        {!choices.length ? <p className="rounded-xl bg-canvas/60 px-3 py-2 text-sm text-ink/65">Aucune identité active accessible ne correspond à cette recherche.</p> : null}
        <form action={linkAction} className="grid gap-3">
          <div><h4 className="font-semibold">Rattacher uniquement ce dossier</h4><p className="mt-1 text-sm text-ink/65">Déplace seulement l’inscription candidate actuellement ouverte vers l’identité choisie.</p></div>
          <input type="hidden" name="candidateId" value={candidateId} /><input type="hidden" name="confirmed" value={linkConfirmed ? "true" : "false"} />
          <label className="grid gap-1 text-sm font-medium">Identité canonique<IdentitySelect name="identityId" identities={choices} value={linkIdentityId} onChange={(value) => { setLinkIdentityId(value); setLinkConfirmed(false); }} candidate={candidate} /></label>
          {selectedLink ? <div className="rounded-xl bg-canvas/60 p-3 text-sm"><p className="font-semibold">Récapitulatif avant confirmation</p><p>Source : {candidateName || "Non renseigné"} — 1 dossier actuellement ouvert.</p><p>Identité choisie : {macIdentityOptionLabel(selectedLink)}</p><p className="mt-1 text-ink/65">Aucun rapprochement automatique n’est effectué.</p></div> : null}
          <label className="grid gap-1 text-sm font-medium">Motif administratif<textarea name="reason" required minLength={3} className="rounded-xl border border-ink/10 p-2" /></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={linkConfirmed} onChange={(event) => setLinkConfirmed(event.target.checked)} disabled={!selectedLink} /> Je confirme le rattachement de ce seul dossier.</label>
          <Button type="submit" disabled={linking || !selectedLink || !linkConfirmed}>{linking ? "Rattachement…" : "Confirmer le rattachement"}</Button>{linkState.error ? <p role="alert" className="text-sm text-accent">{linkState.error}</p> : null}{linkState.success ? <p role="status" className="text-sm text-pine">{linkState.success}</p> : null}
        </form>
        <form action={mergeAction} className="grid gap-3 border-t border-ink/10 pt-5">
          <div><h4 className="font-semibold">Fusionner toutes les identités</h4><p className="mt-1 text-sm text-ink/65">Rattache tout l’historique de l’identité actuelle à l’identité canonique choisie. Cette opération reste réservée aux administrateurs.</p></div>
          <input type="hidden" name="candidateId" value={candidateId} /><input type="hidden" name="secondaryIdentityId" value={identity.id} /><input type="hidden" name="confirmed" value={mergeConfirmed ? "true" : "false"} />
          <label className="grid gap-1 text-sm font-medium">Identité canonique<IdentitySelect name="canonicalIdentityId" identities={choices} value={mergeIdentityId} onChange={(value) => { setMergeIdentityId(value); setMergeConfirmed(false); }} candidate={candidate} /></label>
          {selectedMerge ? <div className="rounded-xl bg-canvas/60 p-3 text-sm"><p className="font-semibold">Récapitulatif avant confirmation</p><p>Source : identité actuelle — {identity.candidateCount} dossier(s), {identity.sessions.length} session(s).</p><p>Identité canonique : {macIdentityOptionLabel(selectedMerge)}</p><p className="mt-1 text-ink/65">Aucun rapprochement automatique n’est effectué ; l’identité source reste conservée comme fusionnée.</p></div> : null}
          <label className="grid gap-1 text-sm font-medium">Motif administratif<textarea name="reason" required minLength={3} className="rounded-xl border border-ink/10 p-2" /></label>
          <label className="flex gap-2 text-sm"><input type="checkbox" checked={mergeConfirmed} onChange={(event) => setMergeConfirmed(event.target.checked)} disabled={!selectedMerge} /> Je confirme le regroupement de tous les dossiers concernés.</label>
          <Button type="submit" disabled={merging || !selectedMerge || !mergeConfirmed}>{merging ? "Regroupement…" : "Confirmer le regroupement"}</Button>{mergeState.error ? <p role="alert" className="text-sm text-accent">{mergeState.error}</p> : null}{mergeState.success ? <p role="status" className="text-sm text-pine">{mergeState.success}</p> : null}
        </form>
      </div> : null}
    </> : null}
  </section>;
}
