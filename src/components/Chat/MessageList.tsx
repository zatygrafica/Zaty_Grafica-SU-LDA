import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/useChatStore';
import { useStore } from '../../store/useStore';
import MessageBubble from './MessageBubble';
import { AnimatePresence, motion } from 'framer-motion';

interface MessageListProps {
  conversationId: string;
}

const MessageList: React.FC<MessageListProps> = ({ conversationId }) => {
  const { getMessagesForConversation, markConversationAsRead, soundEnabled } = useChatStore();
  const { currentUser } = useStore();
  const messages = getMessagesForConversation(conversationId);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const isInitialLoad = useRef(true);
  const prevMessageCount = useRef(messages.length);

  useEffect(() => {
    void markConversationAsRead(conversationId);
  }, [conversationId, markConversationAsRead]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        prevMessageCount.current = messages.length;
        return;
    }

    if (messages.length > prevMessageCount.current) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.senderId !== currentUser?.id && soundEnabled) {
            const audio = new Audio('/assets/sounds/notify.mp3');
            audio.play().catch(e => console.error("Error playing sound:", e));
        }
    }

    prevMessageCount.current = messages.length;
  }, [messages, currentUser?.id, soundEnabled]);


  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-neutral-950">
      <div className="space-y-4">
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              layout
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -50 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
};

export default MessageList;
