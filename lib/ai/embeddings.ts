import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const embeddingModel = openai.embedding('text-embedding-3-small');

// upload - embedMany - chunk
// query - embed - query

// Generate embeddings for multiple text chunks
export async function generateEmbeddings(
  chunks: string[],
): Promise<Array<{ content: string; embedding: number[] }>> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  return chunks.map((chunk, index) => ({
    content: chunk,
    embedding: embeddings[index],
  }));
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    value: text,
    model: embeddingModel,
  });

  return embedding;
}
