import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

import { AdminHeader } from "@/components/admin/admin-header";
import { StatusMessage } from "@/components/admin/status-message";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { requireRole } from "@/lib/auth/require-role";
import { listDepartments } from "@/lib/data-access/departments";
import { listOnboardingPaths } from "@/lib/data-access/onboarding";

import { createPathAction } from "./actions";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminOnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    requireRole("manager"),
  ]);
  const [departments, paths] = await Promise.all([
    listDepartments(context.orgId),
    listOnboardingPaths(context.orgId),
  ]);

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title="Onboarding"
          description="Create manual onboarding paths now. AI generation comes later."
          role={context.role}
        />

        <StatusMessage error={params.error} message={params.message} />

        <Card>
          <CardHeader>
            <CardTitle>Create onboarding path</CardTitle>
            <CardDescription>
              Start with a simple path for a role or department.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPathAction} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Sales agent onboarding"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRole">Target role</Label>
                  <Select
                    defaultValue="employee"
                    id="targetRole"
                    name="targetRole"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <Select
                    id="departmentId"
                    name="departmentId"
                    defaultValue=""
                  >
                    <option value="">No department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="A first-week learning path for new hires"
                  />
                </div>
              </div>
              <Button type="submit">Create path</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing paths</CardTitle>
            <CardDescription>
              Drafts can be edited and later published for assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paths.length === 0 ? (
              <EmptyState
                icon={BookOpenCheck}
                title="Create your first onboarding path"
                description="Structure a role-specific learning journey, then add lessons and assign it to a team member."
              />
            ) : (
              <div className="grid gap-3">
                {paths.map((path) => (
                  <div
                    className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center"
                    key={path.id}
                  >
                    <div>
                      <h3 className="font-medium">{path.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {path.departmentName ?? "No department"} ·{" "}
                        {path.targetRole} · {path.status}
                      </p>
                    </div>
                    <Link
                      className={buttonVariants({ variant: "outline" })}
                      href={`/admin/onboarding/${path.id}`}
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
