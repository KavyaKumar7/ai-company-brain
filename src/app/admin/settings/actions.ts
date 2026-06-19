"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createActivityLog } from "@/lib/data-access/activity-log";
import { updateOrganizationName } from "@/lib/data-access/organizations";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithParam(key: "error" | "message", value: string): never {
  redirect(`/admin/settings?${key}=${encodeURIComponent(value)}`);
}

export async function updateOrganizationSettings(formData: FormData) {
  const context = await requireRole("admin");
  const name = getString(formData, "name");

  if (!name) {
    redirectWithParam("error", "Organization name is required.");
  }

  await updateOrganizationName(context.orgId, name);

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "organization.updated",
    targetType: "organization",
    targetId: context.orgId,
    metadata: { name },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/dashboard");
  redirectWithParam("message", "Organization updated.");
}
