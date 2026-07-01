import "server-only";

type EmbeddingResponse = {
  data?: Array<{
    embedding: number[];
    index: number;
  }>;
};

export async function createEmbeddings(inputs: string[]) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || inputs.length === 0) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
        input: inputs,
        dimensions: 1536,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI embedding request failed.", await response.text());
      return null;
    }

    const payload = (await response.json()) as EmbeddingResponse;
    const ordered = [...(payload.data ?? [])].sort((a, b) => a.index - b.index);

    return ordered.length === inputs.length
      ? ordered.map((item) => item.embedding)
      : null;
  } catch (error) {
    console.error("OpenAI embedding request failed.", error);
    return null;
  }
}

export async function createEmbedding(input: string) {
  const embeddings = await createEmbeddings([input]);
  return embeddings?.[0] ?? null;
}
