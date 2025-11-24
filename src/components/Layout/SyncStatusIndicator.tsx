import React from 'react';
import { useSyncStore } from '../../store/useSyncStore';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const SyncStatusIndicator: React.FC = () => {
  const { status, queue, lastSync } = useSyncStore();

  const getStatusInfo = (): { Icon: React.ElementType; color: string; text: string; spin: boolean } | null => {
    if (queue.length > 0) {
      return { Icon: RefreshCw, color: 'text-blue-500', text: `Sincronizando... (${queue.length} pendente${queue.length > 1 ? 's' : ''})`, spin: true };
    }
    switch (status) {
      case 'syncing':
        return { Icon: RefreshCw, color: 'text-blue-500', text: 'Sincronizando...', spin: true };
      case 'synced':
        return { Icon: CheckCircle, color: 'text-green-500', text: `Sincronizado ${lastSync ? formatDistanceToNow(lastSync, { locale: pt, addSuffix: true }) : ''}`, spin: false };
      case 'error':
        return { Icon: AlertCircle, color: 'text-red-500', text: 'Offline. Verifique a conexão.', spin: false };
      case 'idle':
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  if (!statusInfo) {
    return null;
  }

  const { Icon, color, text, spin } = statusInfo;

  return (
    <div className="flex items-center gap-2" title={text}>
      <Icon className={`${color} w-5 h-5 ${spin ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">{text}</span>
    </div>
  );
};

export default SyncStatusIndicator;
