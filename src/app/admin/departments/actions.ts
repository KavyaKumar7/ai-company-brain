"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createDepartment, updateDepartment } from "@/lib/data-access/departments";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectWithParam(key: "error" | "message", value: string): never {
  redirect(`/admin/departments?${key}=${encodeURIComponent(value)}`);
}

export async function createDepartmentAction(formData: FormData) {
  const context = await requireRole("admin");
  const name = getString(formData, "name");
  const description = getString(formData, "description") || null;

  if (!name) {
    redirectWithParam("error", "Department name is required.");
  }

  await createDepartment({
    orgId: context.orgId,
    name,
    description,
  });

  revalidatePath("/admin/departments");
  redirectWithParam("message", "Department created.");
}

export async function updateDepartmentAction(formData: FormData) {
  const context = await requireRole("admin");
  const departmentId = getString(formData, "departmentId");
  const name = getString(formData, "name");
  const description = getString(formData, "description") || null;

  if (!departmentId || !name) {
    redirectWithParam("error", "Department and name are required.");
  }

  await updateDepartment({
    orgId: context.orgId,
    departmentId,
    name,
    description,
  });

  revalidatePath("/admin/departments");
  redirectWithParam("message", "Department updated.");
}
