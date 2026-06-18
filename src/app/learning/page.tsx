import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrgContext } from "@/lib/auth/get-org-context";
import { listMyOnboardingAssignments } from "@/lib/data-access/onboarding";

export default async function LearningPage() {
  const context = await getOrgContext();

  if (!context) {
    redirect("/login");
  }

  const assignments = await listMyOnboardingAssignments({
    orgId: context.orgId,
    userId: context.userId,
  });

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <PageHeader
          eyebrow={context.organizationName}
          title="My learning"
          description="Assigned onboarding paths for your account."
        />

        <Card>
          <CardHeader>
            <CardTitle>Assigned onboarding</CardTitle>
            <CardDescription>
              Completion tracking and quizzes will be added after the manual
              onboarding structure is stable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You do not have assigned onboarding paths yet.
              </p>
            ) : (
              <div className="grid gap-3">
                {assignments.map((assignment) => (
                  <div className="rounded-lg border p-4" key={assignment.id}>
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <h2 className="font-medium">{assignment.pathTitle}</h2>
                        {assignment.pathDescription ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {assignment.pathDescription}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-sm text-muted-foreground sm:text-right">
                        <p className="capitalize">{assignment.status}</p>
                        <p>
                          Due: {assignment.dueDate ?? "No due date"}
                        </p>
                      </div>
                    </div>
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        className: "mt-4 w-fit",
                      })}
                      href={`/learning/${assignment.id}`}
                    >
                      Open path
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
