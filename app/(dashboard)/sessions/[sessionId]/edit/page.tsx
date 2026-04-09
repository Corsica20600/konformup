import { notFound } from "next/navigation";
import { EditSessionForm } from "@/components/sessions/edit-session-form";
import { Card } from "@/components/ui/card";
import { getSessionById, getTrainerOptions, RecoverableSessionQueryError, SessionNotFoundError } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditSessionPage({
  params
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  try {
    const sessionResult = await getSessionById(sessionId);
    const trainersResult = await Promise.allSettled([getTrainerOptions()]);
    const trainers = trainersResult[0].status === "fulfilled" ? trainersResult[0].value : [];

    if (trainersResult[0].status === "rejected") {
      console.warn("[edit-session-trainers-fallback]", {
        sessionId,
        reason:
          trainersResult[0].reason instanceof Error
            ? {
                name: trainersResult[0].reason.name,
                message: trainersResult[0].reason.message
              }
            : {
                message: "Unknown error"
              }
      });
    }

    return (
      <main className="grid gap-4">
        <Card>
          <EditSessionForm session={sessionResult.session} trainers={trainers} />
        </Card>
      </main>
    );
  } catch (error) {
    if (error instanceof SessionNotFoundError) {
      notFound();
    }

    if (error instanceof RecoverableSessionQueryError) {
      return (
        <main className="grid gap-4">
          <Card>
            <h2 className="text-2xl font-bold">Session temporairement indisponible</h2>
            <p className="mt-2 text-sm text-ink/65">
              Les donnees de cette session ne peuvent pas etre chargees pour le moment. Verifie le schema Supabase puis recharge la page.
            </p>
          </Card>
        </main>
      );
    }

    throw error;
  }
}
