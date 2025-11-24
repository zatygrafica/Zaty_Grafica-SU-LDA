import { create } from 'zustand';
import type { ChatMessage, Conversation } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { useStore } from './useStore';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage>;
  soundEnabled: boolean;
  loading: boolean;
  error: string | null;
  listConversations: () => Promise<Conversation[]>;
  listMessagesForConversation: (convoId: string) => Promise<ChatMessage[]>;
  getConversationById: (convoId: string) => Conversation | undefined;
  getMessagesForConversation: (convoId: string) => ChatMessage[];
  startOrGetConversation: (participantId: string) => Promise<Conversation>;
  sendMessage: (conversationId: string, content: string, attachment?: ChatMessage['attachment']) => Promise<ChatMessage | undefined>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  toggleSound: () => void;
}

const normalizeConversation = (conversation: Conversation): Conversation => ({
  ...conversation,
  lastMessageTimestamp: conversation.lastMessageTimestamp ? new Date(conversation.lastMessageTimestamp) : new Date(),
});

const normalizeMessage = (message: ChatMessage): ChatMessage => ({
  ...message,
  timestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
});

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  soundEnabled: true,
  loading: false,
  error: null,

  listConversations: async () => {
    set({ loading: true, error: null });
    try {
      const conversations = await dataProvider.list<Conversation>('conversations');
      const normalized = conversations.map(normalizeConversation).sort(
        (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
      );
      set({ conversations: normalized, loading: false });
      return normalized;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  listMessagesForConversation: async (convoId) => {
    try {
      const messages = await dataProvider.list<ChatMessage>('messages');
      const filtered = messages.filter((msg) => msg.conversationId === convoId).map(normalizeMessage);
      set((state) => ({
        messages: {
          ...state.messages,
          ...Object.fromEntries(filtered.map((msg) => [msg.id, msg])),
        },
      }));
      return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  getConversationById: (convoId) => get().conversations.find((c) => c.id === convoId),

  getMessagesForConversation: (convoId) =>
    Object.values(get().messages)
      .filter((msg) => msg.conversationId === convoId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),

  startOrGetConversation: async (participantId) => {
    const { currentUser } = useStore.getState();
    if (!currentUser) throw new Error('No current user');

    const participantIds = [currentUser.id, participantId].sort();
    const conversationId = participantIds.join('-');

    const existingConversation = get().conversations.find((c) => c.id === conversationId);
    if (existingConversation) {
      return existingConversation;
    }

    const newConversation: Conversation = {
      id: conversationId,
      participantIds,
      lastMessageTimestamp: new Date(),
      unreadCount: 0,
    };

    try {
      const created = await dataProvider.create<Conversation>('conversations', newConversation);
      const normalized = normalizeConversation(created);
      set((state) => ({
        conversations: [normalized, ...state.conversations].sort(
          (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
        ),
      }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  sendMessage: async (conversationId, content, attachment) => {
    const { currentUser, addAuditLog } = useStore.getState();
    if (!currentUser) return undefined;

    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: currentUser.id,
      content,
      timestamp: new Date(),
      status: 'sent',
      attachment,
    };

    try {
      const created = await dataProvider.create<ChatMessage>('messages', newMessage);
      const normalized = normalizeMessage(created);
      set((state) => ({
        messages: { ...state.messages, [normalized.id]: normalized },
        conversations: state.conversations
          .map((c) =>
            c.id === conversationId ? { ...c, lastMessageTimestamp: normalized.timestamp } : c
          )
          .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()),
      }));
      await dataProvider.update('conversations', conversationId, { lastMessageTimestamp: normalized.timestamp });
      addAuditLog({ action: 'create', resourceType: 'ChatMessage', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  markConversationAsRead: async (conversationId) => {
    const { currentUser } = useStore.getState();
    if (!currentUser) return;

    set((state) => {
      const newMessages = { ...state.messages };
      Object.values(newMessages).forEach((msg) => {
        if (msg.conversationId === conversationId && msg.senderId !== currentUser.id && msg.status === 'sent') {
          newMessages[msg.id] = { ...msg, status: 'read' };
        }
      });

      return {
        messages: newMessages,
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        ),
      };
    });

    try {
      await dataProvider.update('conversations', conversationId, { unreadCount: 0 });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
