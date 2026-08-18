import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { fetchExistingPdf } from "@/lib/generated-documents";
import { createClient } from "@/lib/supabase/server";

export async function sendAttestationToSessionCompany(documentId: string) {
  const supabase = await createClient();
  const { data: document, error } = await supabase
    .from("generated_documents")
    .select("id, session_id, candidate_id, document_ref, file_url")
    .eq("id", documentId)
    .eq("document_type", "attestation")
    .maybeSingle();
  if (error || !document?.session_id || !document.candidate_id || !document.file_url) throw new Error("Attestation introuvable.");

  const [{ data: candidate }, { data: session }] = await Promise.all([
    supabase.from("candidates").select("first_name, last_name, company_id").eq("id", document.candidate_id).maybeSingle(),
    supabase.from("training_sessions").select("source_quote_id, title").eq("id", document.session_id).maybeSingle()
  ]);
  const { data: quote } = session?.source_quote_id
    ? await supabase.from("quotes").select("company_id").eq("id", session.source_quote_id).maybeSingle()
    : { data: null };
  const companyId = quote?.company_id ?? candidate?.company_id;
  if (!companyId) throw new Error("Aucune entreprise n'est rattachée à cette session.");
  const { data: company } = await supabase
    .from("client_companies")
    .select("company_name, contact_email, contact_first_name, contact_last_name")
    .eq("id", companyId)
    .maybeSingle();
  if (!company?.contact_email) throw new Error("L'entreprise de la session n'a pas d'adresse email.");

  const pdf = await fetchExistingPdf(document.file_url);
  const candidateName = `${candidate?.first_name ?? ""} ${candidate?.last_name ?? ""}`.trim() || "le stagiaire";
  const emailContext = await getTransactionalEmailContext();
  await sendBrevoTransactionalEmail({
    context: emailContext,
    to: [{ email: company.contact_email, name: `${company.contact_first_name ?? ""} ${company.contact_last_name ?? ""}`.trim() || company.company_name }],
    subject: `Attestation de fin de formation - ${candidateName}`,
    textContent: [`Bonjour,`, "", `Veuillez trouver ci-joint l'attestation de fin de formation de ${candidateName}${session?.title ? ` pour la session « ${session.title} »` : ""}.`, "", ...emailContext.signatureLines].join("\n"),
    attachment: [{ name: `attestation-${document.document_ref}.pdf`, content: Buffer.from(pdf.buffer).toString("base64") }],
    errorLabel: "l'envoi de l'attestation à l'entreprise"
  });
  await supabase.from("generated_documents").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", document.id);
}
