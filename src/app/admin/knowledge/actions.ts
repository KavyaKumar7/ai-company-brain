"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createActivityLog } from "@/lib/data-access/activity-log";
import {
  createDocument,
  updateDocumentMetadata,
  updateDocumentStatus,
  type DocumentConfidentiality,
  type DocumentStatus,
} from "@/lib/data-access/documents";
import { createClient } from "@/lib/supabase/server";

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);
const allowedStatuses = new Set<DocumentStatus>([
  "ready_for_review",
  "approved",
  "outdated",
  "archived",
  "failed",
]);
const allowedConfidentiality = new Set<DocumentConfidentiality>([
  "public",
  "internal",
  "restricted",
]);

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function redirectWithParam(path: string, key: "error" | "message", value: string): never {
  redirect(`${path}?${key}=${encodeURIComponent(value)}`);
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function uploadDocumentAction(formData: FormData) {
  const context = await requireRole("manager");
  const fileValue = formData.get("file");
  const title = getString(formData, "title");
  const pagePath = "/admin/knowledge";

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    redirectWithParam(pagePath, "error", "Choose a document to upload.");
  }

  if (!allowedMimeTypes.has(fileValue.type)) {
    redirectWithParam(
      pagePath,
      "error",
      "Upload a PDF, DOCX, PPTX, or TXT file."
    );
  }

  const supabase = await createClient();
  const documentId = crypto.randomUUID();
  const safeName = sanitizeFileName(fileValue.name);
  const filePath = `${context.orgId}/${documentId}/${safeName}`;
  const bytes = await fileValue.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(filePath, bytes, {
      contentType: fileValue.type,
      upsert: false,
    });

  if (uploadError) {
    redirectWithParam(
      pagePath,
      "error",
      `Upload failed: ${uploadError.message}. Make sure migration 009 has been run in Supabase.`
    );
  }

  try {
    const document = await createDocument({
      id: documentId,
      orgId: context.orgId,
      title: title || fileValue.name,
      filePath,
      fileName: fileValue.name,
      fileType: fileValue.type,
      fileSize: fileValue.size,
      ownerUserId: context.userId,
    });

    await createActivityLog({
      orgId: context.orgId,
      userId: context.userId,
      action: "document.uploaded",
      targetType: "document",
      targetId: document.id,
      metadata: {
        title: document.title,
        fileName: document.fileName,
        fileType: document.fileType,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Document record could not be created.";
    redirectWithParam(
      pagePath,
      "error",
      `${message} Run migration 009 in Supabase, then try again.`
    );
  }

  revalidatePath(pagePath);
  revalidatePath("/dashboard");
  redirectWithParam(pagePath, "message", "Document uploaded for review.");
}

export async function updateDocumentMetadataAction(formData: FormData) {
  const context = await requireRole("manager");
  const documentId = getString(formData, "documentId");
  const title = getString(formData, "title");
  const departmentId = getString(formData, "departmentId") || null;
  const effectiveDate = getString(formData, "effectiveDate") || null;
  const reviewDate = getString(formData, "reviewDate") || null;
  const confidentiality = getString(formData, "confidentiality") as DocumentConfidentiality;
  const tags = getTags(getString(formData, "tags"));
  const summary = getString(formData, "summary") || null;
  const pagePath = `/admin/knowledge/${documentId}`;

  if (!documentId || !title) {
    redirectWithParam("/admin/knowledge", "error", "Document title is required.");
  }

  if (!allowedConfidentiality.has(confidentiality)) {
    redirectWithParam(pagePath, "error", "Choose a valid confidentiality level.");
  }

  await updateDocumentMetadata({
    orgId: context.orgId,
    documentId,
    title,
    departmentId,
    effectiveDate,
    reviewDate,
    confidentiality,
    tags,
    summary,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "document.metadata_updated",
    targetType: "document",
    targetId: documentId,
    metadata: { title, confidentiality, departmentId },
  });

  revalidatePath(pagePath);
  revalidatePath("/admin/knowledge");
  redirectWithParam(pagePath, "message", "Document metadata updated.");
}

export async function updateDocumentStatusAction(formData: FormData) {
  const context = await requireRole("manager");
  const documentId = getString(formData, "documentId");
  const status = getString(formData, "status") as DocumentStatus;
  const pagePath = `/admin/knowledge/${documentId}`;

  if (!documentId || !allowedStatuses.has(status)) {
    redirectWithParam("/admin/knowledge", "error", "Choose a valid document status.");
  }

  await updateDocumentStatus({
    orgId: context.orgId,
    documentId,
    status,
  });

  await createActivityLog({
    orgId: context.orgId,
    userId: context.userId,
    action: "document.status_updated",
    targetType: "document",
    targetId: documentId,
    metadata: { status },
  });

  revalidatePath(pagePath);
  revalidatePath("/admin/knowledge");
  revalidatePath("/dashboard");
  redirectWithParam(pagePath, "message", "Document status updated.");
}
