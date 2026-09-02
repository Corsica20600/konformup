import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const PUBLIC_TRAINING_LABELS: Record<string, string> = {
  sst_initial: "Formation SST initiale",
  mac_sst: "MAC SST",
  hygiene: "Formation Hygiène",
  ai: "Formation Intelligence artificielle"
};

export type PublicTrainingSession = {
  id: string;
  trainingType: "sst_initial" | "mac_sst" | "hygiene" | "ai";
  label: string;
  startDate: string;
  endDate: string;
  location: string;
};

/** Minimal public projection. Intra sessions, company data and all participant information stay private. */
export async function listPublicTrainingSessions(): Promise<PublicTrainingSession[]> {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, training_type, start_date, end_date, location")
    .eq("session_format", "inter")
    .in("status", ["draft", "scheduled", "in_progress"])
    .gte("end_date", today)
    .order("start_date", { ascending: true });

  if (error) throw new Error("Impossible de charger le planning public.");

  return (data ?? []).flatMap((session) => {
    const trainingType = session.training_type;
    const label = PUBLIC_TRAINING_LABELS[trainingType];
    if (!label) return [];

    return [{
      id: session.id,
      trainingType: trainingType as PublicTrainingSession["trainingType"],
      label,
      startDate: session.start_date,
      endDate: session.end_date,
      location: session.location
    }];
  });
}
