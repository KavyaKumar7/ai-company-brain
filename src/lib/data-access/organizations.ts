import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getOrganizationById(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load organization: ${error.message}`);
  }

  return data;
}
