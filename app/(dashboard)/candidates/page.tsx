import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getCandidateDirectory } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Candidats" };

export default async function CandidatesPage() {
  const candidates = await getCandidateDirectory();
  return <main className="grid gap-4">
    <section><p className="text-sm uppercase tracking-[0.25em] text-ink/45">Candidats</p><h2 className="mt-2 text-3xl font-bold">Tous les candidats accessibles</h2><p className="mt-2 text-sm text-ink/65">Cette vue réutilise les inscriptions existantes et respecte les règles RLS de votre session.</p></section>
    <Card><div className="overflow-x-auto"><table className="min-w-[700px] w-full text-left text-sm"><thead className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink/55"><tr><th className="px-3 py-3">Candidat</th><th className="px-3 py-3">Identité MAC</th><th className="px-3 py-3">Société</th><th className="px-3 py-3">Session</th><th className="px-3 py-3">Actions</th></tr></thead><tbody>{candidates.map((candidate) => <tr key={candidate.id} className="border-b border-ink/10 last:border-0"><td className="px-3 py-4"><strong>{candidate.first_name} {candidate.last_name}</strong><br /><span className="text-ink/55">{candidate.email || "Email non renseigné"}</span></td><td className="px-3 py-4">{candidate.mac_identity_id ? <span className="rounded-full bg-sand px-2 py-1 text-xs font-semibold">{candidate.mac_identity_status === "active" && candidate.mac_identity_verified_at ? "Vérifiée" : candidate.mac_identity_status === "merged" ? "Fusionnée" : "À vérifier"}</span> : <span className="text-ink/55">À créer</span>}</td><td className="px-3 py-4">{candidate.company || "—"}</td><td className="px-3 py-4">{candidate.session ? <>{candidate.session.title}<br /><span className="text-ink/55">{formatDate(candidate.session.start_date)}</span></> : "Aucune session"}</td><td className="px-3 py-4"><div className="flex gap-2"><Link className="rounded-full bg-sand px-3 py-2 font-semibold" href={`/candidates/${candidate.id}`}>Dossier</Link>{candidate.session ? <Link className="rounded-full bg-pine px-3 py-2 font-semibold text-white" href={`/sessions/${candidate.session.id}?tab=candidates`}>Session</Link> : null}</div></td></tr>)}</tbody></table>{!candidates.length ? <p className="px-3 py-8 text-sm text-ink/65">Aucun candidat accessible.</p> : null}</div></Card>
  </main>;
}
