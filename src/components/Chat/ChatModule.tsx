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
    void useUserStore.getState().listUsers(true);
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
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
    <div className="flex h-[calc(100vh-120px)] bg-white dark:bg-neutral-950/50 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelectConversation={setSelectedConversationId}
      />
      <MessageArea conversationId={selectedConversationId} />
    </div>
  );
};

export default ChatModule;
