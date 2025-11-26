import React from 'react';
import MessageHeader from './MessageHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChatStore } from '../../store/useChatStore';
import { MessageCircle } from 'lucide-react';

interface MessageAreaProps {
  conversationId: string | null;
  onBack?: () => void;
}

const MessageArea: React.FC<MessageAreaProps> = ({ conversationId, onBack }) => {
  const { getConversationById } = useChatStore();
  const conversation = conversationId ? getConversationById(conversationId) : null;

  if (!conversationId) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <MessageCircle className="w-16 h-16 mb-4" />
        <h3 className="text-lg font-semibold">Selecione uma conversa</h3>
        <p>Ou inicie uma nova conversa para começar a conversar.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <MessageHeader
        conversation={
          conversation ?? {
            id: conversationId,
            participantIds: [],
            lastMessageTimestamp: new Date(),
            unreadCount: 0,
          }
        }
        onBack={onBack}
      />
      <MessageList conversationId={conversationId} />
      <MessageInput conversationId={conversationId} />
    </div>
  );
};

export default MessageArea;
