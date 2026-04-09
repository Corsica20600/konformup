import { Card } from "@/components/ui/card";

export function MissingEnvCard({
  message
}: {
  message: string;
}) {
  return (
    <Card className="max-w-2xl">
      <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Configuration requise</p>
      <h1 className="mt-2 text-2xl font-bold">Variables Supabase manquantes</h1>
      <p className="mt-4 text-sm leading-6 text-ink/70">{message}</p>
      <div className="mt-6 rounded-2xl bg-canvas/70 p-4 text-sm text-ink/75">
        <p>Fichier à créer ou compléter : <code>.env.local</code></p>
        <p className="mt-2"><code>NEXT_PUBLIC_SUPABASE_URL=...</code></p>
        <p><code>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</code></p>
      </div>
    </Card>
  );
}
