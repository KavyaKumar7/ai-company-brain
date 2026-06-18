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

export type OnboardingAssignment = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string | null;
  status: string;
  dueDate: string | null;
  assignedAt: string;
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

  return {
    path: mapPath(path as PathRow),
    modules: ((modules ?? []) as ModuleRow[]).map(mapModule),
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
