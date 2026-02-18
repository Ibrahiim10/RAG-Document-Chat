import { generateEmbedding } from '@/lib/ai/embeddings';
import { getDocument } from '@/lib/mongodb';
import { DocumentSource, searchSimilarVectors } from '@/lib/pinecone';
import { UIMessage, validateUIMessages } from 'ai';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, message: singleMessage, selectedDocumentId } = body;

    if (!selectedDocumentId) {
      return new Response('Document ID is required', { status: 400 });
    }

    let allMessages: UIMessage[];
    let messageText: string;

    if (singleMessage) {
      allMessages = [singleMessage];
      messageText =
        singleMessage.parts?.find((part: any) => part.type === 'text')?.text ||
        singleMessage.content ||
        '';
    } else if (messages && messages.length > 0) {
      allMessages = messages;
      const lastMessage = messages[messages.length - 1];
      messageText =
        lastMessage.parts?.find((part: any) => part.type === 'text')?.text ||
        lastMessage.content ||
        '';
    } else {
      return new Response('No messages provided', { status: 400 });
    }

    // validation
    let validatedMessages: UIMessage[];

    try {
      validatedMessages = await validateUIMessages({ messages: allMessages });
    } catch (error) {
      console.error('Error validating messages:', error);
      validatedMessages = allMessages; // fallback to original messages if validation fails
    }

    let context = '';

    if (selectedDocumentId && messageText) {
      try {
        const document = await getDocument(selectedDocumentId);

        if (document) {
          // generate embeddings
          const queryEmbedding = await generateEmbedding(messageText);

          // pinecone similarity search
          const searchResults = await searchSimilarVectors(queryEmbedding, 5, {
            documentId: { $eq: selectedDocumentId },
          });

          //   prepare context using rareked format
          const contextChunks = searchResults
            .map(
              (source: DocumentSource, index: number) =>
                `[Source ${index + 1}] : ${source.content} || No context`,
            )
            .join('\n\n');
          context = `You have access to the following context from the document ${document.title}: \n\n ${contextChunks}`;
        }
      } catch (error) {}
    }
  } catch (error) {
    console.error('Error in chat API:', error);
  }
}
