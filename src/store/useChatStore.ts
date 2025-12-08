import { create } from 'zustand';
import type { ChatMessage, Conversation } from '../types';
import { resilientDataProvider as dataProvider } from '../services/resilientDataProvider';
import { useStore } from './useStore';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase } from '../utils/case';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage>;
  onlineUserIds: string[];
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
  subscribeToRealtime: () => () => void;
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

// Helper function to deduplicate conversations by participants
const deduplicateConversations = (conversations: Conversation[]): Conversation[] => {
  const seen = new Map<string, Conversation>();

  conversations.forEach((convo) => {
    // Ensure participantIds exists and is valid
    if (!convo.participantIds || convo.participantIds.length === 0) {
      // Try to derive from conversation ID
      convo.participantIds = convo.id.split('-').filter(Boolean);
    }

    // Create a unique key based on sorted participant IDs
    const key = [...convo.participantIds].sort().join('-');

    // Keep the conversation with the most recent timestamp
    const existing = seen.get(key);
    if (!existing || new Date(convo.lastMessageTimestamp) > new Date(existing.lastMessageTimestamp)) {
      seen.set(key, convo);
    }
  });

  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime()
  );
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  onlineUserIds: [],
  soundEnabled: true,
  loading: false,
  error: null,

  listConversations: async () => {
    set({ loading: true, error: null });
    try {
      const conversations = await dataProvider.list<Conversation>('conversations');
      const normalized = conversations.map(normalizeConversation);
      const deduplicated = deduplicateConversations(normalized);
      set({ conversations: deduplicated, loading: false });
      return deduplicated;
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
    const participantKey = participantIds.join('-');
    const conversations = get().conversations;

    // Enhanced search: check by participantIds AND by participant key
    const existingConversation = conversations.find((c) => {
      if (!c.participantIds || c.participantIds.length !== 2) return false;
      const cKey = [...c.participantIds].sort().join('-');
      return cKey === participantKey;
    });

    if (existingConversation) {
      return existingConversation;
    }

    const conversationId = crypto.randomUUID();
    const newConversation: Conversation = {
      id: conversationId,
      participantIds,
      lastMessageTimestamp: new Date(),
      unreadCount: 0,
    };

    try {
      // Optimistic add with deduplication
      set((state) => {
        const allConversations = [newConversation, ...state.conversations];
        return {
          conversations: deduplicateConversations(allConversations),
        };
      });

      const created = await dataProvider.create<Conversation>('conversations', newConversation);
      const normalized = normalizeConversation(created);
      set((state) => {
        const allConversations = [normalized, ...state.conversations];
        return {
          conversations: deduplicateConversations(allConversations),
        };
      });
      return normalized;
    } catch (error) {
      const code = (error as { code?: string }).code;
      // Se já existe (violação de unique), tenta carregar e usar
      if (code === '23505') {
        try {
          const existing = await dataProvider.getById<Conversation>('conversations', conversationId);
          if (existing) {
            const normalized = normalizeConversation(existing);
            set((state) => {
              const allConversations = [normalized, ...state.conversations];
              return {
                conversations: deduplicateConversations(allConversations),
              };
            });
            return normalized;
          }
        } catch (fetchErr) {
          set({ error: (fetchErr as Error).message });
          throw fetchErr;
        }
      }
      set((state) => ({
        error: (error as Error).message,
        // rollback optimistic insert with deduplication
        conversations: deduplicateConversations(state.conversations.filter((c) => c.id !== newConversation.id)),
      }));
      throw error;
    }
  },

  sendMessage: async (conversationId, content, attachment) => {
    const { currentUser, addAuditLog } = useStore.getState();
    if (!currentUser) return undefined;

    // Ensure conversation exists locally
    const convo = get().getConversationById(conversationId);
    if (!convo) {
      // try to hydrate by deriving other participant
      const participantIds = conversationId.split('-').filter(Boolean);
      const otherUserId = participantIds.find((id) => id !== currentUser.id);
      if (otherUserId) {
        await get().startOrGetConversation(otherUserId);
      }
    }

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
      set((state) => {
        const updatedConversations = state.conversations.map((c) =>
          c.id === conversationId ? { ...c, lastMessageTimestamp: normalized.timestamp } : c
        );
        return {
          messages: { ...state.messages, [normalized.id]: normalized },
          conversations: deduplicateConversations(updatedConversations),
        };
      });
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
      await supabase
        .from('messages')
        .update({ status: 'read' })
        .eq('conversation_id', conversationId)
        .neq('sender_id', currentUser.id)
        .eq('status', 'sent');

      await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  subscribeToRealtime: () => {
    const { currentUser } = useStore.getState();
    const channel = supabase.channel('chat-realtime', {
      config: {
        presence: {
          key: currentUser?.id ?? 'anonymous',
        },
      },
    });

    const upsertConversation = (conversation: Conversation) => {
      const participantIds =
        conversation.participantIds && conversation.participantIds.length > 0
          ? conversation.participantIds
          : conversation.id.split('-').filter(Boolean);
      const normalized: Conversation = {
        ...conversation,
        participantIds,
        lastMessageTimestamp: conversation.lastMessageTimestamp
          ? new Date(conversation.lastMessageTimestamp)
          : new Date(),
      };
      set((state) => {
        // Remove by ID AND by participants to prevent duplicates
        const participantKey = [...normalized.participantIds].sort().join('-');
        const others = state.conversations.filter((c) => {
          const cKey = [...(c.participantIds || [])].sort().join('-');
          return c.id !== normalized.id && cKey !== participantKey;
        });
        const allConversations = [normalized, ...others];
        return {
          conversations: deduplicateConversations(allConversations),
        };
      });
    };

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'conversations' },
      (payload) => {
        const raw = (payload.new ?? payload.old) as Record<string, unknown>;
        const parsed = convertKeysToCamelCase(raw) as unknown as Conversation;
        if (!parsed?.id) return;
        const normalized = normalizeConversation(parsed);

        if (payload.eventType === 'DELETE') {
          set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== normalized.id),
          }));
        } else {
          upsertConversation(normalized);
        }
      }
    );

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        const raw = (payload.new ?? payload.old) as Record<string, unknown>;
        const parsed = convertKeysToCamelCase(raw) as unknown as ChatMessage;
        if (!parsed?.id) return;
        const normalized = normalizeMessage(parsed);
        const currentUserId = useStore.getState().currentUser?.id;

        set((state) => {
          const messages = { ...state.messages };
          if (payload.eventType === 'DELETE') {
            delete messages[normalized.id];
            return { messages };
          }

          messages[normalized.id] = normalized;

          const baseConversations = state.conversations;
          const participantIds =
            normalized.conversationId.split('-').filter(Boolean);
          const conversation: Conversation =
            baseConversations.find((c) => c.id === normalized.conversationId) ?? {
              id: normalized.conversationId,
              participantIds,
              lastMessageTimestamp: normalized.timestamp,
              unreadCount: 0,
            };

          const updatedConversation = {
            ...conversation,
            participantIds: conversation.participantIds && conversation.participantIds.length > 0 ? conversation.participantIds : participantIds,
            lastMessageTimestamp: normalized.timestamp,
            unreadCount:
              normalized.senderId !== currentUserId && payload.eventType === 'INSERT'
                ? (conversation.unreadCount ?? 0) + 1
                : conversation.unreadCount ?? 0,
          };

          // Use deduplication to prevent duplicate conversations
          const allConversations = [
            updatedConversation,
            ...baseConversations.filter((c) => c.id !== conversation.id),
          ];

          return {
            messages,
            conversations: deduplicateConversations(allConversations),
          };
        });
      }
    );

    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const onlineUserIds = Object.keys(presenceState);
      set({ onlineUserIds });
    });

    void channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({ user_id: currentUser?.id ?? 'anonymous' });
      }
    });

    return () => {
      void channel.unsubscribe();
    };
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
