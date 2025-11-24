import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useUserStore } from '../../store/useUserStore';
import { format } from 'date-fns';
import { BookUser } from 'lucide-react';

const AuditLogViewer: React.FC = () => {
  const { t } = useTranslation();
  const { auditLogs } = useStore();
  const { users } = useUserStore();

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Sistema';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('audit.title')}</h3>
      <div className="max-h-[60vh] overflow-y-auto border border-gray-200 dark:border-neutral-800 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
          <thead className="bg-gray-50 dark:bg-neutral-800 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('audit.timestamp')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('audit.user')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('audit.action')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('audit.resource')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
            {auditLogs.length > 0 ? auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{format(new Date(log.timestamp), 'dd/MM/yy HH:mm:ss')}</td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{getUserName(log.userId)}</td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-mono text-xs bg-gray-100 dark:bg-neutral-700 px-2 py-1 rounded">
                    {t(`audit.actions.${log.action}`, { defaultValue: log.action })}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.resourceType}: {log.resourceId}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-10">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800">
                    <BookUser className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('audit.no_logs')}</h3>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogViewer;
