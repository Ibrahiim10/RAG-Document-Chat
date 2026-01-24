import { createDocument } from '@/lib/mongodb';
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


  } catch (error) {}
}
