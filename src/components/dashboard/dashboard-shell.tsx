import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  GraduationCap,
  History,
  Sparkles,
  Users,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { OrgContext } from "@/lib/auth/types";
import type { DashboardSummary } from "@/lib/data-access/dashboard";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  context: OrgContext;
  summary: DashboardSummary;
};

function formatAction(action: string) {
  return action.replaceAll("_", " ").replaceAll(".", " ");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DashboardShell({ context, summary }: DashboardShellProps) {
  const managerView = context.role === "admin" || context.role === "manager";
  const quickActions = managerView
    ? [
        { href: "/admin/knowledge", label: "Add knowledge", description: "Upload and approve a company source", icon: FileText },
        { href: "/assistant", label: "Ask Company AI", description: "Test a cited answer from approved sources", icon: Bot },
        { href: "/admin/onboarding", label: "Build onboarding", description: "Create a role-specific learning path", icon: BookOpenCheck },
      ]
    : [
        { href: "/learning", label: "Continue learning", description: "Open your assigned onboarding", icon: GraduationCap },
        { href: "/assistant", label: "Ask Company AI", description: "Get an answer with verified sources", icon: Bot },
      ];

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <PageHeader
          eyebrow="Command center"
          title={`Good to see you, ${context.fullName?.split(" ")[0] || "there"}`}
          description="A focused view of your knowledge coverage, onboarding momentum, and the work that needs attention."
          actions={
            <Link className={buttonVariants({ variant: "outline" })} href="/assistant">
              <Sparkles className="size-4 text-primary" />
              Ask Company AI
            </Link>
          }
        />

        <section aria-label="Workspace health" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Users} label="Active members" value={summary.activeMembers} helper={`${summary.departments} departments`} />
          <MetricCard icon={FileCheck2} label="Approved knowledge" value={summary.approvedDocuments} helper={`${summary.documents} total documents`} tone="mint" />
          <MetricCard icon={BookOpenCheck} label="Published paths" value={summary.publishedPaths} helper={`${summary.onboardingPaths} total paths`} tone="amber" />
          <MetricCard icon={summary.overdueAssignments > 0 ? Clock3 : CheckCircle2} label={managerView ? "Active assignments" : "My active learning"} value={summary.activeAssignments} helper={summary.overdueAssignments > 0 ? `${summary.overdueAssignments} overdue` : "Nothing overdue"} tone={summary.overdueAssignments > 0 ? "rose" : "mint"} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Move work forward</CardTitle>
              <CardDescription>Direct paths into the workflows your team uses most.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    className="group rounded-lg border border-border bg-muted/20 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-accent/40 hover:shadow-md hover:shadow-black/10"
                    href={action.href}
                    key={action.href}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <h3 className="mt-5 text-sm font-semibold">{action.label}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>Priority queue</CardTitle>
              <CardDescription>Recommended next steps based on your live workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-1">
                {summary.nextSteps.slice(0, 4).map((step, index) => (
                  <li className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/40" key={step}>
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-5 text-foreground/80">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>An evidence trail of knowledge and onboarding changes.</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.recentActivity.length === 0 ? (
                <EmptyState icon={History} title="Your activity trail starts here" description="Uploads, approvals, assignments, and feedback will appear as your team uses the workspace." />
              ) : (
                <div className="divide-y divide-border/70">
                  {summary.recentActivity.map((entry) => (
                    <div className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0" key={entry.id}>
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <History className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium capitalize">{formatAction(entry.action)}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {entry.profile?.fullName || entry.profile?.email || "Workspace member"} · {entry.targetType.replaceAll("_", " ")}
                        </p>
                      </div>
                      <time className="shrink-0 text-[11px] text-muted-foreground">{formatDateTime(entry.createdAt)}</time>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[linear-gradient(145deg,color-mix(in_oklch,var(--card),var(--primary)_5%),var(--card))]">
            <CardHeader>
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
                <FileCheck2 className="size-[18px]" />
              </div>
              <CardTitle>Knowledge readiness</CardTitle>
              <CardDescription>Only approved documents are available to Company AI.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Approved coverage</span>
                    <span className="font-semibold">{summary.documents > 0 ? Math.round((summary.approvedDocuments / summary.documents) * 100) : 0}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${summary.documents > 0 ? (summary.approvedDocuments / summary.documents) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border/70 bg-background/35 p-3">
                    <p className="text-lg font-semibold">{summary.documents}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Sources</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/35 p-3">
                    <p className={cn("text-lg font-semibold", summary.approvedDocuments > 0 && "text-emerald-300")}>{summary.approvedDocuments}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">Verified</p>
                  </div>
                </div>
                {managerView ? (
                  <Link className={buttonVariants({ variant: "outline", className: "w-full" })} href="/admin/knowledge">
                    Review knowledge
                    <ArrowRight className="size-4" />
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
