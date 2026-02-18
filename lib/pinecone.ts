import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export interface DocumentSource {
  documentId: string;
  documentTitle: string;
  chunkId: string;
  content: string;
  similarity: number;
}

// initialize pinecone client
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  return pineconeClient;
}

// get pinecone index
export function getPineconeIndex() {
  const client = getPineconeClient();
  return client.index(process.env.PINECONE_INDEX_NAME! || 'rag-document');
}

// store vectors in pinecone

export async function storeVectors(
  documentId: string,
  chunks: Array<{ content: string; embeddings: number[] }>,
  metadata: { title: string; filename: string; fileType: string },
) {
  try {
    const index = getPineconeIndex();

    const vectors = chunks.map((chunk, index) => ({
      id: `${documentId}-chunk-${index}`, // Unique ID for each chunk
      values: chunk.embedding, // The actual vector numbers
      metadata: {
        // Extra info stored with vector
        documentId,
        chunkIndex: index,
        content: chunk.content,
        title: metadata.title,
        filename: metadata.filename,
        fileType: metadata.fileType,
        timestamp: new Date().toISOString(),
      },
    }));

    //   upsert vectors
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }

    console.log(
      `${vectors.length} vectors stored in pinecone for document ${documentId}`,
    );
  } catch (error) {
    console.error(`Error storing vectors in pinecone:`, error);
    throw error;
  }
}

// Delete vector from pinecone

export async function deleteVectors(documentId: string) {
  try {
    const index = getPineconeIndex();
    await index.deleteMany({
      documentId,
    });

    console.log(`${documentId} vectors deleted from pinecone`);
  } catch (error) {
    console.error('Error deleting vectors from pinecone:', error);
    throw error;
  }
}

// search for similar vectors in pinecone
export async function searchSimilarVectors(
  queryEmbedding: number[],
  topK: number = 5,
  filter?: Record<string, any>,
) {
  try {
    const index = getPineconeIndex();
    const searchResult = await index.query({
      vector: queryEmbedding,
      topK,
      filter,
    });

    console.log('Search result:', searchResult);

    const sources: DocumentSource[] = [];
    for (const match of searchResult.matches || []) {
      if (!match.metadata || !match.metadata.documentId) continue;

      sources.push({
        documentId: match.metadata.documentId as string,
        documentTitle: match.metadata.title as string,
        chunkId: match.id,
        content: match.metadata.content as string,
        similarity: match.score as number,
      });
    }

    console.log('Sources', sources);
    return sources;
  } catch (error) {
    console.error('Error searching vectors in pinecone:', error);
    throw error;
  }
}
