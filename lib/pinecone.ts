import { Pinecone } from '@pinecone-database/pinecone';
import { timeStamp } from 'console';
import { Vault } from 'lucide-react';

let pineconeClient: Pinecone | null = null;

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
      id: `${documentId}-chunk-${index}`,
      Values: chunk.embeddings,
      metadata: {
        documentId,
        content: chunk.content,
        title: metadata.filename,
        fileType: metadata.fileType,
        timeStamp: new Date().toISOString(),
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
