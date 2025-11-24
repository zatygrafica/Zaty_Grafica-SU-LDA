import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Client } from '../../types';
import { useOrderStore } from '../../store/useOrderStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useStore } from '../../store/useStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { User, Phone, Mail, FileText, ShoppingCart, Calendar, Building2, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';

// Helper to group by key
const groupBy = <T, K extends PropertyKey>(list: T[], getKey: (item: T) => K) =>
  list.reduce((previous, currentItem) => {
    const group = getKey(currentItem);
    if (!previous[group]) previous[group] = [];
    previous[group].push(currentItem);
    return previous;
  }, {} as Record<K, T[]>);


interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
}

type TabId = 'details' | 'orders' | 'invoices';
type TabConfig = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
};

const tabs: TabConfig[] = [
  { id: 'details', label: 'common.details', icon: User },
  { id: 'orders', label: 'navigation.orders', icon: ShoppingCart },
  { id: 'invoices', label: 'navigation.invoices', icon: FileText },
];

const ClientProfileModal: React.FC<ClientProfileModalProps> = ({ isOpen, onClose, client }) => {
  const { t } = useTranslation();
  const { orders } = useOrderStore();
  const { invoices } = useInvoiceStore();
  const { settings } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('details');

  const clientData = useMemo(() => {
    const clientOrders = orders.filter(order => order.clientId === client.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const clientInvoices = invoices.filter(invoice => invoice.order.clientId === client.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const totalSpent = clientOrders.reduce((sum, inv) => sum + inv.total, 0);

    return {
      orders: clientOrders,
      invoices: clientInvoices,
      totalOrders: clientOrders.length,
      totalSpent,
    };
  }, [client, orders, invoices]);

  const resolvedTabs = tabs.map(tab => ({
    ...tab,
    label: t(tab.label),
  }));
  const renderDetails = () => (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-neutral-800/50">
        <span className="font-medium text-gray-600 dark:text-gray-400">{t('clients.client_type')}:</span>
        <span className="text-gray-800 dark:text-gray-200">{t(`clients.${client.clientType}`)}</span>
      </div>
      {client.clientType === 'company' && client.legalRepresentative && (
        <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-neutral-800/50">
          <span className="font-medium text-gray-600 dark:text-gray-400">{t('clients.legal_representative')}:</span>
          <span className="text-gray-800 dark:text-gray-200">{client.legalRepresentative}</span>
        </div>
      )}
      <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-neutral-800/50">
        <span className="font-medium text-gray-600 dark:text-gray-400">{t('common.nuit')}:</span>
        <span className="text-gray-800 dark:text-gray-200">{client.nuit || 'N/A'}</span>
      </div>
      <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-neutral-800/50">
        <span className="font-medium text-gray-600 dark:text-gray-400">{t('common.address')}:</span>
        <span className="text-gray-800 dark:text-gray-200 text-right">{client.address || 'N/A'}</span>
      </div>
    </div>
  );

  const renderOrders = () => {
    const ordersByDate = groupBy(clientData.orders, o => format(new Date(o.createdAt), 'yyyy-MM-dd'));
    const sortedDates = Object.keys(ordersByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
      <div className="max-h-[30rem] overflow-y-auto space-y-4">
        {sortedDates.length > 0 ? sortedDates.map(date => {
          const dailyOrders = ordersByDate[date];
          const dailyTotal = dailyOrders.reduce((sum, order) => sum + order.total, 0);

          return (
            <div key={date} className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/50">
              <div className="flex justify-between items-center mb-3 pb-2 border-b dark:border-neutral-700">
                <h4 className="font-semibold text-gray-900 dark:text-white">{format(new Date(date), 'PPP', { locale: pt })}</h4>
                <p className="font-bold text-gray-900 dark:text-white">{t('clients.profile.daily_total')}: {dailyTotal.toFixed(2)} {settings.currency}</p>
              </div>
              <div className="space-y-3">
                {dailyOrders.map(order => (
                  <div key={order.id} className="p-2 rounded bg-white dark:bg-neutral-900">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-1">{order.orderNumber}</p>
                    <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400 pl-2 border-l-2 dark:border-neutral-700">
                      {order.items.map(item => (
                        <li key={item.id}>{item.quantity}x {item.serviceName} {item.variationName ? `(${item.variationName})` : ''} - {item.total.toFixed(2)}</li>
                      ))}
                    </ul>
                    <div className="text-right text-xs mt-2 pt-2 border-t dark:border-neutral-700 space-y-1">
                      <p>Subtotal: {order.subtotal.toFixed(2)}</p>
                      {order.discountAmount > 0 && <p className="text-red-500">Desconto: -{order.discountAmount.toFixed(2)}</p>}
                      {order.vatAmount > 0 && <p>IVA: +{order.vatAmount.toFixed(2)}</p>}
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Total: {order.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }) : (
          <p className="text-center text-gray-500 py-4">{t('orders.no_orders_found')}</p>
        )}
      </div>
    );
  };

  const renderInvoices = () => (
    <div className="max-h-80 overflow-y-auto space-y-2">
      {clientData.invoices.length > 0 ? clientData.invoices.map(invoice => (
        <div key={invoice.id} className="p-3 rounded-lg bg-gray-50 dark:bg-neutral-800/50 flex justify-between items-center">
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(invoice.createdAt), 'dd/MM/yyyy')}</p>
          </div>
          <p className="font-bold text-gray-900 dark:text-white">{invoice.order.total.toFixed(2)} {settings.currency}</p>
        </div>
      )) : (
        <p className="text-center text-gray-500 py-4">{t('invoices.no_invoices_found')}</p>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'details': return renderDetails();
      case 'orders': return renderOrders();
      case 'invoices': return renderInvoices();
      default: return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('clients.profile.title')} size="2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-full">
            {client.clientType === 'company' ? <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" /> : <UserIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{client.name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1.5"><Phone size={14} /> {client.phone}</span>
              <span className="flex items-center gap-1.5"><Mail size={14} /> {client.email || 'N/A'}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {t('clients.registration_date')}: {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: pt })}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">{t('clients.total_orders')}</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{clientData.totalOrders}</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-neutral-950 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">{t('clients.profile.total_spent')}</p>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{clientData.totalSpent.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="border-b border-gray-200 dark:border-neutral-800">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {resolvedTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-neutral-700'
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="pt-6">
            {renderContent()}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onClose} variant="secondary">
          {t('common.close')}
        </Button>
      </div>
    </Modal>
  );
};

export default ClientProfileModal;
