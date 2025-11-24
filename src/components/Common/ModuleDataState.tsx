import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import ModuleLoadingSkeleton from './ModuleLoadingSkeleton';
import Button from './Button';

interface ModuleDataStateProps {
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
  className?: string;
  skeleton?: React.ReactNode;
}

const ModuleDataState: React.FC<ModuleDataStateProps> = ({
  loading,
  hasLoaded,
  error,
  onRetry,
  children,
  className,
  skeleton,
}) => {
  if (error) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-8 text-center space-y-3',
          className
        )}
      >
        <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">Falha ao carregar dados</p>
          <p className="text-sm text-red-600/80 dark:text-red-200/80 break-words">{error}</p>
        </div>
        {onRetry && (
          <Button variant="primary" onClick={onRetry} disabled={loading}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  if (!hasLoaded) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-neutral-950/40 p-4',
          className,
        )}
      >
        {skeleton ?? <ModuleLoadingSkeleton />}
      </div>
    );
  }

  return <>{children}</>;
};

export default ModuleDataState;
