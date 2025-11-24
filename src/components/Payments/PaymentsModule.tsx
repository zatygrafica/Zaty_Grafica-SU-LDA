import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { Payment } from '../../types';
import { Edit, CreditCard, Plus } from 'lucide-react';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Textarea from '../Common/Textarea';
import Combobox from '../Common/Combobox';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import Modal from '../Common/Modal';
import ModuleDataState from '../Common/ModuleDataState';
import { CardGridSkeleton, TableSkeleton } from '../Common/SkeletonLoaders';
import { useLoadPaymentsOnMount } from '../../hooks/useModuleLoaders';

// Validation Schema
const schema = yup.object().shape({
  orderId: yup.string().required('O pedido é obrigatório'),
  amount: yup.number().positive('O valor deve ser positivo').required('O valor é obrigatório'),
  method: yup.string().oneOf(['cash', 'transfer', 'mobile_money']).required('O método é obrigatório'),
  date: yup.date().required('A data é obrigatória'),
  notes: yup.string().optional().nullable(),
});

const PaymentsModule: React.FC = () => {
  const { t } = useTranslation();
  const { payments, addPayment, updatePayment, settings } = useStore();
  const { orders } = useOrderStore();
  const {
    loading: paymentsLoading,
    hasLoaded: paymentsLoaded,
    error: paymentsError,
    reload: reloadPayments,
  } = useLoadPaymentsOnMount();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const isMobile = useMediaQuery('(max-width: 767px)');
  const skeleton = isMobile ? <CardGridSkeleton cards={6} /> : <TableSkeleton rows={6} columns={5} />;

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<Omit<Payment, 'id' | 'createdAt'>>({
    resolver: yupResolver(schema),
    defaultValues: {
      orderId: '',
      amount: 0,
      method: 'transfer',
      date: new Date(),
      notes: '',
    },
  });

  const handleOpenModal = (payment: Payment | null) => {
    setSelectedPayment(payment);
    if (payment) {
      reset({
        orderId: payment.orderId || '',
        amount: payment.amount,
        method: payment.method,
        date: new Date(payment.date),
        notes: payment.notes || '',
      });
    } else {
      reset({
        orderId: '',
        amount: 0,
        method: 'transfer',
        date: new Date(),
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
    reset();
  };

  const onSubmit = async (data: Omit<Payment, 'id' | 'createdAt'>) => {
    if (selectedPayment) {
      updatePayment(selectedPayment.id, { notes: data.notes });
      handleCloseModal();
    } else {
      const { invoices } = useInvoiceStore.getState();
      const result = await addPayment({
        orderId: data.orderId,
        invoiceId: invoices.find(inv => inv.orderId === data.orderId)?.id,
        amount: data.amount,
        method: data.method,
        date: data.date,
        notes: data.notes,
      });
      
      if (result.success) {
        handleCloseModal();
      }
    }
  };

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => filterMethod ? p.method === filterMethod : true)
      .filter(p => filterDate ? new Date(p.date).toISOString().split('T')[0] === filterDate : true)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, filterDate, filterMethod]);
  
  const methodOptions = [
    { value: 'cash', label: t('payments.methods.cash') },
    { value: 'transfer', label: t('payments.methods.transfer') },
    { value: 'mobile_money', label: t('payments.methods.mobile_money') },
  ];
  
  const orderOptions = orders.map(o => ({ value: o.id, label: `${o.orderNumber} - ${o.clientName} (${o.total.toFixed(2)} MZN)`}));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('payments.title')}
        </h1>
        <Button onClick={() => handleOpenModal(null)} icon={Plus}>
          {!isMobile && t('payments.new_payment')}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4 flex flex-col md:flex-row gap-4">
        <Input
          label={t('payments.filter_by_date')}
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-full md:w-auto"
        />
        <Combobox
          label={t('payments.filter_by_method')}
          options={[{ value: '', label: t('payments.all_methods') }, ...methodOptions]}
          value={filterMethod}
          onChange={(value) => setFilterMethod(value || '')}
          className="w-full md:w-56"
        />
      </div>

      <ModuleDataState
        loading={paymentsLoading}
        hasLoaded={paymentsLoaded}
        error={paymentsError}
        onRetry={reloadPayments}
        skeleton={skeleton}
      >
        {filteredPayments.length === 0 ? (
          <div className="text-center py-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
              <CreditCard className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('payments.no_payments')}</h3>
          </div>
        ) : isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{Number(payment.amount).toFixed(2)} {settings.currency}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                      payment.method === 'transfer' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                    }`}>
                      {t(`payments.methods.${payment.method}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('payments.order_id')}: {orders.find(o => o.id === payment.orderId)?.orderNumber || 'N/A'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(payment.date).toLocaleDateString()}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => handleOpenModal(payment)} icon={Edit} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('payments.date')}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('payments.order_id')}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('payments.amount')}</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('payments.method')}</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-500/10">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{orders.find(o => o.id === payment.orderId)?.orderNumber || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{Number(payment.amount).toFixed(2)} {settings.currency}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.method === 'cash' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                          payment.method === 'transfer' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                        }`}>
                          {t(`payments.methods.${payment.method}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenModal(payment)} icon={Edit} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModuleDataState>

      {/* Edit/Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedPayment ? t('payments.edit_payment') : t('payments.new_payment')}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="orderId"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('payments.order_id')}
                options={orderOptions}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  const order = orders.find(o => o.id === value);
                  if (order) {
                    setValue('amount', order.total);
                  }
                }}
                error={errors.orderId?.message}
                disabled={!!selectedPayment}
              />
            )}
          />
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label={t('payments.amount')}
                type="number"
                placeholder="0.00"
                error={errors.amount?.message}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                disabled={!!selectedPayment}
              />
            )}
          />
          <Controller
            name="method"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('payments.method')}
                options={methodOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.method && t(errors.method.message as string)}
                disabled={!!selectedPayment}
              />
            )}
          />
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <Input
                label={t('payments.date')}
                type="date"
                value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                error={errors.date?.message}
                disabled={!!selectedPayment}
              />
            )}
          />
          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label={t('payments.notes')}
                placeholder="Adicione uma nota opcional..."
                error={errors.notes?.message}
              />
            )}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentsModule;
