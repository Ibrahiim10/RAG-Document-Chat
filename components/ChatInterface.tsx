'use client';

import { DefaultChatTransport, UIMessage } from 'ai';
import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from './ui/avatar';
import { ArrowLeft, Bot, Send, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Streamdown } from 'streamdown';

interface ChatInterfaceProps {
  selectedDocumentId: string;
  initialMessages: UIMessage[];
  documentTitle: string;
}

export default function ChatInterface({
  selectedDocumentId,
  initialMessages,
  documentTitle,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');

  // AI SDK v5 useChat hook with transport
  const { messages, sendMessage, status, error, stop } = useChat({
    id: selectedDocumentId, // Use document ID as conversation ID
    messages: initialMessages, // ✅ Load initial messages from server
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            message: messages[messages.length - 1], // ✅ Only send last message
            selectedDocumentId: selectedDocumentId,
          },
        };
      },
    }),
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-rose-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-rose-500 text-white font-medium">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {documentTitle}
              </h1>
              <p className="text-sm text-rose-500">Chat with AI Assistant</p>
            </div>
          </div>
          <Link href="/">
            <Button
              variant="outline"
              className="border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-6 bg-rose-100 rounded-full flex items-center justify-center">
                <Bot className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-500">
                Ask me anything about your document! I'm here to help.
              </p>
            </div>
          )}

          {/* messages list */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-2xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                {!(
                  message.role === 'assistant' &&
                  (status === 'submitted' || status === 'streaming')
                ) && (
                  <Avatar className="h-7 w-7 flex-shrink-0">
                    {message.role === 'user' ? (
                      <AvatarFallback className="bg-rose-500 text-white text-xs">
                        <User className="h-3 w-3" />
                      </AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-red-100">
                        <Bot className="h-3 w-3 text-rose-500" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                )}

                {/* space when avatar is hidden to maintain alignment */}

                {message.role === 'assistant' &&
                  (status === 'submitted' || status === 'streaming') && (
                    <div className="h-7 w-7 flex-shrink-0" />
                  )}

                <div
                  className={`rounded-r-2xl px-4 py-3 ${message.role === 'user' ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-800 border-gray-100'}`}
                >
                  <div className="text-sm leading-relaxed">
                    {message.parts.map((part, i) => {
                      switch (part.type) {
                        case 'text':
                          return message.role === 'assistant' ? (
                            <Streamdown parseIncompleteMarkdown key={i}>
                              {part.text}
                            </Streamdown>
                          ) : (
                            <span key={i}>{part.text}</span>
                          );
                        default:
                          return null;
                      }
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Input */}
      <div className="bg-white border-t border-rose-100 p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <input
              className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-colors"
              value={input}
              placeholder="Type your message..."
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'ready'}
            />
            <Button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className="px-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
