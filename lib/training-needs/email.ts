import "server-only";

import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { getClientCompanyById } from "@/lib/queries";
import { getTrainingTypeLabel } from "@/lib/training-programs";
import {
  confirmTrainingNeedsEmailRotation,
  getInternalTrainingNeedsAnalysis,
  rollbackTrainingNeedsEmailRotation,
  rotateTrainingNeedsPublicAccessForEmail
} from "./internal";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

export async function sendPreQuoteTrainingNeedsEmail(analysisId: string) {
  const analysis = await getInternalTrainingNeedsAnalysis(analysisId);
  if (analysis.quote_id) throw new Error("Cette analyse est déjà liée à un devis.");
  if (analysis.status === "completed" || analysis.status === "cancelled") throw new Error("Cette analyse ne peut plus être envoyée au client.");

  const { company } = await getClientCompanyById(analysis.company_id);
  const recipientEmail = company.contact_email?.trim();
  if (!recipientEmail) throw new Error("Aucune adresse email de contact n’est renseignée pour cette société.");

  const recipientName = [company.contact_first_name, company.contact_last_name].filter(Boolean).join(" ") || company.company_name;
  const emailContext = await getTransactionalEmailContext();
  const rotation = await rotateTrainingNeedsPublicAccessForEmail(analysis.id);
  const trainingLabel = getTrainingTypeLabel(analysis.training_type);
  const textContent = [
    "Bonjour,",
    "",
    `Afin de préparer votre formation ${trainingLabel}, merci de compléter l’analyse de vos besoins.` ,
    "Vos réponses nous permettront d’adapter l’organisation, le contenu et les exercices à votre activité.",
    "",
    "Accéder au questionnaire :",
    rotation.url,
    "",
    "Vous pouvez enregistrer vos réponses et reprendre le formulaire avant sa validation définitive.",
    "",
    ...emailContext.signatureLines
  ].join("\n");
  const url = escapeHtml(rotation.url);
  const htmlContent = `<p>Bonjour,</p><p>Afin de préparer votre formation <strong>${escapeHtml(trainingLabel)}</strong>, merci de compléter l’analyse de vos besoins.</p><p>Vos réponses nous permettront d’adapter l’organisation, le contenu et les exercices à votre activité.</p><p><a href="${url}" style="display:inline-block;background:#285943;color:#fff;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700">Compléter l’analyse des besoins</a></p><p style="font-size:12px;word-break:break-all">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur : ${url}</p>`;

  try {
    await sendBrevoTransactionalEmail({
      context: emailContext,
      to: [{ email: recipientEmail, name: recipientName }],
      subject: `Analyse des besoins à compléter – ${trainingLabel}`,
      textContent,
      htmlContent,
      errorLabel: "l’envoi de l’analyse des besoins"
    });
  } catch (error) {
    await rollbackTrainingNeedsEmailRotation(rotation).catch(() => undefined);
    throw error;
  }

  await confirmTrainingNeedsEmailRotation(rotation).catch(() => undefined);
  return { recipientEmail };
}
