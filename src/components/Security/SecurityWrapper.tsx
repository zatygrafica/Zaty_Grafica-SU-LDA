import React, { useEffect, useCallback, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { sessionManager } from '../../services/sessionManager';
import { saveAllForms } from '../../hooks/useFormAutoSave';
import ReauthModal from '../Auth/ReauthModal';

interface SecurityWrapperProps {
  children: React.ReactNode;
  enabled?: boolean; // Se o sistema de segurança está ativo
  idleTimeout?: number; // Tempo de inatividade em ms (padrão: 3 minutos)
}

/**
 * Wrapper que adiciona segurança ao aplicativo:
 * - Detecção de inatividade
 * - Bloqueio automático após tempo configurado
 * - Gerenciamento de sessão
 * - Reautenticação segura
 */
const SecurityWrapper: React.FC<SecurityWrapperProps> = ({
  children,
  enabled = true,
  idleTimeout = 3 * 60 * 1000, // 3 minutos
}) => {
  const { user, isLocked, lockReason, lockSession, unlockSession } = useAuthStore();
  const [showReauthModal, setShowReauthModal] = useState(false);

  // Handler para quando o usuário ficar inativo
  const handleIdle = useCallback(() => {
    if (!enabled || !user) return;

    console.log('[Security] User is idle, locking session...');

    // Salva todos os formulários abertos antes de bloquear
    saveAllForms();

    // Bloqueia a sessão
    lockSession('idle');
    setShowReauthModal(true);
  }, [enabled, user, lockSession]);

  // Handler para quando a sessão expirar
  const handleSessionExpired = useCallback(() => {
    if (!enabled || !user) return;

    console.log('[Security] Session expired');

    // Salva formulários
    saveAllForms();

    // Bloqueia a sessão
    lockSession('session_expired');
    setShowReauthModal(true);
  }, [enabled, user, lockSession]);

  // Configurar timer de inatividade
  const resetIdleTimer = useIdleTimer({
    timeout: idleTimeout,
    onIdle: handleIdle,
    enabled: enabled && !!user && !isLocked,
  });

  // Configurar gerenciador de sessão
  useEffect(() => {
    if (!enabled || !user) {
      sessionManager.stop();
      return;
    }

    // Inicia o monitoramento da sessão
    sessionManager.start(handleSessionExpired);

    return () => {
      sessionManager.stop();
    };
  }, [enabled, user, handleSessionExpired]);

  // Handler para reautenticação bem-sucedida
  const handleReauthSuccess = useCallback(() => {
    console.log('[Security] Reauth successful, unlocking session');

    // Desbloqueia a sessão
    unlockSession();
    setShowReauthModal(false);

    // Reinicia o timer de inatividade
    resetIdleTimer();

    // Reinicia o gerenciador de sessão
    sessionManager.restart();
  }, [unlockSession, resetIdleTimer]);

  // Sincroniza estado de bloqueio com modal
  useEffect(() => {
    if (isLocked && !showReauthModal) {
      setShowReauthModal(true);
    } else if (!isLocked && showReauthModal) {
      setShowReauthModal(false);
    }
  }, [isLocked, showReauthModal]);

  return (
    <>
      {children}

      {/* Modal de reautenticação */}
      {showReauthModal && (
        <ReauthModal
          isOpen={showReauthModal}
          onSuccess={handleReauthSuccess}
          reason={lockReason || 'idle'}
        />
      )}
    </>
  );
};

export default SecurityWrapper;
