import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { X, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { notifications, markNotificationAsRead, clearNotifications } = useStore();
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadNotifications = notifications.filter(n => !n.read);
  const displayNotifications = notifications.slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return XCircle;
      case 'warning':
        return AlertCircle;
      default:
        return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  const markAllAsRead = () => {
    unreadNotifications.forEach(notification => {
      markNotificationAsRead(notification.id);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="absolute right-0 top-12 w-80 md:w-96 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('notifications.title')}
          </h3>
          <div className="flex items-center space-x-2">
            {unreadNotifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {t('notifications.mark_all_read')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="max-h-96 overflow-y-auto">
          {displayNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-neutral-800">
              {displayNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                      !notification.read ? 'bg-blue-50 dark:bg-primary-900/20' : ''
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(notification.createdAt).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 10 && (
          <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
            <button
              onClick={() => {
                onClose();
                // Navigate to notifications module
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              {t('notifications.view_more')}
            </button>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-neutral-800">
            <button
              onClick={() => {
                clearNotifications();
                onClose();
              }}
              className="w-full text-center text-sm text-red-600 hover:text-red-700 dark:text-red-400"
            >
              {t('notifications.clear_all')}
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPanel;
