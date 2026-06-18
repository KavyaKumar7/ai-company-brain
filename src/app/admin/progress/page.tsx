import { AdminHeader } from "@/components/admin/admin-header";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/layout/metric-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getOnboardingProgressSummary } from "@/lib/data-access/onboarding";

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString();
}

export default async function AdminProgressPage() {
  const context = await requireRole("manager");
  const summary = await getOnboardingProgressSummary(context.orgId);

  const stats = [
    {
      label: "Assignments",
      value: summary.totalAssignments,
      helper: "Total assigned paths",
    },
    {
      label: "Average progress",
      value: `${summary.averageProgress}%`,
      helper: "Across all assignments",
    },
    {
      label: "In progress",
      value: summary.inProgressAssignments,
      helper: "Currently being worked on",
    },
    {
      label: "Overdue",
      value: summary.overdueAssignments,
      helper: "Past due and incomplete",
    },
  ];

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <AdminHeader
          title="Onboarding progress"
          description="Track assigned onboarding paths, lesson completion, and overdue work."
          role={context.role}
        />

        <section className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <MetricCard
              helper={stat.helper}
              key={stat.label}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              Lesson completion progress for every assigned onboarding path.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No onboarding assignments yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Employee</th>
                      <th className="py-2 pr-4 font-medium">Path</th>
                      <th className="py-2 pr-4 font-medium">Progress</th>
                      <th className="py-2 pr-4 font-medium">Lessons</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.rows.map((row) => (
                      <tr
                        className="border-b align-top last:border-0"
                        key={row.assignmentId}
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium">
                            {row.userName || "Unnamed user"}
                          </div>
                          <div className="text-muted-foreground">
                            {row.userEmail}
                          </div>
                        </td>
                        <td className="py-3 pr-4">{row.pathTitle}</td>
                        <td className="py-3 pr-4">
                          <div className="flex min-w-36 items-center gap-3">
                            <div className="h-2 flex-1 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${row.progressPercent}%` }}
                              />
                            </div>
                            <span>{row.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {row.completedLessons}/{row.totalLessons}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="capitalize">{row.assignmentStatus}</span>
                          {row.overdue ? (
                            <span className="ml-2 rounded-full bg-destructive/10 px-2 py-1 text-xs text-destructive">
                              Overdue
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(row.dueDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
