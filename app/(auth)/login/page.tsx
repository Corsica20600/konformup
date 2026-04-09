import { Card } from "@/components/ui/card";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { MissingEnvCard } from "@/components/system/missing-env-card";
import { getSupabaseEnvMessage } from "@/lib/env";

export default function LoginPage() {
  const envMessage = getSupabaseEnvMessage();

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] bg-pine p-8 text-white shadow-panel md:p-12">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/70">Formation SST</p>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight md:text-5xl">
            Piloter les sessions en présentiel sans alourdir le suivi terrain.
          </h1>
          <p className="mt-6 max-w-lg text-base text-white/80">
            Création de session, suivi des modules, validation des candidats et génération d'attestations
            PDF dans une interface simple, propre et pensée pour le bureau comme la tablette.
          </p>
        </section>

        {envMessage ? (
          <div className="self-center">
            <MissingEnvCard message={envMessage} />
          </div>
        ) : (
          <Card className="self-center">
            <p className="text-sm uppercase tracking-[0.25em] text-ink/50">Connexion</p>
            <h2 className="mt-3 text-2xl font-bold">Admin / Formateur</h2>
            <p className="mt-2 text-sm text-ink/65">Connecte-toi avec un compte Supabase déjà créé.</p>
            <div className="mt-8">
              <LoginForm />
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
