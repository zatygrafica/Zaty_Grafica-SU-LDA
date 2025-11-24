import { useEffect } from 'react';

type ShortcutMap = { [key: string]: () => void };

export const useKeyboardShortcuts = (shortcutMap: ShortcutMap) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use Alt as the modifier key. Could also be Ctrl or Meta.
      if (!event.altKey || event.ctrlKey || event.metaKey) return;

      const key = event.key.toLowerCase();
      
      // Check if the event target is an input, textarea, or select
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      const callback = shortcutMap[key];

      if (callback) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcutMap]);
};
