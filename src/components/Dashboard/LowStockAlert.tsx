import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMaterialStore } from '@/store/useMaterialStore';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../Common/Button';

interface LowStockAlertProps {
  onNavigate: () => void;
}

const LowStockAlert: React.FC<LowStockAlertProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { materials } = useMaterialStore();

  const lowStockItems = useMemo(() => {
    return materials.filter(m => m.currentStock < 10).slice(0, 5);
  }, [materials]);

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-neutral-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('dashboard.low_stock_alert')}
      </h3>
      {lowStockItems.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <p>{t('dashboard.low_stock_message', { count: lowStockItems.length })}</p>
          </div>
          <ul className="space-y-2 text-sm max-h-40 overflow-y-auto pr-2">
            {lowStockItems.map(item => (
              <li key={item.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-neutral-800/50 rounded">
                <span className="text-gray-800 dark:text-gray-200">{item.name}</span>
                <span className="font-bold text-red-500">{item.currentStock} {t(`materials.units.${item.unit}`)}</span>
              </li>
            ))}
          </ul>
          <Button onClick={onNavigate} variant="secondary" size="sm" className="w-full mt-2">
            {t('dashboard.manage_stock')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center text-green-600 dark:text-green-400 py-4">
          <CheckCircle className="w-10 h-10 mb-2" />
          <p className="font-semibold">{t('dashboard.stock_ok_title')}</p>
          <p className="text-sm">{t('dashboard.stock_ok_message')}</p>
        </div>
      )}
    </div>
  );
};

export default LowStockAlert;
