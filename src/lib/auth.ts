import "server-only";
import { createClient, supabaseConfigured } from "@/lib/supabase/server";
import { adminClient, adminConfigured } from "@/lib/supabase/admin";

export interface Member {
  id: string;
  email: string;
  pseudonym: string;
  display_name: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  x_url: string | null;
}

export async function getUser() {
  if (!supabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** The signed-in visitor's member row, or null when signed out or unconfigured. */
export async function getMember(): Promise<Member | null> {
  const user = await getUser();
  if (!user || !adminConfigured()) return null;
  try {
    const { data } = await adminClient().from("members").select("id,email,pseudonym,display_name,avatar_url,linkedin_url,x_url").eq("auth_id", user.id).maybeSingle();
    return (data as Member | null) ?? null;
  } catch {
    return null;
  }
}
