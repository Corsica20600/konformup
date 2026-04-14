import { createClient } from "@/lib/supabase/server";
import { getOrganizationSettings } from "@/lib/organization";
import { resolvePublicAppOrigin } from "@/lib/generated-documents";
import type {
  AttendanceCandidateResponse,
  AttendanceOverview,
  AttendanceSlotSummary,
  PublicAttendanceResponse,
  SessionCandidate,
  SessionItem
} from "@/lib/types";

type AttendanceSlotRow = {
  id: string;
  session_id: string;
  slot_label: string;
  slot_date: string;
  period: "morning" | "afternoon" | "custom";
  status: "draft" | "sent" | "open" | "closed";
  sent_at: string | null;
  closed_at: string | null;
};

type AttendanceResponseRow = {
  id: string;
  attendance_slot_id: string;
  candidate_id: string;
  response_token: string;
  delivery_status: "pending" | "sent" | "failed";
  responded_at: string | null;
  response_status: "pending" | "present" | "absent" | "issue";
  trainer_override_status: "pending" | "present" | "absent" | "issue" | null;
  trainer_override_note: string | null;
  candidates:
    | {
        first_name: string;
        last_name: string;
        email: string | null;
      }
    | {
        first_name: string;
        last_name: string;
        email: string | null;
      }[]
    | null;
};

function isMissingAttendanceError(error: { code?: string; message?: string; details?: string } | null) {
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    error?.code === "PGRST202" ||
    text.includes("attendance_slots") ||
    text.includes("attendance_responses") ||
    text.includes("get_attendance_response_by_token") ||
    text.includes("confirm_attendance_response")
  );
}

function enumerateSessionDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function buildDefaultSlotDefinitions(session: SessionItem) {
  const dates = enumerateSessionDates(session.start_date, session.end_date);

  return dates.flatMap((slotDate, index) => {
    const dayNumber = index + 1;

    return [
      {
        session_id: session.id,
        slot_label: `Jour ${dayNumber} - matin`,
        slot_date: slotDate,
        period: "morning" as const,
        status: "draft" as const
      },
      {
        session_id: session.id,
        slot_label: `Jour ${dayNumber} - apres-midi`,
        slot_date: slotDate,
        period: "afternoon" as const,
        status: "draft" as const
      }
    ];
  });
}

async function ensureAttendanceSlots(session: SessionItem) {
  const supabase = await createClient();
  const { data: existingSlots, error } = await supabase
    .from("attendance_slots")
    .select("id, session_id, slot_label, slot_date, period, status, sent_at, closed_at")
    .eq("session_id", session.id)
    .order("slot_date", { ascending: true });

  if (error) {
    if (isMissingAttendanceError(error)) {
      return null;
    }

    throw error;
  }

  if (existingSlots?.length) {
    return existingSlots as AttendanceSlotRow[];
  }

  const defaultSlots = buildDefaultSlotDefinitions(session);
  const { data: insertedSlots, error: insertError } = await supabase
    .from("attendance_slots")
    .insert(defaultSlots)
    .select("id, session_id, slot_label, slot_date, period, status, sent_at, closed_at")
    .order("slot_date", { ascending: true });

  if (insertError) {
    if (isMissingAttendanceError(insertError)) {
      return null;
    }

    throw insertError;
  }

  return (insertedSlots ?? []) as AttendanceSlotRow[];
}

async function ensureAttendanceResponses(slots: AttendanceSlotRow[], candidates: SessionCandidate[]) {
  if (!slots.length || !candidates.length) {
    return;
  }

  const supabase = await createClient();
  const slotIds = slots.map((slot) => slot.id);
  const { data: existingResponses, error } = await supabase
    .from("attendance_responses")
    .select("attendance_slot_id, candidate_id")
    .in("attendance_slot_id", slotIds);

  if (error) {
    if (isMissingAttendanceError(error)) {
      return;
    }

    throw error;
  }

  const existingKeys = new Set(
    (existingResponses ?? []).map((response) => `${response.attendance_slot_id}:${response.candidate_id}`)
  );

  const missingRows = slots.flatMap((slot) =>
    candidates
      .filter((candidateSession) => !existingKeys.has(`${slot.id}:${candidateSession.candidate.id}`))
      .map((candidateSession) => ({
        attendance_slot_id: slot.id,
        candidate_id: candidateSession.candidate.id,
        response_token: crypto.randomUUID().replace(/-/g, ""),
        delivery_channel: "email" as const,
        delivery_status: "pending" as const,
        response_status: "pending" as const
      }))
  );

  if (!missingRows.length) {
    return;
  }

  const { error: insertError } = await supabase.from("attendance_responses").insert(missingRows);

  if (insertError && !isMissingAttendanceError(insertError)) {
    throw insertError;
  }
}

