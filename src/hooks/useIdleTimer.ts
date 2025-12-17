import { useEffect, useRef, useCallback } from 'react';

interface UseIdleTimerOptions {
  timeout: number; // Tempo em milissegundos
  onIdle: () => void; // Callback quando ficar inativo
  enabled?: boolean; // Se o timer está ativo
  events?: string[]; // Eventos que resetam o timer
}

/**
 * Hook para detectar inatividade do usuário
 * @param options - Configurações do timer
 * @returns Função para resetar manualmente o timer
 */
export function useIdleTimer({
  timeout,
  onIdle,
  enabled = true,
  events = [
    'mousedown',
    'mousemove',
    'keydown',
    'scroll',
    'touchstart',
    'click',
    'wheel'
  ]
}: UseIdleTimerOptions) {
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const isIdle = useRef(false);

  // Limpa o timer atual
  const clearTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  // Inicia o timer de inatividade
  const startTimer = useCallback(() => {
    clearTimer();

    timeoutId.current = setTimeout(() => {
      if (!isIdle.current && enabled) {
        isIdle.current = true;
        onIdle();
      }
    }, timeout);
  }, [timeout, onIdle, enabled, clearTimer]);

  // Reseta o timer (chamado em cada atividade do usuário)
  const resetTimer = useCallback(() => {
    if (enabled) {
      isIdle.current = false;
      startTimer();
    }
  }, [enabled, startTimer]);

  useEffect(() => {
    if (!enabled) {
      clearTimer();
      isIdle.current = false;
      return;
    }

    // Inicia o timer pela primeira vez
    startTimer();

    // Adiciona listeners para todos os eventos
    const handleActivity = () => {
      if (isIdle.current) {
        // Se estava inativo, não reseta (usuário precisa se reautenticar)
        return;
      }
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      clearTimer();
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, events, startTimer, resetTimer, clearTimer]);

  // Retorna função para resetar manualmente (útil após reautenticação)
  return resetTimer;
}
