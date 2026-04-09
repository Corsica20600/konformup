import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = {
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email ?? "Utilisateur",
    role: "trainer" as const
  };

  return { user, profile, supabase };
}
