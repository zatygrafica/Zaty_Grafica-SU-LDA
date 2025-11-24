import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff } from 'lucide-react';

const OnlineStatusIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const statusInfo = isOnline
    ? { Icon: Wifi, color: 'text-green-500', text: t('common.online') }
    : { Icon: WifiOff, color: 'text-red-500', text: t('common.offline') };

  const { Icon, color, text } = statusInfo;

  return (
    <div className="flex items-center gap-2" title={text}>
      <Icon className={`${color} w-5 h-5`} />
      <span className="hidden sm:inline text-sm text-gray-500 dark:text-gray-400">{text}</span>
    </div>
  );
};

export default OnlineStatusIndicator;
