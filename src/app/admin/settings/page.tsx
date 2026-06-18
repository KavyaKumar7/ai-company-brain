import { AdminHeader } from "@/components/admin/admin-header";
import { StatusMessage } from "@/components/admin/status-message";
import { Button } from "@/components/ui/button";
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
import { getOrganizationById } from "@/lib/data-access/organizations";

import { updateOrganizationSettings } from "./actions";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminSettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    requireRole("admin"),
  ]);
  const organization = await getOrganizationById(context.orgId);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title="Organization settings"
          description="Manage the basic workspace details for your company."
          role={context.role}
        />

        <Card>
          <CardHeader>
            <CardTitle>Workspace details</CardTitle>
            <CardDescription>
              This name appears in the dashboard and admin pages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateOrganizationSettings} className="space-y-5">
              <StatusMessage error={params.error} message={params.message} />
              <div className="space-y-2">
                <Label htmlFor="name">Organization name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={organization?.name ?? context.organizationName}
                  required
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Slug: {organization?.slug ?? "not set"}
              </div>
              <Button type="submit">Save changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
