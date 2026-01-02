import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import MessageArea from './MessageArea';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useChatStore } from '../../store/useChatStore';
import { useUserStore } from '../../store/useUserStore';

const ChatModule: React.FC = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { conversations, listConversations, subscribeToRealtime } = useChatStore();

  useEffect(() => {
    void listConversations();
    // Use listUsersForChat instead of listUsers to bypass admin-only Edge Function
    void useUserStore.getState().listUsersForChat();

    // Subscribe to chat realtime updates
    const unsubscribeChat = subscribeToRealtime();

    // Subscribe to user profiles realtime updates (for new users/updates)
    const unsubscribeUsers = useUserStore.getState().subscribeToRealtime();

    return () => {
      unsubscribeChat();
      unsubscribeUsers();
    };
  }, [listConversations, subscribeToRealtime]);

  useEffect(() => {
    // Select the first conversation by default on desktop
    if (!isMobile && !selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, isMobile]);

  if (isMobile) {
    return (
      <div className="h-full overflow-hidden">
        {selectedConversationId ? (
          <MessageArea
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        ) : (
          <ConversationList
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-white dark:bg-neutral-950/50 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      <MessageArea conversationId={selectedConversationId} />
    </div>
  );
};

export default ChatModule;
