import "server-only";

import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGeneratedDocumentLabel } from "@/lib/document-labels";
import { getTransactionalEmailContext, sendBrevoTransactionalEmail } from "@/lib/email-config";
import { getRequiredPreTrainingDocumentTypes } from "@/lib/pre-training-documents";

export type PreTrainingDeliveryKind = "documents_j5" | "reminder_j2";

type DeliveryStatus = "pending" | "processing" | "sent" | "skipped" | "error";

type StoredDocument = {
  id: string;
  document_type: string;
  document_ref: string;
  file_url: string | null;
  status: string;
  metadata: unknown;
};

function dateDifferenceInDays(startDate: string, today: string) {
  const start = Date.parse(`${startDate.slice(0, 10)}T00:00:00Z`);
  const current = Date.parse(`${today.slice(0, 10)}T00:00:00Z`);
  return Number.isFinite(start) && Number.isFinite(current) ? Math.round((start - current) / 86_400_000) : null;
}

export function getDuePreTrainingDeliveryKinds(startDate: string, today: string): PreTrainingDeliveryKind[] {
  const daysUntilStart = dateDifferenceInDays(startDate, today);
  if (daysUntilStart === null || daysUntilStart <= 0) return [];

  const kinds: PreTrainingDeliveryKind[] = [];
  if (daysUntilStart <= 5) kinds.push("documents_j5");
  if (daysUntilStart <= 2) kinds.push("reminder_j2");
  return kinds;
}

function deliveryKey(sessionId: string, candidateId: string, kind: PreTrainingDeliveryKind) {
  return createHash("sha256").update(`${sessionId}:${candidateId}:${kind}`).digest("hex");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "Europe/Paris" }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}

function attachmentName(document: StoredDocument) {
  if (document.document_type === "welcome_pack") return "livret_accueil_reglement_interieur.pdf";
  return `convocation-${document.document_ref}.pdf`;
}

function storageTarget(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") return null;
  const storage = (metadata as { storage?: unknown }).storage;
  if (!storage || typeof storage !== "object") return null;
  const candidate = storage as { bucket?: unknown; path?: unknown };
  return typeof candidate.bucket === "string" && typeof candidate.path === "string"
    ? { bucket: candidate.bucket, path: candidate.path }
    : null;
}

async function loadAttachment(supabase: ReturnType<typeof createAdminClient>, document: StoredDocument) {
  const storage = storageTarget(document.metadata);
  if (!storage) throw new Error(`Le fichier ${getGeneratedDocumentLabel(document.document_type)} n'est pas disponible dans le stockage.`);
  const { data, error } = await supabase.storage.from(storage.bucket).download(storage.path);
  if (error || !data) throw new Error(`Impossible de charger ${getGeneratedDocumentLabel(document.document_type)}.`);
  return { name: attachmentName(document), content: Buffer.from(await data.arrayBuffer()).toString("base64") };
}

async function findOrCreateDelivery(
  supabase: ReturnType<typeof createAdminClient>,
  input: { sessionId: string; candidateId: string; kind: PreTrainingDeliveryKind; email: string }
) {
  const idempotencyKey = deliveryKey(input.sessionId, input.candidateId, input.kind);
  await supabase
    .from("pre_training_document_deliveries")
    .upsert({ session_id: input.sessionId, candidate_id: input.candidateId, delivery_kind: input.kind, recipient_email: input.email, idempotency_key: idempotencyKey }, { onConflict: "idempotency_key", ignoreDuplicates: true });
  const { data, error } = await supabase
    .from("pre_training_document_deliveries")
    .select("id, status")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle<{ id: string; status: DeliveryStatus }>();
  if (error || !data) throw new Error("Impossible de préparer le suivi de l'envoi automatique.");
  return data;
}

async function claimDelivery(supabase: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await supabase.rpc("claim_pre_training_document_delivery", { p_id: id });
  if (error) throw new Error("Impossible de verrouiller l'envoi automatique.");
  return Boolean(data);
}

async function setDeliveryStatus(
  supabase: ReturnType<typeof createAdminClient>,
  id: string,
  status: Extract<DeliveryStatus, "sent" | "skipped" | "error">,
  technicalError: string | null = null
) {
  const { error } = await supabase
    .from("pre_training_document_deliveries")
    .update({ status, sent_at: status === "sent" ? new Date().toISOString() : null, technical_error: technicalError })
    .eq("id", id);
  if (error) throw new Error("Impossible de mettre à jour le suivi de l'envoi automatique.");
}

function cleanError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 240) : "Échec de livraison";
}

