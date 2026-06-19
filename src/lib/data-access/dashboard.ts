import "server-only";

import type { AppRole } from "@/lib/auth/types";
import {
  listRecentActivityLogs,
  type ActivityLogEntry,
} from "@/lib/data-access/activity-log";
import { listDocuments } from "@/lib/data-access/documents";
import { createClient } from "@/lib/supabase/server";

export type DashboardSummary = {
  activeMembers: number;
  departments: number;
  onboardingPaths: number;
  publishedPaths: number;
  documents: number;
  approvedDocuments: number;
  activeAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  nextSteps: string[];
  recentActivity: ActivityLogEntry[];
};

type AssignmentSummaryRow = {
  status: string;
  due_date: string | null;
};

type PathSummaryRow = {
  status: string;
};

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function buildNextSteps({
  role,
  summary,
}: {
  role: AppRole;
  summary: Omit<DashboardSummary, "nextSteps" | "recentActivity">;
}) {
  const steps: string[] = [];

  if (role === "admin" && summary.activeMembers <= 1) {
    steps.push("Invite your first manager or employee.");
  }

  if (role === "admin" && summary.departments === 0) {
    steps.push("Create departments so onboarding can be targeted.");
  }

  if ((role === "admin" || role === "manager") && summary.onboardingPaths === 0) {
    steps.push("Create your first manual onboarding path.");
  }

  if ((role === "admin" || role === "manager") && summary.documents === 0) {
    steps.push("Upload your first company knowledge document.");
  }

  if (
    (role === "admin" || role === "manager") &&
    summary.documents > 0 &&
    summary.approvedDocuments === 0
  ) {
    steps.push("Approve a reviewed document for future AI retrieval.");
  }

  if (
    (role === "admin" || role === "manager") &&
    summary.onboardingPaths > 0 &&
    summary.publishedPaths === 0
  ) {
    steps.push("Publish a ready onboarding path.");
  }

  if (
    (role === "admin" || role === "manager") &&
    summary.publishedPaths > 0 &&
    summary.activeAssignments === 0
  ) {
    steps.push("Assign a published onboarding path to a team member.");
  }

  if (role === "employee" && summary.activeAssignments === 0) {
    steps.push("You do not have assigned onboarding yet.");
  }

  if (summary.overdueAssignments > 0) {
    steps.push("Review overdue onboarding assignments.");
  }

  if (steps.length === 0) {
    steps.push("Keep building sample onboarding content for a clean pilot demo.");
  }

  return steps;
}

export async function getDashboardSummary({
  orgId,
  userId,
  role,
}: {
  orgId: string;
  userId: string;
  role: AppRole;
}): Promise<DashboardSummary> {
  const supabase = await createClient();

  const [
    membersResult,
    departmentsResult,
    pathsResult,
    assignmentsResult,
    recentActivity,
    documents,
  ] = await Promise.all([
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "active"),
    supabase
      .from("departments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("onboarding_paths")
      .select("status")
      .eq("organization_id", orgId),
    role === "employee"
      ? supabase
          .from("onboarding_assignments")
          .select("status, due_date")
          .eq("organization_id", orgId)
          .eq("user_id", userId)
      : supabase
          .from("onboarding_assignments")
          .select("status, due_date")
          .eq("organization_id", orgId),
    listRecentActivityLogs({ orgId, limit: 6 }),
    listDocuments(orgId),
  ]);

  if (membersResult.error) {
    throw new Error(`Failed to load dashboard members: ${membersResult.error.message}`);
  }

  if (departmentsResult.error) {
    throw new Error(
      `Failed to load dashboard departments: ${departmentsResult.error.message}`
    );
  }

  if (pathsResult.error) {
    throw new Error(`Failed to load dashboard paths: ${pathsResult.error.message}`);
  }

  if (assignmentsResult.error) {
    throw new Error(
      `Failed to load dashboard assignments: ${assignmentsResult.error.message}`
    );
  }

  const paths = (pathsResult.data ?? []) as PathSummaryRow[];
  const assignments = (assignmentsResult.data ?? []) as AssignmentSummaryRow[];
  const today = getTodayDate();

  const activeAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "completed" && assignment.status !== "cancelled"
  ).length;
  const completedAssignments = assignments.filter(
    (assignment) => assignment.status === "completed"
  ).length;
  const overdueAssignments = assignments.filter((assignment) => {
    if (
      !assignment.due_date ||
      assignment.status === "completed" ||
      assignment.status === "cancelled"
    ) {
      return false;
    }

    return new Date(assignment.due_date) < today;
  }).length;

  const summary = {
    activeMembers: membersResult.count ?? 0,
    departments: departmentsResult.count ?? 0,
    onboardingPaths: paths.length,
    publishedPaths: paths.filter((path) => path.status === "published").length,
    documents: documents.length,
    approvedDocuments: documents.filter((document) => document.status === "approved")
      .length,
    activeAssignments,
    completedAssignments,
    overdueAssignments,
  };

  return {
    ...summary,
    nextSteps: buildNextSteps({ role, summary }),
    recentActivity,
  };
}
