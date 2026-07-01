"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import type { AppRole } from "@/lib/auth/types";
import { generateOnboardingDraft } from "@/lib/ai/onboarding-generator";
import { createActivityLog } from "@/lib/data-access/activity-log";
import { listDepartments } from "@/lib/data-access/departments";
import { listDocumentChunks, listDocuments } from "@/lib/data-access/documents";
import {
  createGeneratedOnboardingPath,
  createOnboardingAssignment,
  createOnboardingLesson,
  createOnboardingModule,
  createOnboardingPath,
  getOnboardingPathWithModules,
  updateOnboardingAssignmentStatus,
  updateOnboardingLesson,
  updateOnboardingPathStatus,
  updateOnboardingQuizQuestion,
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

export async function generatePathAction(formData: FormData) {
  const context = await requireRole("manager");
  const pagePath = "/admin/onboarding";
  const title = getString(formData, "title");
  const targetRole = getString(formData, "targetRole") as AppRole;
  const departmentId = getString(formData, "departmentId") || null;
  const durationDays = Math.min(30, getNumber(formData, "durationDays", 5));
  const selectedDocumentIds = [
    ...new Set(
      formData
        .getAll("documentIds")
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    ),
  ];

  if (!title || !allowedRoles.has(targetRole)) {
    redirectWithParam(pagePath, "error", "Add a title and choose a valid target role.");
  }

  if (selectedDocumentIds.length < 1 || selectedDocumentIds.length > 3) {
    redirectWithParam(pagePath, "error", "Choose between 1 and 3 approved documents.");
  }

  let generatedPathId = "";

  try {
    const [documents, departments] = await Promise.all([
      listDocuments(context.orgId),
      listDepartments(context.orgId),
    ]);
    const approvedById = new Map(
      documents
        .filter((document) => document.status === "approved")
        .map((document) => [document.id, document])
    );

    if (selectedDocumentIds.some((id) => !approvedById.has(id))) {
      throw new Error("Every selected source must be approved.");
    }

    const sourceDocuments = await Promise.all(
      selectedDocumentIds.map(async (documentId) => {
        const document = approvedById.get(documentId)!;
        const chunks = await listDocumentChunks({
          orgId: context.orgId,
          documentId,
        });

        if (chunks.length === 0) {
          throw new Error(`"${document.title}" has no extracted text. Reprocess it in Knowledge first.`);
        }

        return {
          id: document.id,
          title: document.title,
          content: chunks.map((chunk) => chunk.content).join("\n\n").slice(0, 35_000),
        };
      })
    );
    const department = departmentId
      ? departments.find((item) => item.id === departmentId)?.name ?? null
      : null;
    const draft = await generateOnboardingDraft({
      title,
      targetRole,
      department,
      durationDays,
      documents: sourceDocuments,
    });
    generatedPathId = await createGeneratedOnboardingPath({
      orgId: context.orgId,
      createdBy: context.userId,
      title,
      targetRole,
      departmentId,
      sourceDocumentIds: selectedDocumentIds,
      draft,
    });

    await createActivityLog({
      orgId: context.orgId,
      userId: context.userId,
      action: "onboarding_path.ai_generated",
      targetType: "onboarding_path",
      targetId: generatedPathId,
      metadata: {
        title,
        targetRole,
        durationDays,
        sourceDocumentIds: selectedDocumentIds,
        moduleCount: draft.modules.length,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not generate onboarding.";
    redirectWithParam(pagePath, "error", message);
  }

  revalidatePath(pagePath);
  redirectWithParam(
    `/admin/onboarding/${generatedPathId}`,
    "message",
    "AI draft generated. Review every lesson and quiz before publishing."
  );
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

export async function updateLessonAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const lessonId = getString(formData, "lessonId");
  const title = getString(formData, "title");
  const content = getString(formData, "content");
  const estimatedMinutes = getNumber(formData, "estimatedMinutes", 5);
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !lessonId || !title || !content) {
    redirectWithParam(pagePath, "error", "Lesson title and content are required.");
  }

  await updateOnboardingLesson({
    orgId: context.orgId,
    lessonId,
    title,
    content,
    estimatedMinutes,
  });
  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_lesson.updated",
    targetType: "onboarding_lesson",
    targetId: lessonId,
    metadata: { pathId },
  });

  revalidatePath(pagePath);
  redirectWithParam(pagePath, "message", "Lesson updated.");
}

export async function updateQuizQuestionAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const questionId = getString(formData, "questionId");
  const prompt = getString(formData, "prompt");
  const explanation = getString(formData, "explanation");
  const options = [0, 1, 2, 3].map((index) => getString(formData, `option${index}`));
  const correctOptionIndex = Number(getString(formData, "correctOptionIndex"));
  const correctAnswer = options[correctOptionIndex] ?? "";
  const pagePath = `/admin/onboarding/${pathId}`;

  if (
    !pathId ||
    !questionId ||
    !prompt ||
    options.some((option) => !option) ||
    !Number.isInteger(correctOptionIndex) ||
    correctOptionIndex < 0 ||
    correctOptionIndex > 3 ||
    !correctAnswer
  ) {
    redirectWithParam(pagePath, "error", "Quiz questions need four options and a valid answer.");
  }

  await updateOnboardingQuizQuestion({
    orgId: context.orgId,
    questionId,
    prompt,
    options,
    correctAnswer,
    explanation,
  });
  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "onboarding_quiz_question.updated",
    targetType: "onboarding_quiz_question",
    targetId: questionId,
    metadata: { pathId },
  });

  revalidatePath(pagePath);
  redirectWithParam(pagePath, "message", "Quiz question updated.");
}

export async function updatePathStatusAction(formData: FormData) {
  const context = await requireRole("manager");
  const pathId = getString(formData, "pathId");
  const status = getString(formData, "status") as "draft" | "published" | "archived";
  const pagePath = `/admin/onboarding/${pathId}`;

  if (!pathId || !allowedStatuses.has(status)) {
    redirectWithParam("/admin/onboarding", "error", "Choose a valid status.");
  }

  if (status === "published") {
    const detail = await getOnboardingPathWithModules({
      orgId: context.orgId,
      pathId,
    });
    const lessons = [...detail.lessonsByModule.values()].flat();

    if (detail.modules.length === 0 || lessons.length === 0) {
      redirectWithParam(
        pagePath,
        "error",
        "Add at least one module and lesson before publishing."
      );
    }

    if (lessons.some((lesson) => !detail.quizzesByLesson.has(lesson.id))) {
      redirectWithParam(
        pagePath,
        "error",
        "Every lesson needs a reviewed quiz before this path can be published."
      );
    }
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
    const detail = await getOnboardingPathWithModules({
      orgId: context.orgId,
      pathId,
    });

    if (detail.path.status !== "published") {
      throw new Error("Publish this path before assigning it.");
    }

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
