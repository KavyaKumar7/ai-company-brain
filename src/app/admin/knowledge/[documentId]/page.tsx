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
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/require-role";
import { listDepartments } from "@/lib/data-access/departments";
import { getDocumentById } from "@/lib/data-access/documents";

import {
  updateDocumentMetadataAction,
  updateDocumentStatusAction,
} from "../actions";

type KnowledgeDocumentPageProps = {
  params: Promise<{
    documentId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
}

function formatTags(tags: string[]) {
  return tags.join(", ");
}

export default async function AdminKnowledgeDocumentPage({
  params,
  searchParams,
}: KnowledgeDocumentPageProps) {
  const [{ documentId }, pageParams, context] = await Promise.all([
    params,
    searchParams,
    requireRole("manager"),
  ]);
  const [document, departments] = await Promise.all([
    getDocumentById({ orgId: context.orgId, documentId }),
    listDepartments(context.orgId),
  ]);

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <AdminHeader
          title={document.title}
          description="Review document metadata before approving it as trusted company knowledge."
          role={context.role}
        />

        <StatusMessage error={pageParams.error} message={pageParams.message} />

        <Card>
          <CardHeader>
            <CardTitle>Review status</CardTitle>
            <CardDescription>
              Approved documents will become eligible for the future AI
              assistant and onboarding generator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <StatusBadge status={document.status} />
              <p>File: {document.fileName}</p>
              <p>Effective date: {formatDate(document.effectiveDate)}</p>
              <p>Review date: {formatDate(document.reviewDate)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                ["approved", "Approve"],
                ["ready_for_review", "Send to review"],
                ["outdated", "Mark outdated"],
                ["archived", "Archive"],
              ].map(([status, label]) => (
                <form action={updateDocumentStatusAction} key={status}>
                  <input name="documentId" type="hidden" value={document.id} />
                  <input name="status" type="hidden" value={status} />
                  <Button
                    type="submit"
                    variant={status === "approved" ? "default" : "outline"}
                  >
                    {label}
                  </Button>
                </form>
              ))}
              <Link
                className={buttonVariants({ variant: "outline" })}
                href="/admin/knowledge"
              >
                Back to knowledge
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>
              Keep this accurate. Retrieval and citations will depend on this
              metadata later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateDocumentMetadataAction} className="space-y-4">
              <input name="documentId" type="hidden" value={document.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    defaultValue={document.title}
                    id="title"
                    name="title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departmentId">Department</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue={document.departmentId ?? ""}
                    id="departmentId"
                    name="departmentId"
                  >
                    <option value="">No department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="confidentiality">Confidentiality</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    defaultValue={document.confidentiality}
                    id="confidentiality"
                    name="confidentiality"
                  >
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective date</Label>
                  <Input
                    defaultValue={document.effectiveDate ?? ""}
                    id="effectiveDate"
                    name="effectiveDate"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reviewDate">Review date</Label>
                  <Input
                    defaultValue={document.reviewDate ?? ""}
                    id="reviewDate"
                    name="reviewDate"
                    type="date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  defaultValue={formatTags(document.tags)}
                  id="tags"
                  name="tags"
                  placeholder="sales, onboarding, handbook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  defaultValue={document.summary ?? ""}
                  id="summary"
                  name="summary"
                  placeholder="Manual summary for now. AI summary suggestions come later."
                />
              </div>
              <Button type="submit">Save metadata</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
