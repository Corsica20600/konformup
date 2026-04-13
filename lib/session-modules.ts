import { SST_MODULES } from "@/lib/constants/sst-modules";
import { createClient } from "@/lib/supabase/server";

function logSupabaseQueryError({
  file,
  table,
  query,
  error
}: {
  file: string;
  table: string;
  query: string;
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  } | null;
}) {
  if (!error) {
    return;
  }

  console.error("[supabase-query-error]", {
    file,
    table,
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}

export async function ensureDefaultModulesForSession() {
  const supabase = await createClient();

  const { data: existingModules, error: existingModulesError } = await supabase
    .from("training_modules")
    .select("id")
    .limit(1);

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "training_modules",
    query: 'select("id").limit(1)',
    error: existingModulesError
  });

  if (existingModulesError) {
    throw existingModulesError;
  }

  if ((existingModules?.length ?? 0) > 0) {
    return;
  }

  const defaultModules = SST_MODULES.map((module) => ({
    title: module.title,
    summary: module.description,
    module_order: module.order,
    content_text: module.textContent,
    video_url: module.videoUrl,
    pdf_url: module.pdfUrl,
    trainer_guidance: null
  }));

  const { error: insertError } = await supabase.from("training_modules").insert(defaultModules);

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "training_modules",
    query: 'insert(defaultModules)',
    error: insertError
  });

  if (insertError) {
    throw insertError;
  }
}

export async function initializeSessionModuleProgress(sessionId: string) {
  await ensureDefaultModulesForSession();

  const supabase = await createClient();

  const { data: modules, error: modulesError } = await supabase
    .from("training_modules")
    .select("id, module_order, is_active")
    .eq("is_active", true)
    .order("module_order", { ascending: true })
    .order("id", { ascending: true });

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "training_modules",
    query: 'select("id, module_order, is_active").eq("is_active", true).order("module_order").order("id")',
    error: modulesError
  });

  if (modulesError) {
    throw modulesError;
  }

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("session_module_progress")
    .select("module_id")
    .eq("session_id", sessionId);

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "session_module_progress",
    query: 'select("module_id").eq("session_id", sessionId)',
    error: existingRowsError
  });

  if (existingRowsError) {
    throw existingRowsError;
  }

  const existingModuleIds = new Set((existingRows ?? []).map((row) => row.module_id));
  const missingRows = (modules ?? [])
    .filter((trainingModule) => !existingModuleIds.has(trainingModule.id))
    .map((trainingModule) => ({
      session_id: sessionId,
      module_id: trainingModule.id
    }));

  if (!missingRows.length) {
    return;
  }

  const { error: insertError } = await supabase
    .from("session_module_progress")
    .insert(missingRows);

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "session_module_progress",
    query: 'insert(missingRows)',
    error: insertError
  });

  if (insertError) {
    throw insertError;
  }
}
