import ChatInterface from '@/components/ChatInterface';
import { connectDB, getDocument, getMessages } from '@/lib/mongodb';
import { UIMessage } from 'ai';
import { redirect } from 'next/navigation';
import React from 'react';

interface PageProps {
  params: Promise<{ documentId: string }>;
}

async function loadChatHistory(documentId: string): Promise<UIMessage[]> {
  try {
    await connectDB();

    // get chat history from MongoDB based on documentId
    const messages = await getMessages(documentId);

    // convert to UIMessage format
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant',
      parts: [{ type: 'text' as const, text: msg.content }],
      createdAt: new Date(msg.createdAt),
    }));
  } catch (error) {
    console.error('Error loading chat history:', error);
    throw error;
  }
}

export default async function ChatPage({ params }: PageProps) {
  const { documentId } = await params;

  console.log('Chat page - documentId:', documentId);

  // Validate document exists
  const document = await getDocument(documentId);
  console.log('Chat page - document found:', !!document);

  if (!document) {
    console.log('Chat page - document not found, redirecting to home');
    redirect('/');
  }

  const initialMessages = await loadChatHistory(documentId);
  return (
    <ChatInterface
      selectedDocumentId={documentId}
      initialMessages={initialMessages}
      documentTitle={document.title}
    />
  );
}

// export default ChatPage;
