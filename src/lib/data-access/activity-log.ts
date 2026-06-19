import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ActivityLogEntry = {
  id: string;
  userId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  profile: {
    email: string;
    fullName: string | null;
  } | null;
};

type ActivityLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  profiles:
    | {
        email: string;
        full_name: string | null;
      }
    | {
        email: string;
        full_name: string | null;
      }[]
    | null;
};

function normalizeProfile(row: ActivityLogRow["profiles"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

export async function createActivityLog({
  orgId,
  userId,
  action,
  targetType,
  targetId = null,
  metadata = {},
}: {
  orgId: string;
  userId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("activity_log").insert({
    organization_id: orgId,
    user_id: userId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });

  if (error) {
    throw new Error(`Failed to create activity log: ${error.message}`);
  }
}

export async function listRecentActivityLogs({
  orgId,
  limit = 8,
}: {
  orgId: string;
  limit?: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select(
      `
        id,
        user_id,
        action,
        target_type,
        target_id,
        metadata,
        created_at,
        profiles (
          email,
          full_name
        )
      `
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load activity logs: ${error.message}`);
  }

  return ((data ?? []) as ActivityLogRow[]).map((entry) => {
    const profile = normalizeProfile(entry.profiles);

    return {
      id: entry.id,
      userId: entry.user_id,
      action: entry.action,
      targetType: entry.target_type,
      targetId: entry.target_id,
      metadata: entry.metadata,
      createdAt: entry.created_at,
      profile: profile
        ? {
            email: profile.email,
            fullName: profile.full_name,
          }
        : null,
    } satisfies ActivityLogEntry;
  });
}
