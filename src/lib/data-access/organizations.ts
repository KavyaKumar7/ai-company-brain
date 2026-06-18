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

export async function updateOrganizationName(orgId: string, name: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", orgId)
    .select("id, name, slug")
    .single();

  if (error) {
    throw new Error(`Failed to update organization: ${error.message}`);
  }

  return data;
}
