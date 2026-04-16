import { fetchExistingPdf } from "@/lib/generated-documents";
import { getOrganizationSettings } from "@/lib/organization";
import { getTrainerResourceBySlug, type TrainerResourceSlug } from "@/lib/trainer-resources";
import { createClient } from "@/lib/supabase/server";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est requise pour envoyer un document formateur par email.`);
  }

  return value;
}

async function buildTrainerResourceEmailBody(trainerName: string, resourceTitle: string) {
  const organization = await getOrganizationSettings();
  const organizationEmail = process.env.ORGANIZATION_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim() || "";
  const organizationPhone = process.env.ORGANIZATION_PHONE?.trim() || "";

  return [
    `Bonjour ${trainerName},`,
    "",
    `Veuillez trouver ci-joint le document "${resourceTitle}" mis a disposition dans votre espace formateur Konformup.`,
    "",
    "Ce support peut etre utilise comme base pedagogique pour vos animations SST.",
    "",
    "Cordialement,",
    organization.organization_name,
    organizationEmail,
    organizationPhone
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

  const apiKey = requireEnv("BREVO_API_KEY");
  const fromEmail = requireEnv("BREVO_SENDER_EMAIL");
  const fromName = process.env.BREVO_SENDER_NAME?.trim() || (await getOrganizationSettings()).organization_name;
  const pdf = await fetchExistingPdf(resource.apiPath);
  const trainerName = `${trainer.first_name} ${trainer.last_name}`.trim() || trainer.email;
  const body = await buildTrainerResourceEmailBody(trainerName, resource.title);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        email: fromEmail,
        name: fromName
      },
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
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Brevo a refuse l'envoi du document formateur. ${errorText}`.trim());
  }

  return {
    fileUrl: resource.apiPath
  };
}
