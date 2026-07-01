import Link from "next/link";

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
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { requireRole } from "@/lib/auth/require-role";
import { listOrganizationMembers } from "@/lib/data-access/memberships";
import {
  getOnboardingPathWithModules,
  listOnboardingAssignments,
} from "@/lib/data-access/onboarding";

import {
  assignPathAction,
  createLessonAction,
  createModuleAction,
  updateAssignmentStatusAction,
  updateLessonAction,
  updatePathStatusAction,
  updateQuizQuestionAction,
} from "../actions";

type OnboardingPathPageProps = {
  params: Promise<{
    pathId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString();
}

export default async function AdminOnboardingPathPage({
  params,
  searchParams,
}: OnboardingPathPageProps) {
  const [{ pathId }, pageParams, context] = await Promise.all([
    params,
    searchParams,
    requireRole("manager"),
  ]);
  const { path, modules, lessonsByModule, quizzesByLesson } =
    await getOnboardingPathWithModules({
      orgId: context.orgId,
      pathId,
    });
  const [members, assignments] = await Promise.all([
    listOrganizationMembers(context.orgId),
    listOnboardingAssignments({ orgId: context.orgId, pathId }),
  ]);

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <AdminHeader
          title={path.title}
          description="Review and edit every lesson and quiz before publishing this onboarding path."
          role={context.role}
        />

        <StatusMessage error={pageParams.error} message={pageParams.message} />

        <Card>
          <CardHeader>
            <CardTitle>Path status</CardTitle>
            <CardDescription>
              Publish only when the module outline is ready for assignment.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <StatusBadge status={path.status} />
            </div>
            <form action={updatePathStatusAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <input name="pathId" type="hidden" value={path.id} />
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  className="min-w-40"
                  defaultValue={path.status}
                  id="status"
                  name="status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
              <Button type="submit">Update status</Button>
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/admin/onboarding"
              >
                Back to paths
              </Link>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add module</CardTitle>
            <CardDescription>
              Extend the generated draft or build a path manually.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createModuleAction} className="space-y-4">
              <input name="pathId" type="hidden" value={path.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Module title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Company overview"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="What the employee should understand"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orderIndex">Order</Label>
                  <Input
                    defaultValue={modules.length + 1}
                    id="orderIndex"
                    min={1}
                    name="orderIndex"
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedMinutes">Estimated minutes</Label>
                  <Input
                    defaultValue={15}
                    id="estimatedMinutes"
                    min={1}
                    name="estimatedMinutes"
                    type="number"
                  />
                </div>
              </div>
              <Button type="submit">Add module</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>
              Ordered outline for the onboarding path.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules yet. Add the first module above.
              </p>
            ) : (
              <div className="space-y-3">
                {modules.map((module) => (
                  <div className="rounded-lg border p-4" key={module.id}>
                    <div className="flex flex-col justify-between gap-2 sm:flex-row">
                      <h3 className="font-medium">
                        {module.orderIndex}. {module.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {module.estimatedMinutes} min
                      </p>
                    </div>
                    {module.description ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {module.description}
                      </p>
                    ) : null}
                    <div className="mt-4 border-t pt-4">
                      <h4 className="text-sm font-medium">Lessons</h4>
                      {(lessonsByModule.get(module.id) ?? []).length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">
                          No lessons yet.
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {(lessonsByModule.get(module.id) ?? []).map(
                            (lesson) => (
                              <div
                                className="rounded-lg border border-border/70 bg-muted/25 p-4 text-sm"
                                key={lesson.id}
                              >
                                <div className="flex justify-between gap-3">
                                  <span className="font-medium">
                                    {lesson.orderIndex}. {lesson.title}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {lesson.estimatedMinutes} min
                                  </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>{lesson.sourceDocumentIds.length} approved source{lesson.sourceDocumentIds.length === 1 ? "" : "s"}</span>
                                  {quizzesByLesson.get(lesson.id) ? (
                                    <span>· {quizzesByLesson.get(lesson.id)!.questions.length} quiz questions</span>
                                  ) : null}
                                </div>
                                {lesson.content ? (
                                  <p className="mt-3 line-clamp-5 whitespace-pre-wrap leading-6 text-muted-foreground">
                                    {lesson.content}
                                  </p>
                                ) : null}

                                <details className="mt-4 rounded-lg border border-border/70 bg-background/35 p-3">
                                  <summary className="cursor-pointer text-xs font-semibold text-primary">
                                    Edit lesson and quiz
                                  </summary>
                                  <form action={updateLessonAction} className="mt-4 space-y-3">
                                    <input name="pathId" type="hidden" value={path.id} />
                                    <input name="lessonId" type="hidden" value={lesson.id} />
                                    <div className="grid gap-3 md:grid-cols-[1fr_120px]">
                                      <div className="space-y-2">
                                        <Label htmlFor={`edit-lesson-title-${lesson.id}`}>Lesson title</Label>
                                        <Input defaultValue={lesson.title} id={`edit-lesson-title-${lesson.id}`} name="title" required />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`edit-lesson-minutes-${lesson.id}`}>Minutes</Label>
                                        <Input defaultValue={lesson.estimatedMinutes} id={`edit-lesson-minutes-${lesson.id}`} min={1} name="estimatedMinutes" type="number" />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`edit-lesson-content-${lesson.id}`}>Lesson content</Label>
                                      <Textarea defaultValue={lesson.content ?? ""} id={`edit-lesson-content-${lesson.id}`} name="content" required />
                                    </div>
                                    <Button size="sm" type="submit" variant="outline">Save lesson</Button>
                                  </form>

                                  {quizzesByLesson.get(lesson.id) ? (
                                    <div className="mt-5 border-t border-border pt-4">
                                      <div className="mb-3 flex items-center justify-between gap-3">
                                        <h5 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Knowledge check</h5>
                                        <span className="text-xs text-muted-foreground">Pass: {quizzesByLesson.get(lesson.id)!.passScore}%</span>
                                      </div>
                                      <div className="space-y-3">
                                        {quizzesByLesson.get(lesson.id)!.questions.map((question) => (
                                          <form action={updateQuizQuestionAction} className="space-y-3 rounded-lg border border-border/70 p-3" key={question.id}>
                                            <input name="pathId" type="hidden" value={path.id} />
                                            <input name="questionId" type="hidden" value={question.id} />
                                            <div className="space-y-2">
                                              <Label htmlFor={`question-${question.id}`}>Question {question.orderIndex}</Label>
                                              <Input defaultValue={question.prompt} id={`question-${question.id}`} name="prompt" required />
                                            </div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                              {question.options.map((option, optionIndex) => (
                                                <Input defaultValue={option} key={`${question.id}-${optionIndex}`} name={`option${optionIndex}`} required />
                                              ))}
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                              <div className="space-y-2">
                                                <Label htmlFor={`correct-${question.id}`}>Correct option</Label>
                                                <Select
                                                  defaultValue={Math.max(0, question.options.indexOf(question.correctAnswer))}
                                                  id={`correct-${question.id}`}
                                                  name="correctOptionIndex"
                                                >
                                                  {question.options.map((option, optionIndex) => (
                                                    <option key={`${option}-${optionIndex}`} value={optionIndex}>
                                                      Option {optionIndex + 1}: {option}
                                                    </option>
                                                  ))}
                                                </Select>
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor={`explanation-${question.id}`}>Explanation</Label>
                                                <Input defaultValue={question.explanation ?? ""} id={`explanation-${question.id}`} name="explanation" />
                                              </div>
                                            </div>
                                            <Button size="sm" type="submit" variant="outline">Save question</Button>
                                          </form>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </details>
                              </div>
                            )
                          )}
                        </div>
                      )}
                      <form action={createLessonAction} className="mt-4 grid gap-3">
                        <input name="pathId" type="hidden" value={path.id} />
                        <input name="moduleId" type="hidden" value={module.id} />
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`lesson-title-${module.id}`}>
                              Lesson title
                            </Label>
                            <Input
                              id={`lesson-title-${module.id}`}
                              name="title"
                              placeholder="What the employee should learn"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor={`lesson-order-${module.id}`}>
                                Order
                              </Label>
                              <Input
                                defaultValue={
                                  (lessonsByModule.get(module.id) ?? []).length + 1
                                }
                                id={`lesson-order-${module.id}`}
                                min={1}
                                name="orderIndex"
                                type="number"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`lesson-minutes-${module.id}`}>
                                Minutes
                              </Label>
                              <Input
                                defaultValue={5}
                                id={`lesson-minutes-${module.id}`}
                                min={1}
                                name="estimatedMinutes"
                                type="number"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`lesson-content-${module.id}`}>
                            Lesson content
                          </Label>
                          <Textarea
                            className="min-h-24"
                            id={`lesson-content-${module.id}`}
                            name="content"
                            placeholder="Write the manual lesson content here."
                          />
                        </div>
                        <Button className="w-fit" type="submit" variant="outline">
                          Add lesson
                        </Button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign path</CardTitle>
            <CardDescription>
              Assign this onboarding path to an existing organization member.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={assignPathAction}
              className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end"
            >
              <input name="pathId" type="hidden" value={path.id} />
              <div className="space-y-2">
                <Label htmlFor="userId">Member</Label>
                <Select
                  id="userId"
                  name="userId"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose member
                  </option>
                  {members
                    .filter((member) => member.status === "active")
                    .map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.profile?.fullName || member.profile?.email}
                      </option>
                    ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" name="dueDate" type="date" />
              </div>
              <Button type="submit">Assign</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              Members currently assigned to this path.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assignments yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Member</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Due</th>
                      <th className="py-2 pr-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          {assignment.userName || "Unnamed user"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {assignment.userEmail}
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={assignment.status} />
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatDate(assignment.dueDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <form action={updateAssignmentStatusAction}>
                            <input name="pathId" type="hidden" value={path.id} />
                            <input
                              name="assignmentId"
                              type="hidden"
                              value={assignment.id}
                            />
                            <input
                              name="status"
                              type="hidden"
                              value={
                                assignment.status === "cancelled"
                                  ? "assigned"
                                  : "cancelled"
                              }
                            />
                            <Button
                              size="sm"
                              type="submit"
                              variant={
                                assignment.status === "cancelled"
                                  ? "outline"
                                  : "destructive"
                              }
                            >
                              {assignment.status === "cancelled"
                                ? "Reactivate"
                                : "Cancel"}
                            </Button>
                          </form>
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
