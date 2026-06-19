import "server-only";

import { createClient } from "@/lib/supabase/server";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  documentTitle: string;
  effectiveDate: string | null;
  page: number | null;
  section: string | null;
  content: string;
  score: number;
};

type ChunkSearchRow = {
  id: string;
  document_id: string;
  content: string;
  page: number | null;
  section: string | null;
  documents:
    | {
        title: string;
        effective_date: string | null;
      }
    | {
        title: string;
        effective_date: string | null;
      }[]
    | null;
};

function normalizeDocument(row: ChunkSearchRow["documents"]) {
  if (Array.isArray(row)) {
    return row[0] ?? null;
  }

  return row;
}

function getQueryTerms(question: string) {
  const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "and",
    "are",
    "can",
    "does",
    "for",
    "from",
    "have",
    "how",
    "into",
    "our",
    "the",
    "their",
    "then",
    "there",
    "this",
    "what",
    "when",
    "where",
    "which",
    "who",
    "why",
    "with",
    "you",
    "your",
  ]);

  return [
    ...new Set(
      question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((term) => term.length > 2 && !stopWords.has(term))
    ),
  ];
}

function scoreChunk(content: string, terms: string[]) {
  const lowerContent = content.toLowerCase();

  return terms.reduce((score, term) => {
    const matches = lowerContent.match(new RegExp(`\\b${term}\\b`, "g"));
    return score + (matches?.length ?? 0);
  }, 0);
}

export async function retrieveApprovedChunks({
  orgId,
  question,
  limit = 8,
}: {
  orgId: string;
  question: string;
  limit?: number;
}) {
  const supabase = await createClient();
  const terms = getQueryTerms(question);

  if (terms.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("document_chunks")
    .select(
      `
        id,
        document_id,
        content,
        page,
        section,
        documents!inner (
          title,
          effective_date,
          status
        )
      `
    )
    .eq("organization_id", orgId)
    .eq("documents.status", "approved")
    .limit(200);

  if (error) {
    if (
      error.message.includes("document_chunks") &&
      (error.message.includes("schema cache") ||
        error.message.includes("does not exist") ||
        error.message.includes("Could not find the table"))
    ) {
      return [];
    }

    throw new Error(`Failed to retrieve document chunks: ${error.message}`);
  }

  return ((data ?? []) as unknown as ChunkSearchRow[])
    .map((row) => {
      const document = normalizeDocument(row.documents);

      return {
        id: row.id,
        documentId: row.document_id,
        documentTitle: document?.title ?? "Untitled document",
        effectiveDate: document?.effective_date ?? null,
        page: row.page,
        section: row.section,
        content: row.content,
        score: scoreChunk(row.content, terms),
      } satisfies RetrievedChunk;
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