export async function runPreTrainingDocumentDeliveryCron(today = new Date().toISOString().slice(0, 10)) {
  const supabase = createAdminClient();
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .select("id, title, start_date, training_type, status")
    .gt("start_date", today)
    .neq("status", "cancelled");
  if (sessionsError) throw new Error("Impossible de charger les sessions à préparer.");

  let documentsSent = 0;
  let remindersSent = 0;
  let skipped = 0;
  let errors = 0;

  for (const session of sessions ?? []) {
    const dueKinds = getDuePreTrainingDeliveryKinds(session.start_date, today);
    if (!dueKinds.length) continue;
    const { data: candidates, error: candidatesError } = await supabase
      .from("candidates")
      .select("id, first_name, last_name, email")
      .eq("session_id", session.id);
    if (candidatesError) throw new Error("Impossible de charger les candidats de la session.");

    for (const candidate of candidates ?? []) {
      const email = candidate.email?.trim().toLowerCase();
      if (!email) { skipped += 1; continue; }
      const candidateName = `${candidate.first_name} ${candidate.last_name}`.trim() || email;
      let initialCompleted = false;

      for (const kind of dueKinds) {
        const delivery = await findOrCreateDelivery(supabase, { sessionId: session.id, candidateId: candidate.id, kind, email });
        if (delivery.status === "sent" || delivery.status === "skipped" || delivery.status === "processing") {
          initialCompleted ||= kind === "documents_j5" && (delivery.status === "sent" || delivery.status === "skipped");
          skipped += 1;
          continue;
        }
        if (kind === "reminder_j2" && !initialCompleted) { skipped += 1; continue; }
        if (!(await claimDelivery(supabase, delivery.id))) { skipped += 1; continue; }

        try {
          const context = await getTransactionalEmailContext();
          if (kind === "documents_j5") {
            const requiredTypes = getRequiredPreTrainingDocumentTypes(session.training_type);
            const { data: rawDocuments, error: documentsError } = await supabase
              .from("generated_documents")
              .select("id, document_type, document_ref, file_url, status, metadata")
              .eq("session_id", session.id)
              .eq("candidate_id", candidate.id)
              .in("document_type", requiredTypes)
              .order("created_at", { ascending: false });
            if (documentsError) throw new Error("Impossible de charger les documents avant formation.");
            const latestDocuments = new Map<string, StoredDocument>();
            for (const document of (rawDocuments ?? []) as StoredDocument[]) {
              if (!latestDocuments.has(document.document_type)) latestDocuments.set(document.document_type, document);
            }
            const documents = requiredTypes.map((type) => latestDocuments.get(type)).filter((document): document is StoredDocument => Boolean(document));
            if (documents.length !== requiredTypes.length) throw new Error("Le dossier avant formation n'est pas complet.");
            if (documents.every((document) => document.status === "sent")) {
              await setDeliveryStatus(supabase, delivery.id, "skipped");
              initialCompleted = true;
              skipped += 1;
              continue;
            }
            const attachments = await Promise.all(documents.map((document) => loadAttachment(supabase, document)));
            await sendBrevoTransactionalEmail({
              context,
              to: [{ email, name: candidateName }],
              subject: `Vos documents de formation – ${session.title}`,
              textContent: [`Bonjour ${candidateName},`, "", `Votre formation « ${session.title} » débute le ${formatDate(session.start_date)}.`, "Veuillez trouver ci-joint votre convocation et votre livret d'accueil.", "", "Cordialement,", ...context.signatureLines].join("\n"),
              attachment: attachments,
              errorLabel: "l'envoi automatique des documents avant formation"
            });
            await supabase.from("generated_documents").update({ status: "sent", updated_at: new Date().toISOString() }).in("id", documents.map((document) => document.id));
            await setDeliveryStatus(supabase, delivery.id, "sent");
            initialCompleted = true;
            documentsSent += 1;
          } else {
            await sendBrevoTransactionalEmail({
              context,
              to: [{ email, name: candidateName }],
              subject: `Rappel : votre formation débute dans 48 heures – ${session.title}`,
              textContent: [`Bonjour ${candidateName},`, "", `Rappel : votre formation « ${session.title} » débute le ${formatDate(session.start_date)}.`, "Votre convocation et votre livret d'accueil vous ont été transmis. Pensez à les conserver.", "", "Cordialement,", ...context.signatureLines].join("\n"),
              errorLabel: "le rappel automatique avant formation"
            });
            await setDeliveryStatus(supabase, delivery.id, "sent");
            remindersSent += 1;
          }
        } catch (error) {
          await setDeliveryStatus(supabase, delivery.id, "error", cleanError(error));
          errors += 1;
        }
      }
    }
  }

  return { documentsSent, remindersSent, skipped, errors };
}
