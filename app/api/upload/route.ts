import { generateEmbeddings } from '@/lib/ai/embeddings';
import { processDocument } from '@/lib/document-processor';
import { createDocument, updateDocument } from '@/lib/mongodb';
import { storeVectors } from '@/lib/pinecone';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1- get the file from the request

    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 2- Validate the file

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // TODO: Validate the file type

    // Validate file size (10MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 100MB.' },
        { status: 400 },
      );
    }

    // Generate unique document ID
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 3- Save the file information to the database

    await createDocument({
      documentId,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      filename: file.name,
      fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'processing',
    });

    // 4- Process the document (extract text and create chunks)

    const { content, chunks } = await processDocument(file);

    if (chunks.length === 0) {
      // update the document status to error
      await updateDocument(documentId, {
        status: 'error',
        errorMessage: 'No chunks were created from the document',
      });
      return NextResponse.json(
        { error: 'No chunks were created from the document' },
        { status: 400 },
      );
    }

    // 5- Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // 6- Store vectors in pinecone
    const vectorCount = await storeVectors(documentId, embeddings, {
      title: file.name.replace(/\.[^/.]+$/, ''),
      filename: file.name,
      fileType: file.name.split('.').pop()?.toLowerCase() || 'unknown',
    });

    // 7- Update document in MongoDB with completion status
    await updateDocument(documentId, {
      status: 'completed',
      processedAt: new Date(),
      chunkCount: chunks.length,
      vectorCount,
      contentLength: content.length,
    });

    // 8- Return success response
    return NextResponse.json({
      success: true,
      documentId,
      filename: file.name,
      message: `Successfully processed ${chunks.length} chunks and stored ${vectorCount} vectors.`,
      status: {
        originalSize: file.size,
        chunkCount: chunks.length,
        vectorCount,
        contentLength: content.length,
      },
    });
  } catch (error) {
    console.error('Upload processing error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
