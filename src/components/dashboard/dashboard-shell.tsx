import { logOut } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OrgContext } from "@/lib/auth/types";

type DashboardShellProps = {
  context: OrgContext;
};

export function DashboardShell({ context }: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col justify-between gap-4 rounded-lg border bg-background px-5 py-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              AI Company Brain
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Protected dashboard
            </h1>
          </div>
          <form action={logOut}>
            <Button type="submit" variant="outline">
              Log out
            </Button>
          </form>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Your active company workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">{context.organizationName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ID: {context.orgId}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Role</CardTitle>
              <CardDescription>Loaded from server-side membership.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium capitalize">{context.role}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>User</CardTitle>
              <CardDescription>Authenticated Supabase profile.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-medium">
                {context.fullName || "Unnamed user"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {context.email}
              </p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Foundation ready</CardTitle>
            <CardDescription>
              This app intentionally stops at authentication, organizations,
              roles, and a basic protected dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>No AI assistant has been added.</li>
              <li>No document upload or storage has been added.</li>
              <li>No onboarding, quiz, meeting, or analytics features exist yet.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
