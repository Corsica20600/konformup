import { Card } from "@/components/ui/card";
import { TrainingNeedsFormShell } from "@/components/training-needs/form-shell";
import { loadPublicTrainingNeedsAnalysis } from "@/lib/training-needs/public";

export const dynamic = "force-dynamic";

export default async function TrainingNeedsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const analysis = await loadPublicTrainingNeedsAnalysis(token);
    return <TrainingNeedsFormShell token={token} analysis={analysis} />;
  } catch {
    return <PublicLinkError />;
  }
}

function PublicLinkError() {
  return <main className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-10"><Card className="w-full text-center"><p className="text-sm uppercase tracking-[0.2em] text-ink/50">Konform&apos;up</p><h1 className="mt-3 text-3xl font-bold">Lien indisponible</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-ink/65">Ce lien n&apos;est plus accessible. Il peut avoir expiré, avoir été annulé ou être incomplet. Contactez Konform&apos;up si vous avez besoin d&apos;un nouveau lien.</p></Card></main>;
}
