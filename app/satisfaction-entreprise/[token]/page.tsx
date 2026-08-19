import { CompanySatisfactionSurveyForm } from "@/components/company-satisfaction/survey-form";
import { getCompanySatisfactionPublicContext } from "@/lib/company-satisfaction";

export const dynamic = "force-dynamic";

export default async function CompanySatisfactionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const context = await getCompanySatisfactionPublicContext(token);
  return <main className="mx-auto grid max-w-2xl gap-6 p-6"><header><p className="text-sm uppercase tracking-[0.2em] text-ink/55">Konform’up</p><h1 className="mt-2 text-3xl font-bold">Votre avis sur la formation</h1></header>{context.state === "unavailable" ? <p className="rounded-2xl bg-sand p-4">Ce questionnaire est indisponible.</p> : context.state === "already_completed" ? <p className="rounded-2xl bg-pine/10 p-4 text-pine">Ce questionnaire a déjà été complété. Merci pour votre retour.</p> : <><p className="text-ink/70">Merci à {context.companyName}. Ce questionnaire facultatif dure moins d’une minute{context.trainingTitle ? ` et concerne ${context.trainingTitle}` : ""}.</p><CompanySatisfactionSurveyForm token={token} /></>}</main>;
}
