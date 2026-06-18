import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { AppRole } from "@/lib/auth/types";

type MembershipWithOrg = {
  user_id: string;
  role: AppRole;
  status: string;
  organizations: {
    id: string;
    name: string;
  } | null;
};

export async function getActiveMembershipForUser(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select(
      `
        user_id,
        role,
        status,
        organizations (
          id,
          name
        )
      `
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load membership: ${error.message}`);
  }

  return data as MembershipWithOrg | null;
}
