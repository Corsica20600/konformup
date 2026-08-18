import "server-only";

import { createClient } from "@supabase/supabase-js";
import { ensureEnv } from "@/lib/env";

/** Service-role access is restricted to server-only token resolution. Never import this module from client code. */
export function createAdminClient() {
  ensureEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("Configuration Supabase serveur incomplète.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
