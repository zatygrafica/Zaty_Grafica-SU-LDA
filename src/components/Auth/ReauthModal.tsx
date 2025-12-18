import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface ReauthModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  reason?: 'idle' | 'session_expired';
}

const ReauthModal: React.FC<ReauthModalProps> = ({
  isOpen,
  onSuccess,
  reason = 'idle'
}) => {
  const { user, profile, signIn } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foca no input quando o modal abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Limpa o formulário quando fecha
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Digite sua senha');
      return;
    }

    if (!user?.email) {
      setError('Usuário não identificado');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Tenta fazer login com o email do usuário atual e a senha fornecida
      const result = await signIn(user.email, password);

      if (result.success) {
        // Desbloqueio IMEDIATO: atualiza UI primeiro
        setPassword('');
        setIsLoading(false);

        // Chama onSuccess de forma síncrona e imediata
        onSuccess();
      } else {
        setError(result.error || 'Senha incorreta');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Erro ao validar credenciais');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const messages = {
    idle: {
      title: 'Sessão Bloqueada por Inatividade',
      description: 'Por segurança, sua sessão foi bloqueada após 3 minutos de inatividade.',
      icon: <Lock className="w-16 h-16 text-yellow-500" />
    },
    session_expired: {
      title: 'Sessão Expirada',
      description: 'Sua sessão expirou. Por favor, autentique-se novamente para continuar.',
      icon: <AlertTriangle className="w-16 h-16 text-red-500" />
    }
  };

  const message = messages[reason];

  return (
    <div
      className="fixed z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 text-white">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              {message.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {message.title}
            </h2>
            <p className="text-blue-100 text-sm">
              {message.description}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User info */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Usuário:
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {profile?.full_name || user?.email?.split('@')[0]}
              </p>
            </div>

            {/* Password input */}
            <div>
              <label
                htmlFor="reauth-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Digite sua senha para continuar
              </label>
              <input
                ref={inputRef}
                id="reauth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900 dark:text-white transition-colors"
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Desbloquear
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Seu trabalho foi salvo automaticamente e será restaurado após a autenticação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReauthModal;
