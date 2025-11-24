import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import { Conversation } from '../../types';
import { ArrowLeft, User } from 'lucide-react';
import Button from '../Common/Button';

interface MessageHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ conversation, onBack }) => {
  const { currentUser } = useStore();
  const { users } = useUserStore();

  const otherUserId = conversation.participantIds.find(id => id !== currentUser?.id);
  const otherUser = users.find(u => u.id === otherUserId);

  return (
    <div className="flex items-center p-4 border-b border-gray-200 dark:border-neutral-800">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      {otherUser?.photoUrl ? (
        <img src={otherUser.photoUrl} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-500" />
        </div>
      )}
      <div className="ml-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">{otherUser?.name || 'Usuário Desconhecido'}</h3>
        {/* Can add online status here later */}
      </div>
    </div>
  );
};

export default MessageHeader;
