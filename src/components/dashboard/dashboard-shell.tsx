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

type DashboardShellProps = {
  context: OrgContext;
};

export function DashboardShell({ context }: DashboardShellProps) {
  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          eyebrow="Workspace"
          title="Dashboard"
          description="Your secure company workspace foundation is active. Use the sidebar to manage people, departments, onboarding, and progress."
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Organization"
            value={context.organizationName}
            helper="Current workspace"
          />
          <MetricCard
            label="Role"
            value={context.role}
            helper="Server-side membership"
          />
          <MetricCard
            label="Signed in"
            value={context.fullName || "User"}
            helper={context.email}
          />
        </section>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Product foundation</CardTitle>
            <CardDescription>
              The app now has the main B2B SaaS workflow spine: workspace,
              roles, invites, departments, onboarding, learning, and progress.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
              <li className="rounded-lg border bg-muted/40 p-3">
                Auth, organizations, roles, and RLS-backed membership are live.
              </li>
              <li className="rounded-lg border bg-muted/40 p-3">
                Admins can manage departments, members, invites, and onboarding.
              </li>
              <li className="rounded-lg border bg-muted/40 p-3">
                Employees can open assigned learning and complete lessons.
              </li>
              <li className="rounded-lg border bg-muted/40 p-3">
                AI, document upload, storage, billing, and transcription remain
                intentionally deferred.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
