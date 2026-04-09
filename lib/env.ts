const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

export function getMissingSupabaseEnvVars() {
  return required.filter((key) => !process.env[key]);
}

export function hasSupabaseEnv() {
  return getMissingSupabaseEnvVars().length === 0;
}

export function getSupabaseEnvMessage() {
  const missing = getMissingSupabaseEnvVars();

  if (missing.length === 0) {
    return null;
  }

  return `Supabase n'est pas configuré. Variables manquantes : ${missing.join(", ")}. Ajoute-les dans .env.local puis redémarre le serveur Next.js.`;
}

export function ensureEnv() {
  const message = getSupabaseEnvMessage();

  if (message) {
    throw new Error(message);
  }
}