export async function getAttendanceOverviewForSession(
  session: SessionItem,
  candidates: SessionCandidate[]
): Promise<AttendanceOverview> {
  const slots = await ensureAttendanceSlots(session);

  if (!slots) {
    return {
      enabled: false,
      slots: []
    };
  }

  await ensureAttendanceResponses(slots, candidates);

  const supabase = await createClient();
  const slotIds = slots.map((slot) => slot.id);

  if (!slotIds.length) {
    return {
      enabled: true,
      slots: []
    };
  }

  const { data: responseRows, error } = await supabase
    .from("attendance_responses")
    .select(
      "id, attendance_slot_id, candidate_id, response_token, delivery_status, responded_at, response_status, trainer_override_status, trainer_override_note, candidates(first_name, last_name, email)"
    )
    .in("attendance_slot_id", slotIds)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingAttendanceError(error)) {
      return {
        enabled: false,
        slots: []
      };
    }

    throw error;
  }

  const responsesBySlot = new Map<string, AttendanceResponseRow[]>();

  ((responseRows ?? []) as AttendanceResponseRow[]).forEach((response) => {
    const existing = responsesBySlot.get(response.attendance_slot_id) ?? [];
    existing.push(response);
    responsesBySlot.set(response.attendance_slot_id, existing);
  });

  const summaries: AttendanceSlotSummary[] = slots.map((slot) => {
    const slotResponses = (responsesBySlot.get(slot.id) ?? []).map((response): AttendanceCandidateResponse => {
      const candidateRecord = Array.isArray(response.candidates) ? response.candidates[0] : response.candidates;

      return {
        id: response.id,
        candidate_id: response.candidate_id,
        candidate_name: `${candidateRecord?.first_name ?? ""} ${candidateRecord?.last_name ?? ""}`.trim() || "Candidat",
        candidate_email: candidateRecord?.email ?? null,
        delivery_status: response.delivery_status,
        responded_at: response.responded_at,
        response_status: response.response_status,
        trainer_override_status: response.trainer_override_status,
        trainer_override_note: response.trainer_override_note
      };
    });

    const deliveredCount = slotResponses.filter((response) => response.delivery_status === "sent").length;
    const respondedCount = slotResponses.filter((response) => response.responded_at).length;
    const presentCount = slotResponses.filter((response) => (response.trainer_override_status ?? response.response_status) === "present").length;
    const absentCount = slotResponses.filter((response) => (response.trainer_override_status ?? response.response_status) === "absent").length;
    const issueCount = slotResponses.filter((response) => (response.trainer_override_status ?? response.response_status) === "issue").length;

    return {
      id: slot.id,
      session_id: slot.session_id,
      slot_label: slot.slot_label,
      slot_date: slot.slot_date,
      period: slot.period,
      status: slot.status,
      sent_at: slot.sent_at,
      closed_at: slot.closed_at,
      total_candidates: slotResponses.length,
      delivered_count: deliveredCount,
      responded_count: respondedCount,
      present_count: presentCount,
      absent_count: absentCount,
      issue_count: issueCount,
      pending_count: Math.max(slotResponses.length - respondedCount, 0),
      responses: slotResponses.sort((a, b) => a.candidate_name.localeCompare(b.candidate_name))
    };
  });

  return {
    enabled: true,
    slots: summaries
  };
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`La variable ${name} est requise pour l'emargement numerique.`);
  }

  return value;
}

