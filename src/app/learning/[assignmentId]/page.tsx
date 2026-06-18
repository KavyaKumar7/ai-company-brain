import Link from "next/link";
import { redirect } from "next/navigation";

import { completeLessonAction } from "@/app/learning/[assignmentId]/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOrgContext } from "@/lib/auth/get-org-context";
import { getMyLearningAssignment } from "@/lib/data-access/onboarding";

type LearningAssignmentPageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export default async function LearningAssignmentPage({
  params,
}: LearningAssignmentPageProps) {
  const [{ assignmentId }, context] = await Promise.all([
    params,
    getOrgContext(),
  ]);

  if (!context) {
    redirect("/login");
  }

  const detail = await getMyLearningAssignment({
    orgId: context.orgId,
    userId: context.userId,
    assignmentId,
  });
  const progress =
    detail.totalLessons === 0
      ? 0
      : Math.round((detail.completedLessons / detail.totalLessons) * 100);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-lg border bg-background px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {context.organizationName}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {detail.assignment.pathTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {detail.completedLessons} of {detail.totalLessons} lessons
              completed · {progress}%
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/learning"
          >
            My learning
          </Link>
        </header>

        {detail.modules.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No modules yet</CardTitle>
              <CardDescription>
                This onboarding path has been assigned, but no learning content
                has been added yet.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          detail.modules.map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <CardTitle>
                  {module.orderIndex}. {module.title}
                </CardTitle>
                <CardDescription>
                  {module.description || `${module.estimatedMinutes} min module`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {module.lessons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No lessons have been added to this module yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {module.lessons.map((lesson) => (
                      <div className="rounded-lg border p-4" key={lesson.id}>
                        <div className="flex flex-col justify-between gap-3 sm:flex-row">
                          <div>
                            <h2 className="font-medium">
                              {lesson.orderIndex}. {lesson.title}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {lesson.estimatedMinutes} min ·{" "}
                              {lesson.completed ? "Completed" : "Not completed"}
                            </p>
                          </div>
                          {lesson.completed ? (
                            <span className="h-fit rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                              Complete
                            </span>
                          ) : (
                            <form action={completeLessonAction}>
                              <input
                                name="assignmentId"
                                type="hidden"
                                value={detail.assignment.id}
                              />
                              <input
                                name="lessonId"
                                type="hidden"
                                value={lesson.id}
                              />
                              <Button type="submit">Mark complete</Button>
                            </form>
                          )}
                        </div>
                        {lesson.content ? (
                          <div className="mt-4 whitespace-pre-wrap rounded-lg bg-muted/50 p-4 text-sm leading-6 text-muted-foreground">
                            {lesson.content}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </main>
  );
}
