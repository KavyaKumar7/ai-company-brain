import "server-only";

import { createClient } from "@/lib/supabase/server";

export type DocumentStatus =
  | "processing"
  | "ready_for_review"
  | "approved"
  | "outdated"
  | "archived"
  | "failed";

export type DocumentConfidentiality = "public" | "internal" | "restricted";

export type KnowledgeDocument = {
  id: string;
  organizationId: string;
  title: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  ownerUserId: string;
  departmentId: string | null;
  departmentName: string | null;
  version: number;
  effectiveDate: string | null;
  reviewDate: string | null;
  confidentiality: DocumentConfidentiality;
  tags: string[];
  status: DocumentStatus;
  summary: string | null;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
};

type DocumentRow = {
  id: string;
  organization_id: string;
  title: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  owner_user_id: string;
  department_id: string | null;
  version: number;
  effective_date: string | null;
  review_date: string | null;
  confidentiality: DocumentConfidentiality;
  tags: string[];
  status: DocumentStatus;
  summary: string | null;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
  departments:
    | {
        name: string;
      }
    | {
        name: string;
      }[]
    | null;
};

function normalizeDepartment(row: DocumentRow["departments"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

function mapDocument(row: DocumentRow): KnowledgeDocument {
  const department = normalizeDepartment(row.departments);

  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    filePath: row.file_path,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    ownerUserId: row.owner_user_id,
    departmentId: row.department_id,
    departmentName: department?.name ?? null,
    version: row.version,
    effectiveDate: row.effective_date,
    reviewDate: row.review_date,
    confidentiality: row.confidentiality,
    tags: row.tags ?? [],
    status: row.status,
    summary: row.summary,
    processingError: row.processing_error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function documentSelect() {
  return `
    id,
    organization_id,
    title,
    file_path,
    file_name,
    file_type,
    file_size,
    owner_user_id,
    department_id,
    version,
    effective_date,
    review_date,
    confidentiality,
    tags,
    status,
    summary,
    processing_error,
    created_at,
    updated_at,
    departments (
      name
    )
  `;
}

function isMissingDocumentsTable(message: string) {
  return (
    message.includes("documents") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find the table"))
  );
}

export async function listDocuments(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect())
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingDocumentsTable(error.message)) {
      return [];
    }

    throw new Error(`Failed to load documents: ${error.message}`);
  }

  return ((data ?? []) as unknown as DocumentRow[]).map(mapDocument);
}

export async function getDocumentById({
  orgId,
  documentId,
}: {
  orgId: string;
  documentId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(documentSelect())
    .eq("organization_id", orgId)
    .eq("id", documentId)
    .single();

  if (error) {
    throw new Error(`Failed to load document: ${error.message}`);
  }

  return mapDocument(data as unknown as DocumentRow);
}

export async function createDocument({
  id,
  orgId,
  title,
  filePath,
  fileName,
  fileType,
  fileSize,
  ownerUserId,
}: {
  id: string;
  orgId: string;
  title: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  ownerUserId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id,
      organization_id: orgId,
      title,
      file_path: filePath,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      owner_user_id: ownerUserId,
      status: "ready_for_review",
    })
    .select(documentSelect())
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  return mapDocument(data as unknown as DocumentRow);
}

export async function updateDocumentMetadata({
  orgId,
  documentId,
  title,
  departmentId,
  effectiveDate,
  reviewDate,
  confidentiality,
  tags,
  summary,
}: {
  orgId: string;
  documentId: string;
  title: string;
  departmentId: string | null;
  effectiveDate: string | null;
  reviewDate: string | null;
  confidentiality: DocumentConfidentiality;
  tags: string[];
  summary: string | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .update({
      title,
      department_id: departmentId,
      effective_date: effectiveDate,
      review_date: reviewDate,
      confidentiality,
      tags,
      summary,
    })
    .eq("organization_id", orgId)
    .eq("id", documentId)
    .select(documentSelect())
    .single();

  if (error) {
    throw new Error(`Failed to update document metadata: ${error.message}`);
  }

  return mapDocument(data as unknown as DocumentRow);
}

export async function updateDocumentStatus({
  orgId,
  documentId,
  status,
}: {
  orgId: string;
  documentId: string;
  status: DocumentStatus;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .update({ status })
    .eq("organization_id", orgId)
    .eq("id", documentId)
    .select(documentSelect())
    .single();

  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }

  return mapDocument(data as unknown as DocumentRow);
}
