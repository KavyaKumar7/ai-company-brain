"use server";

import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { acceptOrganizationInvite } from "@/lib/data-access/invites";

export async function acceptInvite(formData: FormData) {
  const tokenValue = formData.get("token");
  const token = typeof tokenValue === "string" ? tokenValue.trim() : "";

  if (!token) {
    redirect("/dashboard");
  }

  await requireRole("employee");
  await acceptOrganizationInvite(token);

  redirect("/dashboard");
}
