import React from 'react';

const ChatPage = ({ params }: { params: { documentId: string } }) => {
  return <div>ChatPage for document {params.documentId}</div>;
};

export default ChatPage;
