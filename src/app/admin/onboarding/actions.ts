"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import type { AppRole } from "@/lib/auth/types";
import { createActivityLog } from "@/lib/data-access/activity-log";
import {
  createOnboardingAssignment,
  createOnboardingLesson,
  createOnboardingModule,
  createOnboardingPath,
  updateOnboardingAssignmentStatus,
  updateOnboardingPathStatus,
} from "@/lib/data-access/onboarding";

const allowedRoles = new Set<AppRole>(["admin", "manager", "employee"]);
const allowedStatuses = new Set(["draft", "published", "archived"]);
const allowedAssignmentStatuses = new Set([
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, key: string, fallback: number) {
  const value = Number(getString(formData, key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function redirectWithParam(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

export async function createPathAction(formData: FormData) {
  const context = await requireRole("manager");
  const title = getString(formData, "title");
  const description = getString(formData, "description") || null;
  const targetRole = getString(formData, "targetRole") as AppRole;
  const departmentId = getString(formData, "departmentId") || null;

  if (!title) {
    redirectWithParam("/admin/onboarding", "error", "Path title is required.");
  }

  if (!allowedRoles.has(targetRole)) {
    redirectWithParam("/admin/onboarding", "error", "Choose a valid target role.");
  }

  const path = await createOnboardingPath({
    orgId: context.orgId,
    title,
    description,
    targetRole,
    departmentId,
    createdBy: context.userId,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_path.created",
    targetType: "onboarding_path",
    targetId: path.id,
    metadata: { title, targetRole, departmentId },
  });

  revalidatePath("/admin/onboarding");
  redirect(`/admin/onboarding/${path.id}?message=${encodeURIComponent("Path created.")}`);
}

export async function createModuleAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const title = getString(formData, "title");
  const description = getString(formData, "description") || null;
  const orderIndex = getNumber(formData, "orderIndex", 1);
  const estimatedMinutes = getNumber(formData, "estimatedMinutes", 15);
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !title) {
    redirectWithParam(pagePath, "error", "Module title is required.");
  }

  const onboardingModule = await createOnboardingModule({
    orgId: context.orgId,
    pathId,
    title,
    description,
    orderIndex,
    estimatedMinutes,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_module.created",
    targetType: "onboarding_module",
    targetId: onboardingModule.id,
    metadata: { pathId, title, orderIndex, estimatedMinutes },
  });

  revalidatePath(pagePath);
  redirectWithParam(pagePath, "message", "Module added.");
}

export async function createLessonAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const moduleId = getString(formData, "moduleId");
  const title = getString(formData, "title");
  const content = getString(formData, "content") || null;
  const orderIndex = getNumber(formData, "orderIndex", 1);
  const estimatedMinutes = getNumber(formData, "estimatedMinutes", 5);
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !moduleId || !title) {
    redirectWithParam(pagePath, "error", "Lesson title is required.");
  }

  const lesson = await createOnboardingLesson({
    orgId: context.orgId,
    moduleId,
    title,
    content,
    orderIndex,
    estimatedMinutes,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_lesson.created",
    targetType: "onboarding_lesson",
    targetId: lesson.id,
    metadata: { pathId, moduleId, title, orderIndex, estimatedMinutes },
  });

  revalidatePath(pagePath);
  redirectWithParam(pagePath, "message", "Lesson added.");
}

export async function updatePathStatusAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const status = getString(formData, "status") as "draft" | "published" | "archived";
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !allowedStatuses.has(status)) {
    redirectWithParam("/admin/onboarding", "error", "Choose a valid status.");
  }

  await updateOnboardingPathStatus({
    orgId: context.orgId,
    pathId,
    status,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_path.status_updated",
    targetType: "onboarding_path",
    targetId: pathId,
    metadata: { status },
  });

  revalidatePath(pagePath);
  revalidatePath("/admin/onboarding");
  redirectWithParam(pagePath, "message", "Path status updated.");
}

export async function assignPathAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const userId = getString(formData, "userId");
  const dueDate = getString(formData, "dueDate") || null;
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !userId) {
    redirectWithParam(pagePath, "error", "Choose a member to assign.");
  }

  try {
    const assignment = await createOnboardingAssignment({
      orgId: context.orgId,
      pathId,
      userId,
      assignedBy: context.userId,
      dueDate,
    });

    await createActivityLog({
      orgId: context.orgId,
      userId: context.userId,
      action: "onboarding_assignment.created",
      targetType: "onboarding_assignment",
      targetId: assignment.id,
      metadata: { pathId, assignedUserId: userId, dueDate },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to assign path.";
    redirectWithParam(pagePath, "error", message);
  }

  revalidatePath(pagePath);
  redirectWithParam(pagePath, "message", "Path assigned.");
}

export async function updateAssignmentStatusAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const assignmentId = getString(formData, "assignmentId");
  const status = getString(formData, "status") as
    | "assigned"
    | "in_progress"
    | "completed"
    | "cancelled";
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !assignmentId || !allowedAssignmentStatuses.has(status)) {
    redirectWithParam(pagePath, "error", "Choose a valid assignment status.");
  }

  await updateOnboardingAssignmentStatus({
    orgId: context.orgId,
    assignmentId,
    status,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_assignment.status_updated",
    targetType: "onboarding_assignment",
    targetId: assignmentId,
    metadata: { pathId, status },
  });

  revalidatePath(pagePath);
  revalidatePath("/admin/progress");
  revalidatePath("/learning");
  redirectWithParam(pagePath, "message", "Assignment updated.");
}
