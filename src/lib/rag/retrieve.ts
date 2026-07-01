import "server-only";

import { createEmbedding } from "@/lib/ai/embeddings";
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
  embedding: number[] | string | null;
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

function parseEmbedding(value: ChunkSearchRow["embedding"]) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = value
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map(Number);

  return parsed.every(Number.isFinite) ? parsed : null;
}

function cosineSimilarity(left: number[], right: number[]) {
  if (left.length !== right.length || left.length === 0) {
    return null;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dotProduct += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return null;
  }

  return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
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
  const queryEmbedding = await createEmbedding(question);

  const { data, error } = await supabase
    .from("document_chunks")
    .select(
      `
        id,
        document_id,
        content,
        embedding,
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
    .limit(500);

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
        score: (() => {
          const keywordScore = scoreChunk(row.content, terms);
          const chunkEmbedding = parseEmbedding(row.embedding);
          const semanticScore =
            queryEmbedding && chunkEmbedding
              ? cosineSimilarity(queryEmbedding, chunkEmbedding)
              : null;

          return semanticScore === null
            ? keywordScore
            : semanticScore + Math.min(keywordScore, 5) * 0.12;
        })(),
      } satisfies RetrievedChunk;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
