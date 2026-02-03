import { getAllDocuments } from '@/lib/mongodb';
import { NextResponse } from 'next/server';

// GET /api/documents - Get all documents
export async function GET() {
  try {
    const documents = await getAllDocuments();

    return NextResponse.json({
      success: true,
      documents: documents.map((doc) => ({
        documentId: doc.documentId,
        title: doc.title,
        filename: doc.filename,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        processedAt: doc.processedAt,
        status: doc.status,
        chunkCount: doc.chunkCount,
        vectorCount: doc.vectorCount,
        contentLength: doc.contentLength,
      })),
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}
