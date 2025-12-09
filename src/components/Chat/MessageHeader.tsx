import React from 'react';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import { useChatStore } from '../../store/useChatStore';
import { Conversation } from '../../types';
import { ArrowLeft } from 'lucide-react';
import Button from '../Common/Button';
import Avatar from '../Common/Avatar';

interface MessageHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({ conversation, onBack }) => {
  const { currentUser } = useStore();
  const { users, loading, hasLoaded } = useUserStore();
  const { onlineUserIds } = useChatStore();

  const otherUserId =
    conversation.participantIds.find((id) => id !== currentUser?.id) ||
    conversation.participantIds[0];

  const otherUser = users.find((u) => u.id === otherUserId);
  const isOnline = otherUserId ? onlineUserIds.includes(otherUserId) : false;

  // Debug: Log when user is not found
  React.useEffect(() => {
    if (otherUserId && !otherUser && hasLoaded) {
      console.warn('[MessageHeader] User not found in store:', {
        otherUserId,
        usersCount: users.length,
        hasLoaded,
        loading,
        userIds: users.map((u) => u.id),
      });
    }
  }, [otherUserId, otherUser, hasLoaded, loading, users]);

  return (
    <div className="flex items-center p-4 border-b border-gray-200 dark:border-neutral-800">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mr-2 md:hidden">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <Avatar
        name={otherUser?.name || otherUserId || 'Usuário'}
        src={otherUser?.photoUrl}
        size="w-10 h-10"
      />
      <div className="ml-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {otherUser?.name || otherUserId || 'Usuário Desconhecido'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  );
};

export default MessageHeader;
