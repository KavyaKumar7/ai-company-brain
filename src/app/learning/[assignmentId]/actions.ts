"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/auth/get-org-context";
import { createActivityLog } from "@/lib/data-access/activity-log";
import { completeLesson } from "@/lib/data-access/onboarding";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function completeLessonAction(formData: FormData) {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  const assignmentId = getString(formData, "assignmentId");
  const lessonId = getString(formData, "lessonId");

  if (!assignmentId || !lessonId) {
    redirect("/learning");
  }

  await completeLesson({
    orgId: context.orgId,
    assignmentId,
    lessonId,
    userId: context.userId,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "lesson.completed",
    targetType: "onboarding_lesson",
    targetId: lessonId,
    metadata: { assignmentId },
  });

  revalidatePath(`/learning/${assignmentId}`);
  revalidatePath("/learning");
  redirect(`/learning/${assignmentId}`);
}
