"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import type { AppRole } from "@/lib/auth/types";
import { createActivityLog } from "@/lib/data-access/activity-log";
import { createOrganizationInvite } from "@/lib/data-access/invites";
import { updateOrganizationMember } from "@/lib/data-access/memberships";

const allowedRoles = new Set<AppRole>(["admin", "manager", "employee"]);
const allowedStatuses = new Set(["active", "disabled"]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithParam(key: "error" | "message", value: string): never {
  redirect(`/admin/members?${key}=${encodeURIComponent(value)}`);
}

export async function createInvite(formData: FormData) {
  const context = await requireRole("admin");
  const email = getString(formData, "email").toLowerCase();
  const role = getString(formData, "role") as AppRole;

  if (!email) {
    redirectWithParam("error", "Invite email is required.");
  }

  if (!allowedRoles.has(role)) {
    redirectWithParam("error", "Choose a valid role.");
  }

  const invite = await createOrganizationInvite({
    orgId: context.orgId,
    email,
    role,
    createdBy: context.userId,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "invite.created",
    targetType: "organization_invite",
    targetId: invite.id,
    metadata: { email, role },
  });

  revalidatePath("/admin/members");
  redirectWithParam("message", "Invite created.");
}

export async function updateMember(formData: FormData) {
  const context = await requireRole("admin");
  const membershipId = getString(formData, "membershipId");
  const role = getString(formData, "role") as AppRole;
  const status = getString(formData, "status") as "active" | "disabled";
  const departmentId = getString(formData, "departmentId") || null;

  if (!membershipId) {
    redirectWithParam("error", "Member is required.");
  }

  if (!allowedRoles.has(role)) {
    redirectWithParam("error", "Choose a valid role.");
  }

  if (!allowedStatuses.has(status)) {
    redirectWithParam("error", "Choose a valid status.");
  }

  try {
    await updateOrganizationMember({
      orgId: context.orgId,
      membershipId,
      role,
      status,
      departmentId,
    });

    await createActivityLog({
      orgId: context.orgId,
      userId: context.userId,
      action: "member.updated",
      targetType: "membership",
      targetId: membershipId,
      metadata: { role, status, departmentId },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update member.";
    redirectWithParam("error", message);
  }

  revalidatePath("/admin/members");
  redirectWithParam("message", "Member updated.");
}
