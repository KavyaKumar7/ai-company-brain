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
import { listDepartments } from "@/lib/data-access/departments";
import { listOrganizationInvites } from "@/lib/data-access/invites";
import { listOrganizationMembers } from "@/lib/data-access/memberships";

import { createInvite, updateMember } from "./actions";

type MembersPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function AdminMembersPage({
  searchParams,
}: MembersPageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    requireRole("admin"),
  ]);
  const [members, invites, departments] = await Promise.all([
    listOrganizationMembers(context.orgId),
    listOrganizationInvites(context.orgId),
    listDepartments(context.orgId),
  ]);

  return (
    <main className="min-h-screen bg-muted/30 px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title="Members"
          description="View active users and create invite records for this organization."
        />

        <StatusMessage error={params.error} message={params.message} />

        <Card>
          <CardHeader>
            <CardTitle>Create invite</CardTitle>
            <CardDescription>
              This creates a pending invite record only. Email delivery comes in
              a later step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createInvite} className="grid gap-4 md:grid-cols-[1fr_180px_auto] md:items-end">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="new.employee@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue="employee"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit">Create invite</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current members</CardTitle>
            <CardDescription>
              Active memberships for {context.organizationName}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Name</th>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Department</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          {member.profile?.fullName || "Unnamed user"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {member.profile?.email || "No email"}
                        </td>
                        <td className="py-3 pr-4">
                          <form
                            action={updateMember}
                            className="contents"
                            id={`member-${member.id}`}
                          >
                            <input
                              name="membershipId"
                              type="hidden"
                              value={member.id}
                            />
                          </form>
                          <select
                            className="h-9 w-full min-w-36 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            defaultValue={member.departmentId ?? ""}
                            form={`member-${member.id}`}
                            name="departmentId"
                          >
                            <option value="">No department</option>
                            {departments.map((department) => (
                              <option
                                key={department.id}
                                value={department.id}
                              >
                                {department.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            className="h-9 w-full min-w-32 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            defaultValue={member.role}
                            form={`member-${member.id}`}
                            name="role"
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <select
                            className="h-9 w-full min-w-28 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            defaultValue={member.status}
                            form={`member-${member.id}`}
                            name="status"
                          >
                            <option value="active">Active</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </td>
                        <td className="py-3 pr-4">
                          <Button
                            form={`member-${member.id}`}
                            type="submit"
                            variant="outline"
                          >
                            Save
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>
              Invite links are not emailed yet. Copying/sending invite links
              comes after this foundation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No invites created yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Email</th>
                      <th className="py-2 pr-4 font-medium">Role</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Expires</th>
                      <th className="py-2 pr-4 font-medium">Invite link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites.map((invite) => (
                      <tr key={invite.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{invite.email}</td>
                        <td className="py-3 pr-4 capitalize">{invite.role}</td>
                        <td className="py-3 pr-4 capitalize">
                          {invite.status}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          <code className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            /accept-invite/{invite.token}
                          </code>
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
