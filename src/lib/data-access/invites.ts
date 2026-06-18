import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { AppRole } from "@/lib/auth/types";

export type OrganizationInvite = {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: AppRole;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
};

export async function listOrganizationInvites(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_invites")
    .select("id, email, role, status, token, expires_at, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load invites: ${error.message}`);
  }

  return ((data ?? []) as InviteRow[]).map((invite) => ({
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    token: invite.token,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
  })) satisfies OrganizationInvite[];
}

export async function createOrganizationInvite({
  orgId,
  email,
  role,
  createdBy,
}: {
  orgId: string;
  email: string;
  role: AppRole;
  createdBy: string;
}) {
  const supabase = await createClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: orgId,
      email,
      role,
      token: crypto.randomUUID(),
      status: "pending",
      expires_at: expiresAt.toISOString(),
      created_by: createdBy,
    })
    .select("id, email, role, status, token, expires_at, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create invite: ${error.message}`);
  }

  const invite = data as InviteRow;

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    token: invite.token,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
  } satisfies OrganizationInvite;
}

export async function acceptOrganizationInvite(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("accept_organization_invite", {
    invite_token: token,
  });

  if (error) {
    throw new Error(`Failed to accept invite: ${error.message}`);
  }

  return data;
}
