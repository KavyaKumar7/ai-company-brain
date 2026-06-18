import "server-only";

import { getActiveMembershipForUser } from "@/lib/data-access/memberships";
import { getProfileById } from "@/lib/data-access/profiles";

import { getCurrentUser } from "./get-current-user";
import type { OrgContext } from "./types";

export async function getOrgContext(): Promise<OrgContext | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [membership, profile] = await Promise.all([
    getActiveMembershipForUser(user.id),
    getProfileById(user.id),
  ]);

  if (!membership?.organizations) {
    return null;
  }

  return {
    userId: user.id,
    orgId: membership.organizations.id,
    organizationName: membership.organizations.name,
    role: membership.role,
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.full_name ?? null,
  };
}
