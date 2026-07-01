import Link from "next/link";
import { FileUp, FileCheck2, Clock3, AlertTriangle } from "lucide-react";

import { AdminHeader } from "@/components/admin/admin-header";
import { StatusMessage } from "@/components/admin/status-message";
import { AppShell } from "@/components/layout/app-shell";
import { MetricCard } from "@/components/layout/metric-card";
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
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { requireRole } from "@/lib/auth/require-role";
import { listDocuments } from "@/lib/data-access/documents";

import { uploadDocumentAction } from "./actions";

type KnowledgePageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export default async function AdminKnowledgePage({
  searchParams,
}: KnowledgePageProps) {
  const [params, context] = await Promise.all([
    searchParams,
    requireRole("manager"),
  ]);
  const documents = await listDocuments(context.orgId);
  const approved = documents.filter((document) => document.status === "approved");
  const awaitingReview = documents.filter(
    (document) => document.status === "ready_for_review"
  );
  const needsAttention = documents.filter((document) =>
    ["failed", "outdated"].includes(document.status)
  );

  return (
    <AppShell context={context}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <AdminHeader
          title="Knowledge"
          description="Upload company documents and approve the verified knowledge that will later power search, onboarding generation, and the AI assistant."
          role={context.role}
        />

        <StatusMessage error={params.error} message={params.message} />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={FileUp}
            label="Documents"
            value={documents.length}
            helper="Uploaded files"
          />
          <MetricCard
            icon={FileCheck2}
            label="Approved"
            value={approved.length}
            helper="Ready for future RAG"
            tone="mint"
          />
          <MetricCard
            icon={Clock3}
            label="Review"
            value={awaitingReview.length}
            helper="Need approval"
            tone="amber"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Attention"
            value={needsAttention.length}
            helper="Failed or outdated"
            tone="rose"
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
            <CardDescription>
              Add an approved company source. TXT files become searchable
              immediately; other supported formats remain available for review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={uploadDocumentAction}
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Employee handbook"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  accept=".pdf,.docx,.pptx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                  id="file"
                  name="file"
                  required
                  type="file"
                />
              </div>
              <Button type="submit">Upload</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Document review queue</CardTitle>
            <CardDescription>
              Approve only documents that are safe to use as company knowledge.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <EmptyState
                icon={FileUp}
                title="Build your approved knowledge layer"
                description="Upload your first handbook, SOP, or product guide. Review it before Company AI can use it."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-4 font-medium">Document</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">Department</th>
                      <th className="py-2 pr-4 font-medium">Size</th>
                      <th className="py-2 pr-4 font-medium">Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr
                        className="border-b align-top transition-colors hover:bg-muted/30 last:border-0"
                        key={document.id}
                      >
                        <td className="py-3 pr-4">
                          <div className="font-medium">{document.title}</div>
                          <div className="text-muted-foreground">
                            {document.fileName}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={document.status} />
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {document.departmentName ?? "No department"}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatBytes(document.fileSize)}
                        </td>
                        <td className="py-3 pr-4">
                          <Link
                            className={buttonVariants({ variant: "outline" })}
                            href={`/admin/knowledge/${document.id}`}
                          >
                            Open
                          </Link>
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
