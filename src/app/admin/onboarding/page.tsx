import Link from "next/link";
import { BookOpenCheck, FileCheck2, Sparkles } from "lucide-react";

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
import { listDocuments } from "@/lib/data-access/documents";
import { listOnboardingPaths } from "@/lib/data-access/onboarding";

import { createPathAction, generatePathAction } from "./actions";

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
  const [departments, paths, documents] = await Promise.all([
    listDepartments(context.orgId),
    listOnboardingPaths(context.orgId),
    listDocuments(context.orgId),
  ]);
  const approvedDocuments = documents.filter(
    (document) => document.status === "approved"
  );

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title="Onboarding"
          description="Create manual onboarding paths now. AI generation comes later."
          role={context.role}
        />

        <StatusMessage error={params.error} message={params.message} />

        <Card className="border-primary/20 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--card),var(--primary)_6%),var(--card))]">
          <CardHeader className="border-b">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-[18px]" />
            </div>
            <CardTitle>Generate an onboarding draft</CardTitle>
            <CardDescription>
              Choose approved sources and OpenAI will create editable modules,
              grounded lessons, and multiple-choice quizzes. Nothing is
              published until you review it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {approvedDocuments.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title="Approve knowledge before generating"
                description="Onboarding drafts can only use extracted, approved company documents."
                action={
                  <Link
                    className={buttonVariants({ variant: "outline" })}
                    href="/admin/knowledge"
                  >
                    Review knowledge
                  </Link>
                }
              />
            ) : (
              <form action={generatePathAction} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="generated-title">Path title</Label>
                    <Input
                      id="generated-title"
                      name="title"
                      placeholder="Real estate sales onboarding"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="generated-role">Target role</Label>
                    <Select
                      defaultValue="employee"
                      id="generated-role"
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
                    <Label htmlFor="generated-department">Department</Label>
                    <Select
                      defaultValue=""
                      id="generated-department"
                      name="departmentId"
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
                    <Label htmlFor="durationDays">Target duration</Label>
                    <Select defaultValue="5" id="durationDays" name="durationDays">
                      <option value="3">3 days</option>
                      <option value="5">5 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                    </Select>
                  </div>
                </div>
                <fieldset>
                  <legend className="text-[13px] font-semibold text-foreground/85">
                    Approved source documents
                  </legend>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select up to three sources. Every generated lesson will retain its source IDs.
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {approvedDocuments.map((document) => (
                      <label
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/35 p-3 transition-colors hover:border-primary/30 hover:bg-accent/30"
                        key={document.id}
                      >
                        <input
                          className="mt-0.5 size-4 accent-[var(--primary)]"
                          name="documentIds"
                          type="checkbox"
                          value={document.id}
                        />
                        <span>
                          <span className="block text-sm font-medium">{document.title}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {document.departmentName ?? "All departments"} · approved
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <Button size="lg" type="submit">
                  <Sparkles className="size-4" />
                  Generate editable draft
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create manually</CardTitle>
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
