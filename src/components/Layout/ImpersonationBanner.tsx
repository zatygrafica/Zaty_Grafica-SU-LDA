import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import Button from '../Common/Button';
import { LogIn } from 'lucide-react';

const ImpersonationBanner: React.FC = () => {
  const { t } = useTranslation();
  const { impersonatingUser, stopImpersonation } = useStore();

  if (!impersonatingUser) {
    return null;
  }

  return (
    <div className="bg-yellow-400 dark:bg-yellow-600 text-gray-900 dark:text-white p-2 text-center text-sm flex items-center justify-center gap-4">
      <span>
        {t('users.impersonating_banner', { name: impersonatingUser.name })}
      </span>
      <Button
        variant="secondary"
        size="sm"
        onClick={stopImpersonation}
        icon={LogIn}
      >
        {t('users.return_to_admin')}
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
