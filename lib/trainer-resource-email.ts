import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { getTrainerResourceBySlug, type TrainerResourceSlug } from "@/lib/trainer-resources";
import { createClient } from "@/lib/supabase/server";

function buildTrainerResourceEmailBody(trainerName: string, resourceTitle: string, signatureLines: string[]) {
  return [
    `Bonjour ${trainerName},`,
    "",
    `Veuillez trouver ci-joint le document "${resourceTitle}" mis a disposition dans votre espace formateur Konform'up.`,
    "",
    "Ce support peut etre utilise comme base pedagogique pour vos animations SST.",
    "",
    ...signatureLines
  ].join("\n");
}

export async function sendTrainerResourceEmail(trainerId: string, resourceSlug: TrainerResourceSlug) {
  const resource = getTrainerResourceBySlug(resourceSlug);

  if (!resource) {
    throw new Error("Ressource formateur introuvable.");
  }

  const supabase = await createClient();
  const { data: trainer, error } = await supabase
    .from("trainers")
    .select("first_name, last_name, email")
    .eq("id", trainerId)
    .maybeSingle();

  if (error || !trainer) {
    throw new Error("Formateur introuvable.");
  }

  if (!trainer.email) {
    throw new Error("Aucune adresse email n'est renseignee pour ce formateur.");
  }

  const emailContext = await getTransactionalEmailContext();
  const pdf = await fetchExistingPdf(resource.apiPath);
  const trainerName = `${trainer.first_name} ${trainer.last_name}`.trim() || trainer.email;
  const body = buildTrainerResourceEmailBody(trainerName, resource.title, emailContext.signatureLines);

  await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [
      {
        email: trainer.email,
        name: trainerName
      }
    ],
    subject: `${resource.title} - Espace formateur`,
    textContent: body,
    attachment: [
        {
          name: resource.fileName,
          content: Buffer.from(pdf.buffer).toString("base64")
        }
      ],
    errorLabel: "l'envoi du document formateur"
  });

  return {
    fileUrl: resource.apiPath
  };
}
