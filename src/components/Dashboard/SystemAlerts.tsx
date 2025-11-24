import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMaterialStore } from '@/store/useMaterialStore';
import { useOrderStore } from '@/store/useOrderStore';
import { AlertTriangle, CheckCircle, Clock, ChevronRight } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface SystemAlertsProps {
  onNavigate: (module: string) => void;
}

const SystemAlerts: React.FC<SystemAlertsProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { materials } = useMaterialStore();
  const { orders } = useOrderStore();

  const alerts = useMemo(() => {
    const lowStockCount = materials.filter(m => m.currentStock < 10).length;
    
    const stalePendingOrdersCount = orders.filter(o => 
      o.status === 'pending' && differenceInDays(new Date(), new Date(o.createdAt)) > 3
    ).length;

    const allAlerts = [];

    if (lowStockCount > 0) {
      allAlerts.push({
        id: 'low_stock',
        icon: AlertTriangle,
        message: t('dashboard.alerts.low_stock', { count: lowStockCount }),
        module: 'materials',
        color: 'text-yellow-600 dark:text-yellow-400',
      });
    }

    if (stalePendingOrdersCount > 0) {
      allAlerts.push({
        id: 'stale_orders',
        icon: Clock,
        message: t('dashboard.alerts.stale_orders', { count: stalePendingOrdersCount }),
        module: 'orders',
        color: 'text-blue-600 dark:text-blue-400',
      });
    }
    
    return allAlerts;
  }, [materials, orders, t]);

  return (
    <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('dashboard.alerts.title')}
      </h3>
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map(alert => {
            const Icon = alert.icon;
            return (
              <button 
                key={alert.id} 
                onClick={() => onNavigate(alert.module)}
                className="w-full flex items-center justify-between p-3 bg-gray-50/50 dark:bg-neutral-800/50 rounded-lg hover:bg-gray-100/70 dark:hover:bg-neutral-800/80 transition-colors text-left"
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${alert.color}`} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{alert.message}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-green-600 dark:text-green-400 py-4">
          <CheckCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">{t('dashboard.alerts.no_alerts_title')}</p>
          <p className="text-sm">{t('dashboard.alerts.no_alerts_message')}</p>
        </div>
      )}
    </div>
  );
};

export default SystemAlerts;
