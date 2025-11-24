import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import Button from '../Common/Button';

const LoadingErrorScreen: React.FC = () => {
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-neutral-950 text-center p-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20 mb-6">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {t('errors.loading_title')}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        {t('errors.loading_message')}
      </p>
      <Button onClick={handleRetry} variant="primary">
        {t('errors.try_again')}
      </Button>
    </div>
  );
};

export default LoadingErrorScreen;