function buildAttendanceResponseUrl(token: string) {
  const publicOrigin = resolvePublicAppOrigin();

  if (!publicOrigin) {
    throw new Error("Ajoute NEXT_PUBLIC_APP_URL ou APP_URL pour activer les liens d'emargement.");
  }

  const url = new URL("/attendance/respond", publicOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}

async function buildAttendanceEmailBody({
  candidateName,
  session,
  slot,
  url
}: {
  candidateName: string;
  session: SessionItem;
  slot: AttendanceSlotRow;
  url: string;
}) {
  const organization = await getOrganizationSettings();
  const senderName = organization.certificate_signatory_name || organization.organization_name;

  return [
    `Bonjour ${candidateName},`,
    "",
    `Merci de confirmer votre presence pour ${session.title}.`,
    `Creneau : ${slot.slot_label} (${slot.slot_date})`,
    `Lieu : ${session.location}`,
    "",
    "Cliquez sur le lien ci-dessous pour confirmer votre presence :",
    url,
    "",
    "Ce lien est personnel et doit etre utilise uniquement pour votre emargement.",
    "",
    "Cordialement,",
    organization.organization_name,
    senderName
  ].join("\n");
}

export async function sendAttendanceSlotRequests(slotId: string) {
  const supabase = await createClient();
  const { data: slot, error: slotError } = await supabase
    .from("attendance_slots")
    .select("id, session_id, slot_label, slot_date, period, status, sent_at, closed_at")
    .eq("id", slotId)
    .maybeSingle();

  if (slotError || !slot) {
    throw new Error("Creneau d'emargement introuvable.");
  }

  const { data: session, error: sessionError } = await supabase
    .from("training_sessions")
    .select("id, title, start_date, end_date, location, status, source_quote_id, trainer_id, trainer_user_id, trainer_name, duration_hours, created_at")
    .eq("id", slot.session_id)
    .maybeSingle<SessionItem>();

  if (sessionError || !session) {
    throw new Error("Session introuvable pour ce creneau.");
  }

  const { data: responses, error: responsesError } = await supabase
    .from("attendance_responses")
    .select("id, candidate_id, response_token, delivery_status, candidates(first_name, last_name, email)")
    .eq("attendance_slot_id", slotId);

  if (responsesError) {
    throw new Error("Impossible de charger les candidats pour ce creneau.");
  }

  const apiKey = requireEnv("BREVO_API_KEY");
  const fromEmail = requireEnv("BREVO_SENDER_EMAIL");
  const fromName = process.env.BREVO_SENDER_NAME?.trim() || (await getOrganizationSettings()).organization_name;

  for (const response of responses ?? []) {
    const candidateRecord = Array.isArray(response.candidates) ? response.candidates[0] : response.candidates;

    if (!candidateRecord?.email) {
      await supabase
        .from("attendance_responses")
        .update({
          delivery_status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", response.id);
      continue;
    }

    const candidateName = `${candidateRecord.first_name} ${candidateRecord.last_name}`.trim() || candidateRecord.email;
    const responseUrl = buildAttendanceResponseUrl(response.response_token);
    const body = await buildAttendanceEmailBody({
      candidateName,
      session,
      slot: slot as AttendanceSlotRow,
      url: responseUrl
    });

    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
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
            email: candidateRecord.email,
            name: candidateName
          }
        ],
        subject: `Confirmation de presence - ${session.title} - ${slot.slot_label}`,
        textContent: body
      })
    });

    if (!emailResponse.ok) {
      await supabase
        .from("attendance_responses")
        .update({
          delivery_status: "failed",
          updated_at: new Date().toISOString()
        })
        .eq("id", response.id);
      continue;
    }

    await supabase
      .from("attendance_responses")
      .update({
        delivery_status: "sent",
        delivery_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", response.id);
  }

  const now = new Date().toISOString();
  const { error: updateSlotError } = await supabase
    .from("attendance_slots")
    .update({
      status: "open",
      sent_at: slot.sent_at ?? now,
      updated_at: now
    })
    .eq("id", slotId);

  if (updateSlotError) {
    throw new Error("Les demandes ont ete envoyees mais le statut du creneau n'a pas pu etre mis a jour.");
  }
}

export async function closeAttendanceSlot(slotId: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("attendance_slots")
    .update({
      status: "closed",
      closed_at: now,
      updated_at: now
    })
    .eq("id", slotId);

  if (error) {
    throw new Error("Impossible de cloturer ce creneau.");
  }
}

function extractPublicAttendanceRow(data: unknown): PublicAttendanceResponse | null {
  const row = Array.isArray(data) ? data[0] : data;

  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;

  return {
    response_id: String(record.response_id ?? ""),
    token: String(record.token ?? ""),
    slot_id: String(record.slot_id ?? ""),
    slot_label: String(record.slot_label ?? ""),
    slot_date: String(record.slot_date ?? ""),
    session_id: String(record.session_id ?? ""),
    session_title: String(record.session_title ?? ""),
    session_location: String(record.session_location ?? ""),
    candidate_id: String(record.candidate_id ?? ""),
    candidate_name: String(record.candidate_name ?? ""),
    candidate_email: typeof record.candidate_email === "string" ? record.candidate_email : null,
    response_status:
      record.response_status === "present" || record.response_status === "absent" || record.response_status === "issue"
        ? record.response_status
        : "pending",
    trainer_override_status:
      record.trainer_override_status === "present" ||
      record.trainer_override_status === "absent" ||
      record.trainer_override_status === "issue"
        ? record.trainer_override_status
        : null,
    responded_at: typeof record.responded_at === "string" ? record.responded_at : null
  };
}

export async function getPublicAttendanceResponse(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_attendance_response_by_token", {
    p_token: token
  });

  if (error) {
    if (isMissingAttendanceError(error)) {
      return null;
    }

    throw error;
  }

  return extractPublicAttendanceRow(data);
}

export async function confirmAttendanceResponse(input: {
  token: string;
  responseStatus: "present" | "absent" | "issue";
  ipAddress: string | null;
  userAgent: string | null;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("confirm_attendance_response", {
    p_token: input.token,
    p_response_status: input.responseStatus,
    p_ip: input.ipAddress,
    p_user_agent: input.userAgent
  });

  if (error) {
    if (isMissingAttendanceError(error)) {
      throw new Error("Les fonctions Supabase d'emargement ne sont pas encore en place.");
    }

    throw error;
  }

  return extractPublicAttendanceRow(data);
}
