import { AI_MODULES, AI_QUIZZES, type TrainingModuleTemplate } from "@/lib/constants/ai-modules";
import { SST_MODULES } from "@/lib/constants/sst-modules";
import type { TrainingType } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { normalizeTrainingType } from "@/lib/training-programs";

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

function getModuleTemplates(trainingType: TrainingType): TrainingModuleTemplate[] {
  if (trainingType === "ai") {
    return AI_MODULES;
  }

  return SST_MODULES.map((module) => ({
    key: module.key,
    order: module.order,
    title: module.title,
    description: module.description,
    estimatedMinutes: null,
    textContent: module.textContent,
    trainerGuidance: "",
    videoUrl: module.videoUrl,
    pdfUrl: module.pdfUrl
  }));
}

export async function ensureDefaultModulesForSession(trainingTypeInput: unknown) {
  const trainingType = normalizeTrainingType(trainingTypeInput);
  const defaultModules = getModuleTemplates(trainingType);
  const supabase = await createClient();

  const { data: existingModules, error: existingModulesError } = await supabase
    .from("training_modules")
    .select("id, module_key")
    .eq("training_type", trainingType);

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "training_modules",
    query: 'select("id, module_key").eq("training_type", trainingType)',
    error: existingModulesError
  });

  if (existingModulesError) {
    throw existingModulesError;
  }

  // Preserve the established programme for the existing non-IA formations.
  // Only IA is rebuilt here with stable module keys and its dedicated content.
  if (trainingType !== "ai" && (existingModules?.length ?? 0) > 0) {
    return;
  }

  const existingKeys = new Set((existingModules ?? []).map((module) => module.module_key).filter(Boolean));
  const missingModules = defaultModules
    .filter((module) => !existingKeys.has(module.key))
    .map((module) => ({
      training_type: trainingType,
      module_key: module.key,
      title: module.title,
      summary: module.description,
      module_order: module.order,
      estimated_minutes: module.estimatedMinutes,
      content_text: module.textContent,
      video_url: module.videoUrl,
      pdf_url: module.pdfUrl,
      trainer_guidance: module.trainerGuidance || null,
      module_type: "child",
      is_active: true
    }));

  if (missingModules.length) {
    const { error: insertError } = await supabase.from("training_modules").insert(missingModules);

    logSupabaseQueryError({
      file: "lib/session-modules.ts",
      table: "training_modules",
      query: 'insert(missingModules)',
      error: insertError
    });

    if (insertError) {
      throw insertError;
    }
  }

  if (trainingType !== "ai") return;

  const { data: aiModules, error: aiModulesError } = await supabase
    .from("training_modules")
    .select("id, module_key")
    .eq("training_type", "ai");

  if (aiModulesError) throw aiModulesError;

  const moduleIdByKey = new Map((aiModules ?? []).map((module) => [module.module_key, module.id]));
  const moduleIds = [...moduleIdByKey.values()];
  const { data: existingQuizzes, error: existingQuizzesError } = moduleIds.length
    ? await supabase.from("training_quizzes").select("module_id, question").in("module_id", moduleIds)
    : { data: [], error: null };

  if (existingQuizzesError) throw existingQuizzesError;

  const existingQuizKeys = new Set((existingQuizzes ?? []).map((quiz) => `${quiz.module_id}:${quiz.question}`));
  const missingQuizzes = AI_QUIZZES.flatMap((quiz) => {
    const moduleId = moduleIdByKey.get(quiz.moduleKey);
    if (!moduleId || existingQuizKeys.has(`${moduleId}:${quiz.question}`)) return [];

    return [{
      module_id: moduleId,
      question: quiz.question,
      option_a: quiz.optionA,
      option_b: quiz.optionB,
      option_c: quiz.optionC,
      option_d: quiz.optionD,
      correct_answer: quiz.correctAnswer,
      explanation: quiz.explanation
    }];
  });

  if (missingQuizzes.length) {
    const { error: quizzesInsertError } = await supabase.from("training_quizzes").insert(missingQuizzes);
    if (quizzesInsertError) throw quizzesInsertError;
  }
}

export async function initializeSessionModuleProgress(sessionId: string, trainingTypeInput: unknown) {
  const trainingType = normalizeTrainingType(trainingTypeInput);
  await ensureDefaultModulesForSession(trainingType);

  const supabase = await createClient();

  const { data: modules, error: modulesError } = await supabase
    .from("training_modules")
    .select("id, module_order, is_active")
    .eq("training_type", trainingType)
    .eq("is_active", true)
    .order("module_order", { ascending: true })
    .order("id", { ascending: true });

  logSupabaseQueryError({
    file: "lib/session-modules.ts",
    table: "training_modules",
    query: 'select("id, module_order, is_active").eq("training_type", trainingType).eq("is_active", true).order("module_order").order("id")',
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
