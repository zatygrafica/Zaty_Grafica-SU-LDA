import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '@/store/useOrderStore';
import { Wrench, Award } from 'lucide-react';

const TopServicesCard: React.FC = () => {
  const { t } = useTranslation();
  const { orders } = useOrderStore();

  const topServices = useMemo(() => {
    const serviceCounts = new Map<string, number>();

    orders.forEach(order => {
      order.items.forEach(item => {
        serviceCounts.set(item.serviceName, (serviceCounts.get(item.serviceName) || 0) + 1);
      });
    });

    return Array.from(serviceCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  return (
    <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('dashboard.top_services')}
      </h3>
      {topServices.length > 0 ? (
        <ul className="space-y-3">
          {topServices.map((service, index) => (
            <li key={service.name} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-gray-500/10 transition-colors">
              <div className="flex items-center">
                {index === 0 ? (
                  <Award className="w-5 h-5 mr-3 text-yellow-500" />
                ) : (
                  <Wrench className="w-5 h-5 mr-3 text-gray-400" />
                )}
                <span className="font-medium text-gray-800 dark:text-gray-200">{service.name}</span>
              </div>
              <span className="font-semibold text-gray-600 dark:text-gray-300">
                {t('dashboard.orders_count', { count: service.count })}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          <p>{t('dashboard.no_recent_activity')}</p>
        </div>
      )}
    </div>
  );
};

export default TopServicesCard;
