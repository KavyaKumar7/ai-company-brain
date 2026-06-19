import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import type { OrgContext } from "@/lib/auth/types";
import type { DashboardSummary } from "@/lib/data-access/dashboard";

type DashboardShellProps = {
  context: OrgContext;
  summary: DashboardSummary;
};

export function DashboardShell({ context, summary }: DashboardShellProps) {
  const managerView = context.role === "admin" || context.role === "manager";

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          eyebrow="Workspace"
          title="Dashboard"
          description="Your secure workforce enablement workspace is active. Track the setup work that matters for a pilot-ready onboarding demo."
        />

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            label="Members"
            value={summary.activeMembers}
            helper="Active users"
          />
          <MetricCard
            label="Departments"
            value={summary.departments}
            helper="Org structure"
          />
          <MetricCard
            label="Paths"
            value={summary.onboardingPaths}
            helper="Onboarding"
          />
          <MetricCard
            label="Published"
            value={summary.publishedPaths}
            helper="Ready to assign"
          />
          <MetricCard
            label={managerView ? "Active work" : "My active work"}
            value={summary.activeAssignments}
            helper="Not complete"
          />
          <MetricCard
            label="Overdue"
            value={summary.overdueAssignments}
            helper="Needs attention"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
            <CardHeader>
              <CardTitle>Recommended next steps</CardTitle>
              <CardDescription>
                Based on the MVP build order in the execution manual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {summary.nextSteps.map((step, index) => (
                  <li className="flex gap-3" key={step}>
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="pt-1">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
            <CardHeader>
              <CardTitle>Product foundation</CardTitle>
              <CardDescription>
                Current scope versus what the manual says comes later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                <li className="rounded-lg border bg-muted/40 p-3">
                  Auth, organizations, roles, invites, and RLS-backed membership
                  are live.
                </li>
                <li className="rounded-lg border bg-muted/40 p-3">
                  Admins and managers can create paths, lessons, assignments,
                  and track progress.
                </li>
                <li className="rounded-lg border bg-muted/40 p-3">
                  Employees can open assigned learning and complete lessons.
                </li>
                <li className="rounded-lg border bg-muted/40 p-3">
                  AI, document upload, vector search, billing, and transcription
                  remain intentionally deferred.
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card className="bg-card/80 shadow-xl shadow-black/10 backdrop-blur">
          <CardHeader>
            <CardTitle>Signed-in context</CardTitle>
            <CardDescription>
              This is loaded from the server-side session and membership.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm md:grid-cols-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <dt className="text-muted-foreground">Organization</dt>
                <dd className="mt-1 font-medium">{context.organizationName}</dd>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <dt className="text-muted-foreground">Role</dt>
                <dd className="mt-1 font-medium capitalize">{context.role}</dd>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <dt className="text-muted-foreground">User</dt>
                <dd className="mt-1 font-medium">
                  {context.fullName || context.email}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
