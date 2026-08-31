import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCandidateSatisfactionContext, getPublicAttendanceResponse } from "@/lib/attendance";
import { candidateSatisfactionQuestions } from "@/lib/candidate-satisfaction";
import { formatDate } from "@/lib/utils";
import { confirmAttendanceResponseFormAction, submitSatisfactionSurveyFormAction } from "@/app/attendance/respond/actions";

export const dynamic = "force-dynamic";

export default async function AttendanceRespondPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string; submitted?: string; error?: string; surveySubmitted?: string; surveyAlreadyCompleted?: string; surveyError?: string }>;
}) {
  const { token, submitted, error, surveySubmitted, surveyAlreadyCompleted, surveyError } = await searchParams;
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
  const satisfaction = isSubmitted ? await getCandidateSatisfactionContext(trimmedToken) : { is_final_slot: false, submitted: false };

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

        {error === "1" && !isSubmitted ? (
          <div className="mt-6 rounded-[24px] border border-accent/20 bg-accent/10 p-5">
            <p className="text-sm font-semibold text-accent">La confirmation n&apos;a pas pu etre enregistree.</p>
            <p className="mt-2 text-sm text-ink/65">
              Recharge la page et reessaie. Si le probleme persiste, le formateur pourra valider manuellement ta
              presence.
            </p>
          </div>
        ) : null}

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

        {isSubmitted && satisfaction.is_final_slot ? (
          <section className="mt-6 border-t border-ink/10 pt-6">
            <p className="text-sm uppercase tracking-[0.2em] text-ink/45">Questionnaire de satisfaction</p>
            <h2 className="mt-2 text-2xl font-bold">Votre avis compte</h2>
            {satisfaction.submitted || surveySubmitted === "1" || surveyAlreadyCompleted === "1" ? (
              <p className="mt-3 rounded-2xl bg-pine/10 p-4 text-sm font-semibold text-pine">{surveyAlreadyCompleted === "1" ? "Questionnaire déjà complété." : "Merci, votre questionnaire a bien été enregistré."}</p>
            ) : (
              <form action={submitSatisfactionSurveyFormAction} className="mt-5 grid gap-5">
                <input type="hidden" name="token" value={trimmedToken} />
                <SurveyRating name="organisation_information" label={candidateSatisfactionQuestions[0].label} />
                <SurveyRating name="organisation_accueil" label={candidateSatisfactionQuestions[1].label} />
                <SurveyRating name="organisation_locaux" label={candidateSatisfactionQuestions[2].label} />
                <SurveyRating name="contenu_objectifs" label={candidateSatisfactionQuestions[3].label} />
                <SurveyRating name="contenu_pratique" label={candidateSatisfactionQuestions[4].label} />
                <SurveyRating name="formateur_maitrise" label={candidateSatisfactionQuestions[5].label} />
                <SurveyRating name="formateur_ecoute" label={candidateSatisfactionQuestions[6].label} />
                <SurveyChoice name="competences" label={candidateSatisfactionQuestions[7].label} options={["Non", "Partiellement", "Oui"]} />
                <SurveyChoice name="satisfaction_globale" label={candidateSatisfactionQuestions[8].label} options={["Pas du tout satisfait", "Peu satisfait", "Satisfait", "Très satisfait"]} />
                <SurveyChoice name="attentes" label={candidateSatisfactionQuestions[9].label} options={["Non", "Partiellement", "Oui, totalement"]} />
                <label className="grid gap-2 text-sm font-medium">{candidateSatisfactionQuestions[10].label}<input name="recommandation" type="number" min="0" max="10" required className="rounded-2xl border border-ink/10 px-4 py-3" /></label>
                <label className="grid gap-2 text-sm font-medium">{candidateSatisfactionQuestions[11].label}<textarea name="apprecie" className="min-h-24 rounded-2xl border border-ink/10 px-4 py-3" /></label>
                <label className="grid gap-2 text-sm font-medium">{candidateSatisfactionQuestions[12].label}<textarea name="ameliorations" className="min-h-24 rounded-2xl border border-ink/10 px-4 py-3" /></label>
                <label className="grid gap-2 text-sm font-medium">{candidateSatisfactionQuestions[13].label}<textarea name="remarques" className="min-h-24 rounded-2xl border border-ink/10 px-4 py-3" /></label>
                {surveyError === "1" ? <p className="text-sm text-accent">Le questionnaire n’a pas pu être enregistré. Réessayez.</p> : null}
                <div><Button type="submit">Envoyer mon questionnaire</Button></div>
              </form>
            )}
          </section>
        ) : null}
      </Card>
    </main>
  );
}

function SurveyRating({ name, label }: { name: string; label: string }) {
  return <SurveyChoice name={name} label={label} options={["1 — Pas du tout satisfait", "2 — Peu satisfait", "3 — Satisfait", "4 — Très satisfait", "N/A"]} />;
}

function SurveyChoice({ name, label, options }: { name: string; label: string; options: string[] }) {
  return <fieldset className="grid gap-2"><legend className="text-sm font-medium">{label}</legend><div className="flex flex-wrap gap-2">{options.map((option) => <label key={option} className="rounded-full border border-ink/10 px-3 py-2 text-sm"><input className="mr-2" type="radio" name={name} value={option} required />{option}</label>)}</div></fieldset>;
}
