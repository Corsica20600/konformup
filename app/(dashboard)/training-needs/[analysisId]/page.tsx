import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TrainingNeedsFormShell } from "@/components/training-needs/form-shell";
import { TrainingNeedsStatusBadge } from "@/components/training-needs/internal-summary";
import { SendPreQuoteAnalysisButton } from "@/components/training-needs/send-prequote-analysis-button";
import { getInternalTrainingNeedsAnalysis } from "@/lib/training-needs/internal";
import { ResourceNotFoundError, AuthorizationError } from "@/lib/auth";
import { getClientCompanyById } from "@/lib/queries";

export const dynamic = "force-dynamic";
export default async function TrainingNeedsDetailPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;

  try {
    const analysis = await getInternalTrainingNeedsAnalysis(analysisId);
    const isPreQuote = !analysis.quote_id;
    const canSendToClient = isPreQuote && ["draft", "sent", "in_progress"].includes(analysis.status);
    const company = canSendToClient ? await getClientCompanyById(analysis.company_id) : null;
    const formAnalysis = {
      id: analysis.id,
      trainingType: analysis.training_type,
      status: "in_progress" as const,
      questionnaireVersion: "1" as const,
      quote: analysis.quote_snapshot,
      progress: { currentStep: 5, progressPercent: 100 },
      answers: analysis.answers,
      tokenExpiresAt: null,
      isReadOnly: false
    };

    return <main className="mx-auto grid max-w-5xl gap-4">
      <div className="flex flex-wrap gap-3">
        <Link href={`/companies/${analysis.company_id}`} className="text-sm font-semibold text-pine underline">Retour à la société</Link>
        {analysis.quote_id ? <Link href={`/quotes/${analysis.quote_id}`} className="text-sm font-semibold text-pine underline">Retour au devis</Link> : null}
        {isPreQuote && analysis.status === "completed" ? <Link href={`/companies/${analysis.company_id}?analysisId=${analysis.id}#devis`} className="text-sm font-semibold text-pine underline">Créer le devis à partir de cette analyse</Link> : null}
      </div>
      <Card>
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-ink/45">{isPreQuote ? "Analyse préalable au devis" : "Analyse des besoins"}</p>
            <h1 className="mt-2 text-3xl font-bold">{analysis.quote_snapshot.title}</h1>
            <p className="mt-1 text-sm text-ink/65">{analysis.quote_snapshot.companyName} · {analysis.quote_snapshot.quoteNumber}</p>
          </div>
          <TrainingNeedsStatusBadge status={analysis.status} preQuote={isPreQuote} />
        </div>
        {canSendToClient ? <div className="mt-5 rounded-2xl border border-pine/20 bg-pine/5 p-4"><p className="font-semibold text-pine">Envoi au client</p><p className="mt-1 text-sm text-ink/65">Le questionnaire est envoyé à {company?.company.contact_email || "l’adresse de contact de la société"} avec un lien sécurisé valable 30 jours.</p><div className="mt-3"><SendPreQuoteAnalysisButton analysisId={analysis.id} recipientEmail={company?.company.contact_email ?? null} /></div></div> : null}
        <p className="mt-5 text-sm text-ink/65">Utilisez les boutons « Modifier » du récapitulatif pour corriger une rubrique, puis enregistrez vos modifications. Une fois finalisée, cette analyse pourra être reliée au devis.</p>
      </Card>
      <TrainingNeedsFormShell token="" analysis={formAnalysis} internalAnalysisId={analysis.id} />
    </main>;
  } catch (error) {
    if (error instanceof ResourceNotFoundError || error instanceof AuthorizationError) notFound();
    throw error;
  }
}
