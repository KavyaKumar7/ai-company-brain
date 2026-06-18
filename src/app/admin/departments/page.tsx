import { AdminHeader } from "@/components/admin/admin-header";
import { StatusMessage } from "@/components/admin/status-message";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
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

import { createDepartmentAction, updateDepartmentAction } from "./actions";

type DepartmentsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminDepartmentsPage({
  searchParams,
}: DepartmentsPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    requireRole("admin"),
  ]);
  const departments = await listDepartments(context.orgId);

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title="Departments"
          description="Create departments now so onboarding paths and manager views can be scoped later."
          role={context.role}
        />

        <StatusMessage error={params.error} message={params.message} />

        <Card>
          <CardHeader>
            <CardTitle>Create department</CardTitle>
            <CardDescription>
              Keep departments simple: Sales, Operations, HR, Support, or
              similar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={createDepartmentAction}
              className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Sales" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="Team responsible for revenue and customer acquisition"
                />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing departments</CardTitle>
            <CardDescription>
              Edit labels as your organization structure becomes clearer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No departments yet. Create your first department above.
              </p>
            ) : (
              <div className="space-y-4">
                {departments.map((department) => (
                  <form
                    action={updateDepartmentAction}
                    className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_2fr_auto] md:items-end"
                    key={department.id}
                  >
                    <input
                      name="departmentId"
                      type="hidden"
                      value={department.id}
                    />
                    <div className="space-y-2">
                      <Label htmlFor={`name-${department.id}`}>Name</Label>
                      <Input
                        id={`name-${department.id}`}
                        name="name"
                        defaultValue={department.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`description-${department.id}`}>
                        Description
                      </Label>
                      <Input
                        id={`description-${department.id}`}
                        name="description"
                        defaultValue={department.description ?? ""}
                      />
                    </div>
                    <Button type="submit" variant="outline">
                      Save
                    </Button>
                  </form>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
