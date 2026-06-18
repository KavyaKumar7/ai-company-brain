import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { AppRole } from "@/lib/auth/types";

export type OnboardingPath = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  targetRole: AppRole;
  departmentId: string | null;
  departmentName: string | null;
  status: string;
  createdAt: string;
};

export type OnboardingModule = {
  id: string;
  pathId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  estimatedMinutes: number;
};

export type OnboardingLesson = {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  orderIndex: number;
  estimatedMinutes: number;
};

export type OnboardingAssignment = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: string;
  dueDate: string | null;
  assignedAt: string;
};

export type LearningAssignmentDetail = {
  assignment: MyOnboardingAssignment;
  modules: Array<
    OnboardingModule & {
      lessons: Array<
        OnboardingLesson & {
          completed: boolean;
        }
      >;
    }
  >;
  completedLessons: number;
  totalLessons: number;
};

export type MyOnboardingAssignment = {
  id: string;
  pathId: string;
  pathTitle: string;
  pathDescription: string | null;
  pathStatus: string;
  status: string;
  dueDate: string | null;
  assignedAt: string;
};

type PathRow = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  target_role: AppRole;
  department_id: string | null;
  status: string;
  created_at: string;
  departments:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

type ModuleRow = {
  id: string;
  path_id: string;
  title: string;
  description: string | null;
  order_index: number;
  estimated_minutes: number;
};

type LessonRow = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  order_index: number;
  estimated_minutes: number;
};

type AssignmentRow = {
  id: string;
  user_id: string;
  status: string;
  due_date: string | null;
  assigned_at: string;
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
};

type MyAssignmentRow = {
  id: string;
  path_id: string;
  status: string;
  due_date: string | null;
  assigned_at: string;
  onboarding_paths:
    | {
        title: string;
        description: string | null;
        status: string;
      }
    | {
        title: string;
        description: string | null;
        status: string;
      }[]
    | null;
};

