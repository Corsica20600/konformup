import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPublicAttendanceResponse } from "@/lib/attendance";
import { formatDate } from "@/lib/utils";
import { confirmAttendanceResponseFormAction } from "@/app/attendance/respond/actions";

export const dynamic = "force-dynamic";

export default async function AttendanceRespondPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; submitted?: string }>;
}) {
  const { token, submitted } = await searchParams;
  const trimmedToken = token?.trim() ?? "";

  if (!trimmedToken) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
        <Card className="w-full">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Emargement</p>
          <h1 className="mt-2 text-3xl font-bold">Lien invalide</h1>
          <p className="mt-3 text-sm text-ink/65">
            Le lien de confirmation est incomplet. Ouvre le lien recu par email pour confirmer ta presence.
          </p>
        </Card>
      </main>
    );
  }

  const attendance = await getPublicAttendanceResponse(trimmedToken);

  if (!attendance) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
        <Card className="w-full">
          <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Emargement</p>
          <h1 className="mt-2 text-3xl font-bold">Lien introuvable</h1>
          <p className="mt-3 text-sm text-ink/65">
            Ce lien de confirmation n&apos;est plus valide ou le creneau d&apos;emargement n&apos;existe pas.
          </p>
        </Card>
      </main>
    );
  }

  const effectiveStatus = attendance.trainer_override_status ?? attendance.response_status;
  const isSubmitted = submitted === "1" || attendance.responded_at !== null;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <Card className="w-full">
        <p className="text-sm uppercase tracking-[0.25em] text-ink/45">Emargement</p>
        <h1 className="mt-2 text-3xl font-bold">Confirmation de presence</h1>
        <p className="mt-2 text-sm text-ink/65">
          Merci de confirmer ta presence pour le creneau ci-dessous. Cette validation est personnelle et horodatee.
        </p>

        <div className="mt-6 grid gap-4 rounded-[24px] border border-ink/10 bg-sand/30 p-5">
          <div>
            <p className="text-sm text-ink/55">Stagiaire</p>
            <p className="text-lg font-semibold text-ink">{attendance.candidate_name}</p>
          </div>
          <div>
            <p className="text-sm text-ink/55">Session</p>
            <p className="text-lg font-semibold text-ink">{attendance.session_title}</p>
            <p className="text-sm text-ink/65">
              {formatDate(attendance.slot_date)} • {attendance.slot_label}
            </p>
            <p className="text-sm text-ink/65">{attendance.session_location}</p>
          </div>
        </div>

        {isSubmitted ? (
          <div className="mt-6 rounded-[24px] border border-pine/20 bg-pine/10 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-pine/75">Confirmation enregistree</p>
            <p className="mt-2 text-xl font-semibold text-pine">
              {effectiveStatus === "present"
                ? "Presence confirmee"
                : effectiveStatus === "absent"
                  ? "Absence signalee"
                  : effectiveStatus === "issue"
                    ? "Probleme signale"
                    : "Reponse enregistree"}
            </p>
            <p className="mt-2 text-sm text-ink/65">
              {attendance.responded_at
                ? `Horodatage : ${new Intl.DateTimeFormat("fr-FR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }).format(new Date(attendance.responded_at))}`
                : "Ta reponse a bien ete prise en compte."}
            </p>
          </div>
        ) : (
          <form action={confirmAttendanceResponseFormAction} className="mt-6 grid gap-3">
            <input type="hidden" name="token" value={trimmedToken} />
            <Button type="submit" name="responseStatus" value="present">
              Je confirme ma presence
            </Button>
            <Button type="submit" name="responseStatus" value="issue" variant="secondary">
              Je signale un probleme
            </Button>
            <Button type="submit" name="responseStatus" value="absent" variant="ghost">
              Je ne serai pas present
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
