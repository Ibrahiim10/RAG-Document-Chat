import { generateEmbedding } from '@/lib/ai/embeddings';
import { connectDB, getDocument } from '@/lib/mongodb';
import { DocumentSource, searchSimilarVectors } from '@/lib/pinecone';
import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  UIMessage,
  validateUIMessages,
} from 'ai';
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
      } catch (error) {
        console.error('Error retrieving document context:', error);
      }
    }

    const result = streamText({
      model: openai('gpt-5-2025-08-07'),
      system: `You are a helpful assistant that answers questions based on document context.

        ${context || 'No context available'}

        
        IMPORTANT INSTRUCTION:
            -Extract specific facts, numbers, and details from the context above
            -If the context contain the answer, provide the exact information
            -Quote specific clearAllModuleContexts, percentages, and figures when available
            -If the context doesn't contain the requested information, clearly state this
            -Always base your answer on the provided context, not general knowledge`,
      messages: convertToModelMessages(validatedMessages),
      temperature: 0.1,
    });

    result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({
        prefix: 'msg',
        size: 16,
      }),

      onFinish: async ({ messages }) => {
        try {
          await connectDB();
          const conversationId = selectedDocumentId;

          // save all messages to the database

          for (const message of messages) {
            // extract text content from the message
            const textContent = message.parts
              ?.filter((part: any) => part.type === 'text')
              .map((part: any) => part.text)
              .join('');

            // save message to the database
            const { Message } = await import('@/lib/mongodb');
            await Message.create({
              id: message.id,
              conversationId,
              content: textContent,
              role: message.role,
              createdAt: new Date(),
              documentId: selectedDocumentId,
              context:
                message.role === 'assistant' ? context.substring(0, 1000) : '',
            });
            console.log('Messages saved successfully in onFinish');
          }
        } catch (error) {
          console.error('Error in onFinish handler:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