function normalizeDepartment(row: PathRow["departments"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

function mapPath(row: PathRow): OnboardingPath {
  const department = normalizeDepartment(row.departments);

  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    targetRole: row.target_role,
    departmentId: row.department_id,
    departmentName: department?.name ?? null,
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapModule(row: ModuleRow): OnboardingModule {
  return {
    id: row.id,
    pathId: row.path_id,
    title: row.title,
    description: row.description,
    orderIndex: row.order_index,
    estimatedMinutes: row.estimated_minutes,
  };
}

function mapLesson(row: LessonRow): OnboardingLesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    content: row.content,
    orderIndex: row.order_index,
    estimatedMinutes: row.estimated_minutes,
  };
}

function normalizeProfile(row: AssignmentRow["profiles"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

function normalizePath(row: MyAssignmentRow["onboarding_paths"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

export async function listOnboardingPaths(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_paths")
    .select(
      `
        id,
        organization_id,
        title,
        description,
        target_role,
        department_id,
        status,
        created_at,
        departments (
          name
        )
      `
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load onboarding paths: ${error.message}`);
  }

  return ((data ?? []) as PathRow[]).map(mapPath);
}

export async function getOnboardingPathWithModules({
  orgId,
  pathId,
}: {
  orgId: string;
  pathId: string;
}) {
  const supabase = await createClient();

  const { data: path, error: pathError } = await supabase
    .from("onboarding_paths")
    .select(
      `
        id,
        organization_id,
        title,
        description,
        target_role,
        department_id,
        status,
        created_at,
        departments (
          name
        )
      `
    )
    .eq("organization_id", orgId)
    .eq("id", pathId)
    .single();

  if (pathError) {
    throw new Error(`Failed to load onboarding path: ${pathError.message}`);
  }

  const { data: modules, error: modulesError } = await supabase
    .from("onboarding_modules")
    .select("id, path_id, title, description, order_index, estimated_minutes")
    .eq("organization_id", orgId)
    .eq("path_id", pathId)
    .order("order_index", { ascending: true });

  if (modulesError) {
    throw new Error(`Failed to load modules: ${modulesError.message}`);
  }

  const moduleRows = ((modules ?? []) as ModuleRow[]).map(mapModule);
  const moduleIds = moduleRows.map((module) => module.id);
  const lessonsByModule = new Map<string, OnboardingLesson[]>();

  if (moduleIds.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from("onboarding_lessons")
      .select("id, module_id, title, content, order_index, estimated_minutes")
      .eq("organization_id", orgId)
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      throw new Error(`Failed to load lessons: ${lessonsError.message}`);
    }

    ((lessons ?? []) as LessonRow[]).forEach((lessonRow) => {
      const lesson = mapLesson(lessonRow);
      const existing = lessonsByModule.get(lesson.moduleId) ?? [];
      existing.push(lesson);
      lessonsByModule.set(lesson.moduleId, existing);
    });
  }

  return {
    path: mapPath(path as PathRow),
    modules: moduleRows,
    lessonsByModule,
  };
}

export async function createOnboardingPath({
  orgId,
  title,
  description,
  targetRole,
  departmentId,
  createdBy,
}: {
  orgId: string;
  title: string;
  description: string | null;
  targetRole: AppRole;
  departmentId: string | null;
  createdBy: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_paths")
    .insert({
      organization_id: orgId,
      title,
      description,
      target_role: targetRole,
      department_id: departmentId,
      created_by: createdBy,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create onboarding path: ${error.message}`);
  }

  return data;
}

export async function createOnboardingModule({
  orgId,
  pathId,
  title,
  description,
  orderIndex,
  estimatedMinutes,
}: {
  orgId: string;
  pathId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  estimatedMinutes: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_modules")
    .insert({
      organization_id: orgId,
      path_id: pathId,
      title,
      description,
      order_index: orderIndex,
      estimated_minutes: estimatedMinutes,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create module: ${error.message}`);
  }

  return data;
}

export async function createOnboardingLesson({
  orgId,
  moduleId,
  title,
  content,
  orderIndex,
  estimatedMinutes,
}: {
  orgId: string;
  moduleId: string;
  title: string;
  content: string | null;
  orderIndex: number;
  estimatedMinutes: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_lessons")
    .insert({
      organization_id: orgId,
      module_id: moduleId,
      title,
      content,
      order_index: orderIndex,
      estimated_minutes: estimatedMinutes,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create lesson: ${error.message}`);
  }

  return data;
}

export async function listOnboardingAssignments({
  orgId,
  pathId,
}: {
  orgId: string;
  pathId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_assignments")
    .select(
      `
        id,
        user_id,
        status,
        due_date,
        assigned_at,
        profiles (
          email,
          full_name
        )
      `
    )
    .eq("organization_id", orgId)
    .eq("path_id", pathId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load assignments: ${error.message}`);
  }

  return ((data ?? []) as AssignmentRow[]).map((assignment) => {
    const profile = normalizeProfile(assignment.profiles);

    return {
      id: assignment.id,
      userId: assignment.user_id,
      userEmail: profile?.email ?? "No email",
      userName: profile?.full_name ?? null,
      status: assignment.status,
      dueDate: assignment.due_date,
      assignedAt: assignment.assigned_at,
    } satisfies OnboardingAssignment;
  });
}

export async function createOnboardingAssignment({
  orgId,
  pathId,
  userId,
  assignedBy,
  dueDate,
}: {
  orgId: string;
  pathId: string;
  userId: string;
  assignedBy: string;
  dueDate: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_assignments")
    .insert({
      organization_id: orgId,
      path_id: pathId,
      user_id: userId,
      assigned_by: assignedBy,
      due_date: dueDate,
      status: "assigned",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to assign onboarding path: ${error.message}`);
  }

  return data;
}

export async function listMyOnboardingAssignments({
  orgId,
  userId,
}: {
  orgId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_assignments")
    .select(
      `
        id,
        path_id,
        status,
        due_date,
        assigned_at,
        onboarding_paths (
          title,
          description,
          status
        )
      `
    )
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load your assignments: ${error.message}`);
  }

  return ((data ?? []) as MyAssignmentRow[]).map((assignment) => {
    const path = normalizePath(assignment.onboarding_paths);

    return {
      id: assignment.id,
      pathId: assignment.path_id,
      pathTitle: path?.title ?? "Untitled path",
      pathDescription: path?.description ?? null,
      pathStatus: path?.status ?? "unknown",
      status: assignment.status,
      dueDate: assignment.due_date,
      assignedAt: assignment.assigned_at,
    } satisfies MyOnboardingAssignment;
  });
}

export async function getMyLearningAssignment({
  orgId,
  userId,
  assignmentId,
}: {
  orgId: string;
  userId: string;
  assignmentId: string;
}): Promise<LearningAssignmentDetail> {
  const supabase = await createClient();

  const { data: assignmentRow, error: assignmentError } = await supabase
    .from("onboarding_assignments")
    .select(
      `
        id,
        path_id,
        status,
        due_date,
        assigned_at,
        onboarding_paths (
          title,
          description,
          status
        )
      `
    )
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .eq("id", assignmentId)
    .single();

  if (assignmentError) {
    throw new Error(`Failed to load assignment: ${assignmentError.message}`);
  }

  const assignmentData = assignmentRow as MyAssignmentRow;
  const path = normalizePath(assignmentData.onboarding_paths);
  const assignment = {
    id: assignmentData.id,
    pathId: assignmentData.path_id,
    pathTitle: path?.title ?? "Untitled path",
    pathDescription: path?.description ?? null,
    pathStatus: path?.status ?? "unknown",
    status: assignmentData.status,
    dueDate: assignmentData.due_date,
    assignedAt: assignmentData.assigned_at,
  } satisfies MyOnboardingAssignment;

  const { data: modules, error: modulesError } = await supabase
    .from("onboarding_modules")
    .select("id, path_id, title, description, order_index, estimated_minutes")
    .eq("organization_id", orgId)
    .eq("path_id", assignment.pathId)
    .order("order_index", { ascending: true });

  if (modulesError) {
    throw new Error(`Failed to load modules: ${modulesError.message}`);
  }

  const moduleRows = ((modules ?? []) as ModuleRow[]).map(mapModule);
  const moduleIds = moduleRows.map((module) => module.id);
  const lessonsByModule = new Map<string, OnboardingLesson[]>();

  if (moduleIds.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from("onboarding_lessons")
      .select("id, module_id, title, content, order_index, estimated_minutes")
      .eq("organization_id", orgId)
      .in("module_id", moduleIds)
      .order("order_index", { ascending: true });

    if (lessonsError) {
      throw new Error(`Failed to load lessons: ${lessonsError.message}`);
    }

    ((lessons ?? []) as LessonRow[]).forEach((lessonRow) => {
      const lesson = mapLesson(lessonRow);
      const existing = lessonsByModule.get(lesson.moduleId) ?? [];
      existing.push(lesson);
      lessonsByModule.set(lesson.moduleId, existing);
    });
  }

  const { data: completions, error: completionsError } = await supabase
    .from("lesson_completions")
    .select("lesson_id")
    .eq("organization_id", orgId)
    .eq("assignment_id", assignment.id)
    .eq("user_id", userId);

  if (completionsError) {
    throw new Error(`Failed to load completions: ${completionsError.message}`);
  }

  const completedLessonIds = new Set(
    ((completions ?? []) as { lesson_id: string }[]).map(
      (completion) => completion.lesson_id
    )
  );
  let totalLessons = 0;
  let completedLessons = 0;

  const modulesWithLessons = moduleRows.map((module) => {
    const lessons = (lessonsByModule.get(module.id) ?? []).map((lesson) => {
      const completed = completedLessonIds.has(lesson.id);
      totalLessons += 1;
      if (completed) {
        completedLessons += 1;
      }

      return { ...lesson, completed };
    });

    return { ...module, lessons };
  });

  return {
    assignment,
    modules: modulesWithLessons,
    completedLessons,
    totalLessons,
  };
}

export async function completeLesson({
  orgId,
  assignmentId,
  lessonId,
  userId,
}: {
  orgId: string;
  assignmentId: string;
  lessonId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("lesson_completions").upsert(
    {
      organization_id: orgId,
      assignment_id: assignmentId,
      lesson_id: lessonId,
      user_id: userId,
    },
    { onConflict: "assignment_id,lesson_id" }
  );

  if (error) {
    throw new Error(`Failed to complete lesson: ${error.message}`);
  }

  const detail = await getMyLearningAssignment({
    orgId,
    userId,
    assignmentId,
  });

  if (detail.totalLessons > 0 && detail.completedLessons === detail.totalLessons) {
    await supabase
      .from("onboarding_assignments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("id", assignmentId)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("onboarding_assignments")
      .update({ status: "in_progress" })
      .eq("organization_id", orgId)
      .eq("id", assignmentId)
      .eq("user_id", userId)
      .neq("status", "completed");
  }
}

export async function updateOnboardingPathStatus({
  orgId,
  pathId,
  status,
}: {
  orgId: string;
  pathId: string;
  status: "draft" | "published" | "archived";
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("onboarding_paths")
    .update({ status })
    .eq("organization_id", orgId)
    .eq("id", pathId)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to update path status: ${error.message}`);
  }

  return data;
}
