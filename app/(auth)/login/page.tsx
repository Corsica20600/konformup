import { Card } from "@/components/ui/card";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { MissingEnvCard } from "@/components/system/missing-env-card";
import { getSupabaseEnvMessage } from "@/lib/env";
import { APP_BRANDING } from "@/lib/branding";

export default function LoginPage() {
  const envMessage = getSupabaseEnvMessage();

  return (
    <main className="grid min-h-screen place-items-center px-6 py-12">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] bg-pine p-8 text-white shadow-panel md:p-12">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/70">{APP_BRANDING.name}</p>
          <h1 className="max-w-xl text-4xl font-extrabold leading-tight md:text-5xl">
            Pilotez vos formations SST, MAC SST et Hygiène en toute simplicité.
          </h1>
          <p className="mt-6 max-w-lg text-base text-white/80">
            Sociétés, devis, sessions, candidats, émargements et documents sont réunis dans un espace pensé pour le
            bureau, la tablette et l'animation en salle.
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
