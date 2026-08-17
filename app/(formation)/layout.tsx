import { MissingEnvCard } from "@/components/system/missing-env-card";
import { requireUser } from "@/lib/auth";
import { getSupabaseEnvMessage } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function FormationLayout({ children }: { children: React.ReactNode }) {
  const envMessage = getSupabaseEnvMessage();

  if (envMessage) {
    return (
      <main className="grid min-h-screen place-items-center px-6 py-12">
        <MissingEnvCard message={envMessage} />
      </main>
    );
  }

  await requireUser();
  return children;
}
