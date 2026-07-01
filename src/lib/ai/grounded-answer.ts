import "server-only";

import type { RetrievedChunk } from "@/lib/rag/retrieve";

const fallbackAnswer = "I don't have verified information on that.";

function buildContext(chunks: RetrievedChunk[]) {
  return chunks
    .map(
      (chunk, index) => `SOURCE ${index + 1}
chunk_id: ${chunk.id}
document: ${chunk.documentTitle}
effective_date: ${chunk.effectiveDate ?? "unknown"}
page: ${chunk.page ?? "unknown"}
section: ${chunk.section ?? "unknown"}
content:
${chunk.content}`
    )
    .join("\n\n---\n\n");
}

function buildExtractiveAnswer(chunks: RetrievedChunk[]) {
  if (chunks.length === 0) {
    return fallbackAnswer;
  }

  const bestChunk = chunks[0];
  const excerpt = bestChunk.content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 900);

  return `${excerpt}${bestChunk.content.length > 900 ? "..." : ""}`;
}

export async function generateGroundedAnswer({
  question,
  chunks,
}: {
  question: string;
  chunks: RetrievedChunk[];
}) {
  if (chunks.length === 0) {
    return {
      answer: fallbackAnswer,
      usedAi: false,
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      answer: buildExtractiveAnswer(chunks),
      usedAi: false,
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      max_output_tokens: 900,
      reasoning: { effort: "none" },
      instructions:
        "You answer employee questions using only the provided CONTEXT. If the context does not contain the answer, reply exactly: I don't have verified information on that. Do not use outside knowledge. Keep the answer concise and practical.",
      input: `CONTEXT:\n${buildContext(chunks)}\n\nQUESTION:\n${question}`,
    }),
  });

  if (!response.ok) {
    return {
      answer: buildExtractiveAnswer(chunks),
      usedAi: false,
    };
  }

  const payload = (await response.json()) as {
    output?: Array<{
      type: string;
      content?: Array<{ type: string; text?: string }>;
    }>;
  };
  const answer =
    payload.output
      ?.flatMap((item) => (item.type === "message" ? item.content ?? [] : []))
      .map((item) => (item.type === "output_text" ? item.text ?? "" : ""))
      .join("")
      .trim() || buildExtractiveAnswer(chunks);

  return {
    answer,
    usedAi: true,
  };
}
