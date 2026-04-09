"use client";

import { createBrowserClient } from "@supabase/ssr";
import { ensureEnv } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (client) return client;

  ensureEnv();
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
