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
import { listOrganizationMembers } from "@/lib/data-access/memberships";
import {
  getOnboardingPathWithModules,
  listOnboardingAssignments,
} from "@/lib/data-access/onboarding";

import {
  assignPathAction,
  createLessonAction,
  createModuleAction,
  updatePathStatusAction,
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

export default async function AdminOnboardingPathPage({
  params,
  searchParams,
}: OnboardingPathPageProps) {
  const [{ pathId }, pageParams, context] = await Promise.all([
    params,
    searchParams,
    requireRole("manager"),
  ]);
  const { path, modules, lessonsByModule } = await getOnboardingPathWithModules({
    orgId: context.orgId,
    pathId,
  });
  const [members, assignments] = await Promise.all([
    listOrganizationMembers(context.orgId),
    listOnboardingAssignments({ orgId: context.orgId, pathId }),
  ]);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title={path.title}
          description="Build the manual module outline for this onboarding path."
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
            <form action={updatePathStatusAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <input name="pathId" type="hidden" value={path.id} />
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  className="h-9 w-full min-w-40 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={path.status}
                  id="status"
                  name="status"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
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
              These are manual placeholders for now. Lessons, quizzes, and AI
              generation come later.
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
                                className="rounded-md bg-muted/60 p-3 text-sm"
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
                                {lesson.content ? (
                                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                                    {lesson.content}
                                  </p>
                                ) : null}
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
                          <textarea
                            className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                <select
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
                </select>
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
                        <td className="py-3 pr-4 capitalize">
                          {assignment.status}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {assignment.dueDate ?? "No due date"}
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
    </main>
  );
}
