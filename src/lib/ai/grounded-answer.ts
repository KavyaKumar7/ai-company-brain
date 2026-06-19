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

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      answer: buildExtractiveAnswer(chunks),
      usedAi: false,
    };
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 900,
      temperature: 0,
      system:
        "You answer employee questions using only the provided CONTEXT. If the context does not contain the answer, reply exactly: I don't have verified information on that. Do not use outside knowledge. Keep the answer concise and practical.",
      messages: [
        {
          role: "user",
          content: `CONTEXT:\n${buildContext(chunks)}\n\nQUESTION:\n${question}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return {
      answer: buildExtractiveAnswer(chunks),
      usedAi: false,
    };
  }

  const payload = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const answer =
    payload.content
      ?.map((item) => (item.type === "text" ? item.text ?? "" : ""))
      .join("")
      .trim() || buildExtractiveAnswer(chunks);

  return {
    answer,
    usedAi: true,
  };
}
