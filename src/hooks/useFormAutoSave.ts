import { useEffect, useCallback, useRef } from 'react';

interface UseFormAutoSaveOptions<T> {
  key: string; // Chave única para identificar o formulário no localStorage
  data: T; // Dados do formulário
  enabled?: boolean; // Se o auto-save está ativo
  debounceMs?: number; // Tempo de debounce antes de salvar (default: 500ms)
}

/**
 * Hook para auto-salvar dados de formulários no localStorage
 * Útil para preservar o estado durante bloqueio por inatividade
 */
export function useFormAutoSave<T>({
  key,
  data,
  enabled = true,
  debounceMs = 500
}: UseFormAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `form_autosave_${key}`;

  // Salva os dados no localStorage
  const save = useCallback(() => {
    if (!enabled) return;

    try {
      const serialized = JSON.stringify({
        data,
        timestamp: Date.now()
      });
      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.error('Erro ao salvar formulário:', error);
    }
  }, [data, enabled, storageKey]);

  // Salva com debounce para evitar muitas escritas
  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);
  }, [save, debounceMs]);

  // Restaura dados salvos
  const restore = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return null;

      const parsed = JSON.parse(saved);

      // Ignora dados muito antigos (mais de 1 hora)
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > oneHour) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed.data as T;
    } catch (error) {
      console.error('Erro ao restaurar formulário:', error);
      return null;
    }
  }, [storageKey]);

  // Limpa os dados salvos
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Erro ao limpar formulário:', error);
    }
  }, [storageKey]);

  // Auto-salva quando os dados mudam
  useEffect(() => {
    if (enabled && data) {
      debouncedSave();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  return {
    restore,
    clear,
    save: debouncedSave
  };
}

/**
 * Salva imediatamente todos os formulários abertos
 * Útil antes de bloquear por inatividade
 */
export function saveAllForms() {
  // Dispara evento customizado que será capturado pelos formulários
  window.dispatchEvent(new CustomEvent('saveAllForms'));
}

/**
 * Limpa todos os formulários salvos automaticamente
 * Útil após logout
 */
export function clearAllSavedForms() {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('form_autosave_')) {
      localStorage.removeItem(key);
    }
  });
}
