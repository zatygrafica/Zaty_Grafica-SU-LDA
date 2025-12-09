import React, { useMemo, useState } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import { ChatMessage, User as UserType } from '../../types';
import { Search, User as UserIcon, Volume2, VolumeX } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { clsx } from 'clsx';
import Input from '../Common/Input';
import Button from '../Common/Button';

interface ConversationListProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ selectedConversationId, onSelectConversation }) => {
  const { currentUser } = useStore();
  const { users } = useUserStore();
  const { conversations, messages, startOrGetConversation, soundEnabled, toggleSound, onlineUserIds } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');

  const conversationDetails = useMemo(() => {
    console.log('[ConversationList] Building conversation details:', {
      conversationsCount: conversations.length,
      usersCount: users.length,
      currentUserId: currentUser?.id
    });

    const details = conversations
      .map((convo) => {
        const otherUserId = convo.participantIds.find((id) => id !== currentUser?.id);
        const otherUser = users.find((u) => u.id === otherUserId);

        if (!otherUser) {
          console.warn('[ConversationList] User not found for conversation:', {
            convoId: convo.id,
            participantIds: convo.participantIds,
            otherUserId,
            availableUserIds: users.map(u => u.id)
          });
        }

        const convoMessages = Object.values(messages).filter((m) => m.conversationId === convo.id);
        const lastMessage = convoMessages.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        return {
          ...convo,
          otherUser,
          lastMessage,
          isOnline: otherUser ? onlineUserIds.includes(otherUser.id) : false,
        };
      })
      .filter((details) => details.otherUser);

    console.log('[ConversationList] Final conversation details:', {
      totalDetails: details.length,
      uniqueUsers: new Set(details.map(d => d.otherUser?.id)).size
    });

    return details;
  }, [conversations, messages, users, currentUser, onlineUserIds]);

  const usersWithConversation = useMemo(() => {
    const set = new Set<string>();
    conversations.forEach((convo) => {
      const otherId = convo.participantIds.find((id) => id !== currentUser?.id);
      if (otherId) set.add(otherId);
    });
    return set;
  }, [conversations, currentUser?.id]);

  const allUsers = useMemo(
    () =>
      users
        .filter((user) => user.id !== currentUser?.id)
        // não duplicar: se já existe conversa com este user, não mostra na lista de iniciar conversa
        .filter((user) => !usersWithConversation.has(user.id))
        .filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [users, currentUser?.id, searchTerm, usersWithConversation]
  );

  const handleUserSelect = async (user: UserType) => {
    if (!currentUser) return;
    try {
      const convo = await startOrGetConversation(user.id);
      onSelectConversation(convo.id);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to start conversation', error);
    }
  };

  const renderLastMessage = (msg: ChatMessage | undefined) => {
    if (!msg) return 'Nenhuma mensagem';
    if (msg.attachment) return `Anexo: ${msg.attachment.name}`;
    return msg.content;
  };

  return (
    <div className="w-full md:w-1/3 md:min-w-[280px] md:max-w-[400px] flex flex-col border-r border-gray-200 dark:border-neutral-800">
      <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
        <Input
          icon={Search}
          placeholder="Pesquisar ou iniciar conversa"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button variant="ghost" size="sm" onClick={() => { void toggleSound(); }} title={soundEnabled ? "Desativar som" : "Ativar som"}>
          {soundEnabled ? <Volume2 className="w-5 h-5 text-gray-500" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-gray-200 dark:border-neutral-800">
          {allUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800/50"
            >
              <div className="relative">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <span
                  className={clsx(
                    'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white dark:border-neutral-900',
                    onlineUserIds.includes(user.id) ? 'bg-green-500' : 'bg-gray-400'
                  )}
                  title={onlineUserIds.includes(user.id) ? 'Online' : 'Offline'}
                />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Iniciar conversa</p>
              </div>
            </div>
          ))}
        </div>
        {conversationDetails.filter(cd => !searchTerm || cd.otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase())).map(({ id, otherUser, lastMessage, unreadCount, isOnline }) => (
          <div
            key={id}
            onClick={() => onSelectConversation(id)}
            className={clsx(
              "p-4 flex items-center gap-3 cursor-pointer border-l-4",
              selectedConversationId === id 
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' 
                : 'border-transparent hover:bg-gray-50 dark:hover:bg-neutral-800/50'
            )}
          >
            <div className="relative">
              {otherUser?.photoUrl ? (
                <img src={otherUser.photoUrl} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                </div>
              )}
              <span
                className={clsx(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white dark:border-neutral-900',
                  isOnline ? 'bg-green-500' : 'bg-gray-400'
                )}
                title={isOnline ? 'Online' : 'Offline'}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{otherUser?.name}</p>
                {lastMessage && <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">{formatDistanceToNow(new Date(lastMessage.timestamp), { locale: pt, addSuffix: true })}</p>}
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{renderLastMessage(lastMessage)}</p>
                {unreadCount > 0 && <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationList;
