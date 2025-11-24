import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../../store/useOrderStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { AlertTriangle } from 'lucide-react';

interface PendingServicesPopupProps {
  onClose: () => void;
  onDisable: () => void;
}

const PendingServicesPopup: React.FC<PendingServicesPopupProps> = ({ onClose, onDisable }) => {
  const { t } = useTranslation();
  const { orders } = useOrderStore();

  const pendingOrders = orders.filter(o => ['pending', 'in_production', 'in_design'].includes(o.status));

  return (
    <Modal isOpen={true} onClose={onClose} title={t('notifications.popup_title')} size="lg">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('notifications.popup_message')}
        </p>
        <div className="max-h-48 overflow-y-auto space-y-2 text-left bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          {pendingOrders.slice(0, 5).map(order => (
            <div key={order.id} className="flex justify-between items-center text-sm">
              <span className="font-medium text-gray-900 dark:text-gray-100">{order.orderNumber} - {order.clientName}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                {
                  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                  in_production: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                  in_design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                }[order.status] || ''
              }`}>
                {t(`orders.status.${order.status}`)}
              </span>
            </div>
          ))}
          {pendingOrders.length > 5 && <p className="text-xs text-center text-gray-500 dark:text-gray-400">e mais {pendingOrders.length - 5}...</p>}
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="ghost" onClick={onDisable} className="text-sm">
          {t('notifications.disable_popup')}
        </Button>
        <Button variant="primary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
};

export default PendingServicesPopup;
