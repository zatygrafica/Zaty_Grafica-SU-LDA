import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotesStore } from '../../store/useNotesStore';
import { useStore } from '../../store/useStore';
import { Note } from '../../types';
import { useDebounce } from '../../hooks/useDebounce';
import { Plus, Search, Star, Trash2, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { clsx } from 'clsx';
import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';

// Main Component
const QuickNotesModule: React.FC = () => {
  const { t } = useTranslation();
  const { notes, addNote, updateNote, deleteNote, toggleFavorite, listNotes, subscribeToRealtime } = useNotesStore();
  const addNotification = useStore((state) => state.addNotification);
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes.length > 0 ? notes[0].id : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    if (!searchTerm) return sorted;

    return sorted.filter(
      (note) =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notes, searchTerm]);

  useEffect(() => {
    void listNotes(true);
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [listNotes, subscribeToRealtime]);

  useEffect(() => {
    if (!selectedNoteId && filteredNotes.length > 0) {
      setSelectedNoteId(filteredNotes[0].id);
    }
    if (selectedNoteId && !filteredNotes.some(n => n.id === selectedNoteId)) {
      setSelectedNoteId(filteredNotes.length > 0 ? filteredNotes[0].id : null);
    }
  }, [filteredNotes, selectedNoteId]);

  const handleAddNote = async () => {
    try {
      const newNote = await addNote();
      setSelectedNoteId(newNote.id);
    } catch (error) {
      addNotification({
        id: crypto.randomUUID(),
        type: 'error',
        message: (error as Error).message ?? t('errors.loading_message'),
        createdAt: new Date(),
      });
    }
  };

  const handleDeleteRequest = (id: string) => {
    setNoteToDelete(id);
  };

  const confirmDelete = async () => {
    if (noteToDelete) {
      const indexToDelete = filteredNotes.findIndex(n => n.id === noteToDelete);
      await deleteNote(noteToDelete);
      if (selectedNoteId === noteToDelete) {
        const newSelectedId = filteredNotes[indexToDelete - 1]?.id || filteredNotes[indexToDelete + 1]?.id || null;
        setSelectedNoteId(newSelectedId);
      }
      setNoteToDelete(null);
    }
  };

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const focusableItems = Array.from(listEl.querySelectorAll<HTMLElement>('[data-note-id]'));
        if (focusableItems.length === 0) return;
        
        const currentFocusIndex = focusableItems.findIndex(item => item === document.activeElement);
        
        let nextIndex = 0;
        if (currentFocusIndex !== -1) {
          nextIndex = e.key === 'ArrowDown' 
            ? Math.min(currentFocusIndex + 1, focusableItems.length - 1)
            : Math.max(currentFocusIndex - 1, 0);
        }
        focusableItems[nextIndex]?.focus();
      }
    };

    listEl.addEventListener('keydown', handleKeyDown);
    return () => listEl.removeEventListener('keydown', handleKeyDown);
  }, [filteredNotes]);

  const selectedNote = useMemo(() => notes.find(n => n.id === selectedNoteId), [notes, selectedNoteId]);

  return (
    <div className="flex flex-1 min-h-0">
      {/* Sidebar */}
      <div className="w-1/3 min-w-[280px] max-w-[400px] flex flex-col bg-white dark:bg-neutral-900/50 border-r border-gray-200 dark:border-neutral-800">
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
          <Input
            icon={Search}
            placeholder={t('notes.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={() => { void handleAddNote(); }} icon={Plus} title={t('notes.new_note')} />
        </div>
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {filteredNotes.map(note => (
            <NoteListItem
              key={note.id}
              note={note}
              isSelected={note.id === selectedNoteId}
              onSelect={() => setSelectedNoteId(note.id)}
              onToggleFavorite={() => { void toggleFavorite(note.id); }}
              onDelete={() => handleDeleteRequest(note.id)}
            />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 bg-gray-50 dark:bg-neutral-950">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={updateNote}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <FileText className="w-16 h-16 mb-4" />
            <h3 className="text-lg font-semibold">{t('notes.no_note_selected')}</h3>
            <p>{t('notes.create_or_select_note')}</p>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={confirmDelete}
        title={t('notes.delete_title')}
        message={t('notes.delete_confirm')}
      />
    </div>
  );
};

// NoteListItem Component
const NoteListItem: React.FC<{
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}> = ({ note, isSelected, onSelect, onToggleFavorite, onDelete }) => {
  const { t } = useTranslation();
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true, locale: pt });
  const contentSnippet = note.content.replace(/<[^>]*>/g, '').substring(0, 100);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onDelete();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-note-id={note.id}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={clsx(
        "w-full text-left p-4 border-b border-gray-200 dark:border-neutral-800 cursor-pointer group relative focus:outline-none focus:ring-2 focus:ring-primary-500 focus:z-10",
        isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-neutral-800/50'
      )}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate pr-12">{note.title}</h4>
        <div className="absolute top-3 right-3 flex items-center">
          <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className="p-1 rounded-full hover:bg-yellow-400/20" title={t('notes.favorite')}>
            <Star className={clsx("w-4 h-4", note.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400')} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded-full hover:bg-red-500/20" title={t('common.delete')}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">{contentSnippet || t('notes.empty_note')}</p>
      <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block">{timeAgo}</span>
    </div>
  );
};

// NoteEditor Component
const NoteEditor: React.FC<{
  note: Note;
  onUpdate: (id: string, title: string, content: string) => Promise<unknown>;
}> = ({ note, onUpdate }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    if (note.title !== debouncedTitle || note.content !== debouncedContent) {
      void onUpdate(note.id, debouncedTitle, debouncedContent);
    }
  }, [debouncedTitle, debouncedContent, note.id, note.title, note.content, onUpdate]);
  
  return (
    <div className="h-full flex flex-col">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4"
        inputClassName="text-2xl font-bold !border-none !shadow-none !ring-0 !p-0 dark:bg-transparent"
      />
      <div className="flex-1 h-full">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck="true"
          placeholder={t('notes.type_here')}
          className="w-full h-full p-2 bg-transparent resize-none focus:outline-none text-gray-800 dark:text-gray-200 leading-relaxed"
        />
      </div>
    </div>
  );
};

export default QuickNotesModule;
