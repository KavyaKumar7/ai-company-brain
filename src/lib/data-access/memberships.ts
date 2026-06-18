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

export type OrganizationMember = {
  id: string;
  userId: string;
  role: AppRole;
  status: string;
  departmentId: string | null;
  departmentName: string | null;
  createdAt: string;
  profile: {
    email: string;
    fullName: string | null;
  } | null;
};

type MembershipWithProfileRow = {
  id: string;
  user_id: string;
  role: AppRole;
  status: string;
  department_id: string | null;
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
  departments:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function normalizeProfile(row: MembershipWithProfileRow["profiles"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

function normalizeDepartment(row: MembershipWithProfileRow["departments"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

export async function listOrganizationMembers(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select(
      `
        id,
        user_id,
        role,
        status,
        department_id,
        created_at,
        profiles (
          email,
          full_name
        ),
        departments (
          name
        )
      `
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  return ((data ?? []) as MembershipWithProfileRow[]).map((member) => {
    const profile = normalizeProfile(member.profiles);
    const department = normalizeDepartment(member.departments);

    return {
      id: member.id,
      userId: member.user_id,
      role: member.role,
      status: member.status,
      departmentId: member.department_id,
      departmentName: department?.name ?? null,
      createdAt: member.created_at,
      profile: profile
        ? {
            email: profile.email,
            fullName: profile.full_name,
          }
        : null,
    } satisfies OrganizationMember;
  });
}

export async function updateOrganizationMember({
  orgId,
  membershipId,
  role,
  status,
  departmentId,
}: {
  orgId: string;
  membershipId: string;
  role: AppRole;
  status: "active" | "disabled";
  departmentId: string | null;
}) {
  const supabase = await createClient();

  const { data: currentMember, error: currentMemberError } = await supabase
    .from("memberships")
    .select("id, role, status")
    .eq("organization_id", orgId)
    .eq("id", membershipId)
    .single();

  if (currentMemberError) {
    throw new Error(`Failed to load member: ${currentMemberError.message}`);
  }

  if (
    currentMember.role === "admin" &&
    currentMember.status === "active" &&
    (role !== "admin" || status !== "active")
  ) {
    const { count, error: countError } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("role", "admin")
      .eq("status", "active");

    if (countError) {
      throw new Error(`Failed to count admins: ${countError.message}`);
    }

    if ((count ?? 0) <= 1) {
      throw new Error("You cannot change the last active admin.");
    }
  }

  const { data, error } = await supabase
    .from("memberships")
    .update({
      role,
      status,
      department_id: departmentId,
    })
    .eq("organization_id", orgId)
    .eq("id", membershipId)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to update member: ${error.message}`);
  }

  return data;
}
