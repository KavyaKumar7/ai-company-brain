import Link from "next/link";

import { AdminHeader } from "@/components/admin/admin-header";
import { StatusMessage } from "@/components/admin/status-message";
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
    <main className="min-h-screen bg-muted/30 px-6 py-8">
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
                  <select
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue="employee"
                    id="targetRole"
                    name="targetRole"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                  </select>
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
              <p className="text-sm text-muted-foreground">
                No onboarding paths yet.
              </p>
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
    </main>
  );
}
