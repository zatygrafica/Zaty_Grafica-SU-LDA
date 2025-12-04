import { create } from 'zustand';
import type { Note } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';
import { supabase } from '../services/supabaseClient';
import { convertKeysToCamelCase } from '../utils/case';
import { useStore } from './useStore';

interface NotesState {
  notes: Note[];
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  listNotes: (force?: boolean) => Promise<Note[]>;
  getNoteById: (id: string) => Note | undefined;
  addNote: () => Promise<Note>;
  updateNote: (id: string, title: string, content: string, extra?: Partial<Note>) => Promise<Note | undefined>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  subscribeToRealtime: () => () => void;
}

const normalizeNote = (note: Note): Note => ({
  ...note,
  createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
  updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
});

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  hasLoaded: false,
  error: null,

  listNotes: async (force = false) => {
    if (!force && (get().loading || get().hasLoaded)) {
      return get().notes;
    }
    set({ loading: true, hasLoaded: false, error: null });
    try {
      const notes = await dataProvider.list<Note>('notes');
      const normalized = notes.map(normalizeNote);
      set({ notes: normalized, loading: false, hasLoaded: true });
      return normalized;
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
      throw error;
    }
  },

  getNoteById: (id) => get().notes.find((note) => note.id === id),

  addNote: async () => {
    const { addAuditLog } = useStore.getState();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: 'Nova Anotação',
      content: '',
      isFavorite: false,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      const created = await dataProvider.create<Note>('notes', newNote);
      const normalized = normalizeNote(created);
      set((state) => ({ notes: [normalized, ...state.notes] }));
      addAuditLog({ action: 'create', resourceType: 'Note', resourceId: normalized.id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateNote: async (id, title, content, extra = {}) => {
    const { addAuditLog } = useStore.getState();
    const updatedAt = new Date();
    try {
      const updated = await dataProvider.update<Note>('notes', id, { title, content, updatedAt, ...extra });
      if (!updated) return undefined;
      const normalized = normalizeNote(updated);
      set((state) => ({
        notes: state.notes.map((note) => (note.id === id ? normalized : note)),
      }));
      addAuditLog({ action: 'update', resourceType: 'Note', resourceId: id });
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteNote: async (id) => {
    const { addAuditLog } = useStore.getState();
    try {
      await dataProvider.delete('notes', id);
      set((state) => ({
        notes: state.notes.filter((note) => note.id !== id),
      }));
      addAuditLog({ action: 'delete', resourceType: 'Note', resourceId: id });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const isFavorite = !note.isFavorite;
    try {
      const updated = await dataProvider.update<Note>('notes', id, { isFavorite });
      if (!updated) return;
      const normalized = normalizeNote(updated);
      set((state) => ({
        notes: state.notes.map((n) => (n.id === id ? normalized : n)),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  toggleCompleted: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const completed = !note.completed;
    await get().updateNote(id, note.title, note.content, { completed });
  },

  subscribeToRealtime: () => {
    const channel = supabase.channel('notes-realtime');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes' },
      (payload) => {
        const raw = (payload.new ?? payload.old) as Record<string, unknown>;
        const parsed = convertKeysToCamelCase(raw) as Note;
        if (!parsed?.id) return;
        const normalized = normalizeNote(parsed);

        set((state) => {
          if (payload.eventType === 'DELETE') {
            return { notes: state.notes.filter((n) => n.id !== normalized.id) };
          }
          const exists = state.notes.some((n) => n.id === normalized.id);
          const notes = exists
            ? state.notes.map((n) => (n.id === normalized.id ? normalized : n))
            : [normalized, ...state.notes];
          return { notes, hasLoaded: true };
        });
      }
    );

    void channel.subscribe();
    return () => {
      void channel.unsubscribe();
    };
  },
}));
