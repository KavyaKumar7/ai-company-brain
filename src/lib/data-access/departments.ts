import "server-only";

import { createClient } from "@/lib/supabase/server";

export type Department = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
};

type DepartmentRow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
};

function mapDepartment(row: DepartmentRow): Department {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export async function listDepartments(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select("id, organization_id, name, description, created_at")
    .eq("organization_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load departments: ${error.message}`);
  }

  return ((data ?? []) as DepartmentRow[]).map(mapDepartment);
}

export async function createDepartment({
  orgId,
  name,
  description,
}: {
  orgId: string;
  name: string;
  description: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .insert({
      organization_id: orgId,
      name,
      description,
    })
    .select("id, organization_id, name, description, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create department: ${error.message}`);
  }

  return mapDepartment(data as DepartmentRow);
}

export async function updateDepartment({
  orgId,
  departmentId,
  name,
  description,
}: {
  orgId: string;
  departmentId: string;
  name: string;
  description: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .update({ name, description })
    .eq("organization_id", orgId)
    .eq("id", departmentId)
    .select("id, organization_id, name, description, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to update department: ${error.message}`);
  }

  return mapDepartment(data as DepartmentRow);
}
