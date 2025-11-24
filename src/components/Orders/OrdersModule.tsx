import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOrderStore } from '../../store/useOrderStore';
import { useStore } from '../../store/useStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { Order, Invoice } from '../../types';
import { Plus, Search, Edit, Trash2, FileText, CheckCircle, ShoppingCart } from 'lucide-react';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import OrderForm from './OrderForm';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ModuleDataState from '../Common/ModuleDataState';
import { useLoadOrdersOnMount } from '../../hooks/useModuleLoaders';
import { generateId, generateNumericCode } from '../../utils/id';
import { TableSkeleton } from '../Common/SkeletonLoaders';

const OrdersModule: React.FC = () => {
  const { t } = useTranslation();
  const { orders, deleteOrder, markOrderAsInvoiced } = useOrderStore();
  const { addInvoice } = useInvoiceStore();
  const { currentUser, settings, addNotification, payments, pendingOrderForClient } = useStore();
  const {
    loading: ordersLoading,
    error: ordersError,
    hasLoaded: ordersLoaded,
    reload: reloadOrders,
  } = useLoadOrdersOnMount();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    if (pendingOrderForClient) {
      handleOpenForm(null);
    }
  }, [pendingOrderForClient]);

  const handleOpenForm = (order: Order | null = null) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedOrder(null);
  };

  const handleDeleteClick = (id: string) => {
    setOrderToDelete(id);
    setIsPasswordPromptOpen(true);
  };

  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrder(orderToDelete);
    }
    setIsConfirmOpen(false);
    setOrderToDelete(null);
  };

  const handleGenerateInvoice = (order: Order) => {
    if (order.invoiceGenerated) {
      addNotification({
        id: generateId(),
        type: 'warning',
        title: t('invoices.invoice_already_exists'),
        message: `${t('invoices.invoice_number')} para ${order.orderNumber} já existe.`,
        read: false,
        createdAt: new Date(),
      });
      return;
    }

    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber: `INV-${generateNumericCode(5)}`,
      orderId: order.id,
      order,
      vatRate: settings.vatRate,
      createdAt: new Date(),
    };

    addInvoice(newInvoice);
    markOrderAsInvoiced(order.id);
    addNotification({
      id: generateId(),
      type: 'success',
      title: t('invoices.invoice_generated_success'),
      message: `Fatura ${newInvoice.invoiceNumber} gerada para o pedido ${order.orderNumber}.`,
      read: false,
      createdAt: new Date(),
    });
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order =>
        (order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
         order.clientName.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter ? order.status === statusFilter : true)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, statusFilter]);
  
  const statusOptions = ['pending', 'in_production', 'in_design', 'completed'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('orders.title')}
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <Input
            placeholder={t('orders.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={() => handleOpenForm()} icon={Plus}>
            {!isMobile && t('orders.new_order')}
          </Button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('orders.status_filter')}
        </label>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="block w-full md:w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        >
          <option value="">{t('orders.all_statuses')}</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{t(`orders.status.${status}`)}</option>
          ))}
        </select>
      </div>

      <ModuleDataState
        loading={ordersLoading}
        hasLoaded={ordersLoaded}
        error={ordersError}
        onRetry={reloadOrders}
        skeleton={<TableSkeleton rows={6} columns={6} />}
      >
        {isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredOrders.length > 0 ? filteredOrders.map((order) => {
              const isPaid = payments.some(p => p.orderId === order.id);
              return (
                <div key={order.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        {
                          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                          in_production: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                          in_design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                          completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                        }[order.status]
                      }`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.clientName}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">{order.total.toFixed(2)} {settings.currency}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleGenerateInvoice(order)}
                      icon={order.invoiceGenerated ? CheckCircle : FileText}
                      title={order.invoiceGenerated ? t('invoices.invoice_generated') : !isPaid ? t('orders.awaiting_payment') : t('invoices.generate_invoice')}
                      disabled={order.invoiceGenerated || !isPaid}
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleOpenForm(order)} icon={Edit} title={t('common.edit')} />
                    {isAdmin && <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(order.id)} icon={Trash2} title={t('common.delete')} />}
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full text-center py-10">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('orders.no_orders_found')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('orders.no_orders_found_description')}</p>
              </div>
            )}
          </div>
        ) : (
        <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
              <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orders.order_number')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orders.client')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.total')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                  const isPaid = payments.some(p => p.orderId === order.id);
                  return (
                  <tr key={order.id} className="hover:bg-gray-500/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{order.clientName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{order.total.toFixed(2)} {settings.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          {
                            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
                            in_production: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
                            in_design: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
                            completed: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
                          }[order.status]
                        }`}>
                        {t(`orders.status.${order.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleGenerateInvoice(order)} 
                          icon={order.invoiceGenerated ? CheckCircle : FileText} 
                          title={order.invoiceGenerated ? t('invoices.invoice_generated') : !isPaid ? t('orders.awaiting_payment') : t('invoices.generate_invoice')} 
                          disabled={order.invoiceGenerated || !isPaid} 
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleOpenForm(order)} icon={Edit} title={t('common.edit')} />
                        {isAdmin && <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(order.id)} icon={Trash2} title={t('common.delete')} />}
                      </div>
                    </td>
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
                        <ShoppingCart className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('orders.no_orders_found')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('orders.no_orders_found_description')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </ModuleDataState>

      {isFormOpen && (
        <OrderForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          order={selectedOrder}
        />
      )}

      {isAdmin && (
        <>
          <PasswordPromptModal
            isOpen={isPasswordPromptOpen}
            onClose={() => setIsPasswordPromptOpen(false)}
            onSuccess={proceedToDelete}
            passwordToMatch={settings.deletionPassword || ''}
            title={t('security.deletion_password_prompt_title')}
            message={t('security.deletion_password_prompt_message')}
          />
          <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={confirmDelete}
            title={t('orders.delete_order')}
            message={t('orders.delete_order_confirm')}
          />
        </>
      )}
    </div>
  );
};

export default OrdersModule;
