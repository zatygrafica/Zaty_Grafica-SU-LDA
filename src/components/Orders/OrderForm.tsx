import React, { useCallback, useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { Order, OrderItem } from '../../types';
import { useStore } from '../../store/useStore';
import { useClientStore } from '../../store/useClientStore';
import { useServiceStore } from '../../store/useServiceStore';
import { useOrderStore } from '../../store/useOrderStore';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import Textarea from '../Common/Textarea';
import CurrencyInput from '../Common/CurrencyInput';
import { generateId, generateNumericCode } from '../../utils/id';

const getInitialItem = (): OrderItem => ({
  id: generateId(),
  serviceId: '',
  serviceName: '',
  variationId: '',
  variationName: '',
  description: '',
  quantity: 0,
  unit: '',
  unitPrice: 0,
  total: 0,
  length: 0,
  width: 0,
});

interface OrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

type OrderItemFormValues = Omit<OrderItem, 'total'> & { total: number };

interface OrderFormValues {
  clientId: string;
  status: Order['status'];
  vatEnabled: boolean;
  discountType: Order['discountType'];
  discountValue: number;
  notes?: string;
  items: OrderItemFormValues[];
}

const OrderForm: React.FC<OrderFormProps> = ({ isOpen, onClose, order }) => {
  const { t } = useTranslation();
  const { settings, pendingOrderForClient, setPendingOrderForClient } = useStore();
  const { clients } = useClientStore();
  const { services } = useServiceStore();
  const { addOrder, updateOrder } = useOrderStore();

  const validationSchema = yup.object().shape({
    clientId: yup.string().required('orders.form.client_required'),
    status: yup.string().required('orders.form.status_required'),
    vatEnabled: yup.boolean(),
    discountType: yup.string().oneOf(['none', 'fixed', 'percentage']),
    discountValue: yup.number().min(0, 'O desconto deve ser positivo.'),
    notes: yup.string().optional().nullable(),
    items: yup
      .array()
      .of(
        yup.object().shape({
          serviceId: yup.string().required('orders.form.item_service_required'),
          variationId: yup.string().optional(),
          description: yup.string().optional(),
          quantity: yup.number().required('orders.form.item_quantity_required').min(0.01),
          unitPrice: yup.number().required('orders.form.item_unitPrice_required').min(0),
          width: yup.number().optional().nullable(),
          length: yup.number().optional().nullable(),
        })
      )
      .min(1, 'Adicione pelo menos um item.'),
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<OrderFormValues>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      clientId: order?.clientId ?? '',
      status: order?.status ?? 'pending',
      vatEnabled: order?.vatEnabled ?? false,
      discountType: order?.discountType ?? 'none',
      discountValue: order?.discountValue ?? 0,
      notes: order?.notes ?? '',
      items: order
        ? order.items.map((item) => ({
            id: item.id,
            serviceId: item.serviceId ?? '',
            serviceName: item.serviceName ?? '',
            variationId: item.variationId ?? '',
            variationName: item.variationName ?? '',
            description: item.description ?? '',
            width: item.width ?? 0,
            length: item.length ?? 0,
            quantity: item.quantity ?? 0,
            unit: item.unit ?? '',
            unitPrice: item.unitPrice ?? 0,
            total: item.total ?? 0,
          }))
        : [getInitialItem()],
    },
  });

  useEffect(() => {
    if (isOpen && pendingOrderForClient) {
      setValue('clientId', pendingOrderForClient);
      setPendingOrderForClient(null);
    }
  }, [isOpen, pendingOrderForClient, setValue, setPendingOrderForClient]);

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const watchVatEnabled = watch('vatEnabled');
  const watchDiscountType = watch('discountType');
  const watchDiscountValue = watch('discountValue');

  const calculateTotals = useCallback(() => {
    const newItems = watchItems.map((item) => {
      const service = services.find((s) => s.id === item.serviceId);
      const quantity = parseFloat(String(item.quantity)) || 0;
      const unitPrice = parseFloat(String(item.unitPrice)) || 0;

      let total = 0;
      if (service?.unit === 'meter') {
        const length = parseFloat(String(item.length)) || 0;
        const width = parseFloat(String(item.width)) || 0;
        const effectiveQty = quantity || 1;
        total = length * width * unitPrice * effectiveQty;
      } else {
        total = unitPrice * quantity;
      }

      return {
        ...item,
        quantity,
        unitPrice,
        total,
      };
    });

    const subtotal = newItems.reduce((acc, item) => acc + item.total, 0);

    let discountAmount = 0;
    if (watchDiscountType === 'fixed') {
      discountAmount = watchDiscountValue || 0;
    } else if (watchDiscountType === 'percentage') {
      discountAmount = subtotal * ((watchDiscountValue || 0) / 100);
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const vatRate = settings.vatRate / 100;
    const vatAmount = watchVatEnabled ? subtotalAfterDiscount * vatRate : 0;
    const total = subtotalAfterDiscount + vatAmount;

    return { subtotal, discountAmount, vatAmount, total, itemsWithTotals: newItems };
  }, [watchItems, watchVatEnabled, watchDiscountType, watchDiscountValue, settings.vatRate, services]);

  const { subtotal, discountAmount, vatAmount, total, itemsWithTotals } = calculateTotals();

  const handleServiceChange = (index: number, serviceId: string) => {
    const selectedService = services.find((s) => s.id === serviceId);
    if (selectedService) {
      setValue(`items.${index}.serviceName`, selectedService.name);
      setValue(`items.${index}.unit`, selectedService.unit);
      const basePrice = selectedService.basePrice ?? 0;
      setValue(`items.${index}.unitPrice`, basePrice);
      setValue(`items.${index}.variationId`, '');
      setValue(`items.${index}.variationName`, '');

      if (selectedService.unit === 'meter') {
        const defaultLength = selectedService.defaultLength ?? 1;
        const defaultWidth = selectedService.defaultWidth ?? 1;
        setValue(`items.${index}.length`, defaultLength);
        setValue(`items.${index}.width`, defaultWidth);
        setValue(`items.${index}.quantity`, 1);
      } else {
        setValue(`items.${index}.length`, 0);
        setValue(`items.${index}.width`, 0);
      }
    }
  };

  const handleVariationChange = (index: number, variationId: string) => {
    const serviceId = watch(`items.${index}.serviceId`);
    const service = services.find((s) => s.id === serviceId);
    const variation = service?.variations?.find((v) => v.id === variationId);
    if (variation) {
      setValue(`items.${index}.unitPrice`, variation.price);
      setValue(`items.${index}.variationName`, variation.name);
      setValue(`items.${index}.variationId`, variation.id);
    }
  };

  const onSubmit = (data: OrderFormValues) => {
    const finalData = {
      ...data,
      items: itemsWithTotals,
      subtotal,
      discountType: data.discountType,
      discountValue: data.discountValue || 0,
      discountAmount,
      vatAmount,
      total,
      clientName: clients.find((c) => c.id === data.clientId)?.name || '',
      orderNumber: order?.orderNumber || `ORD-${generateNumericCode(5)}`,
      invoiceGenerated: order?.invoiceGenerated || false,
    };

    if (order) {
      updateOrder(order.id, finalData);
    } else {
      addOrder(finalData);
    }
    onClose();
  };

  const statusOptions = ['pending', 'in_production', 'in_design', 'completed'];
  const discountTypeOptions = [
    { value: 'none', label: t('orders.form.discount_none') },
    { value: 'fixed', label: t('orders.form.discount_fixed') },
    { value: 'percentage', label: t('orders.form.discount_percentage') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={order ? t('orders.edit_order') : t('orders.new_order')} size="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="clientId"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('orders.client')}
                options={clients.map((c) => ({ value: c.id, label: c.name }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.clientId && t(errors.clientId.message as string)}
                placeholder={`${t('common.select')}...`}
                required
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('common.status')}
                options={statusOptions.map((s) => ({ value: s, label: t(`orders.status.${s}`) }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.status && t(errors.status.message as string)}
                required
              />
            )}
          />
        </div>

        <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-lg text-gray-900 dark:text-white">Itens do Pedido</h3>
          <div className="space-y-3">
            {fields.map((field, index) => {
              const selectedServiceId = watch(`items.${index}.serviceId`);
              const selectedService = services.find((s) => s.id === selectedServiceId);
              const hasVariations = !!selectedService?.variations && selectedService.variations.length > 0;
              const currentItem = itemsWithTotals[index] || {};

              return (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-start bg-gray-50 dark:bg-gray-800/50 p-3 rounded">
                  <Controller
                    name={`items.${index}.serviceId`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <div className="col-span-12 md:col-span-3">
                        <Combobox
                          label={t('orders.service')}
                          options={services.map((s) => ({ value: s.id, label: s.name }))}
                          value={controllerField.value}
                          onChange={(value) => {
                            controllerField.onChange(value);
                            if (value) handleServiceChange(index, value);
                          }}
                          placeholder={`${t('common.select')}...`}
                        />
                      </div>
                    )}
                  />
                <div className="col-span-12 md:col-span-3">
                  {hasVariations ? (
                    <Controller
                      name={`items.${index}.variationId`}
                      control={control}
                        render={({ field: controllerField }) => (
                          <Combobox
                            label="Variacao"
                            options={selectedService!.variations!.map((v) => ({ value: v.id, label: v.name }))}
                            value={controllerField.value}
                            onChange={(value) => {
                              controllerField.onChange(value);
                              if (value) handleVariationChange(index, value);
                            }}
                            placeholder="Selecione..."
                          />
                        )}
                      />
                    ) : (
                      <Input label="Descricao" {...register(`items.${index}.description`)} inputClassName="text-sm p-2" />
                    )}
                  </div>

                  {selectedService?.unit === 'meter' && (
                    <>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          label="Largura (m)"
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.width`)}
                          inputClassName="text-sm p-2"
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Input
                          label="Comprimento (m)"
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.length`)}
                          inputClassName="text-sm p-2"
                        />
                      </div>
                    </>
                  )}

                  {selectedService?.unit !== 'meter' && (
                    <div className="col-span-6 md:col-span-2">
                      <Input label={t('common.quantity')} type="number" {...register(`items.${index}.quantity`)} inputClassName="text-sm p-2" />
                    </div>
                  )}

                  <div className="col-span-6 md:col-span-2">
                    <Controller
                      name={`items.${index}.unitPrice`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <CurrencyInput label={t('orders.unit_price')} value={controllerField.value} onChange={controllerField.onChange} inputClassName="text-sm p-2" />
                      )}
                    />
                  </div>

                  <div className="col-span-6 md:col-span-1 flex flex-col justify-between h-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-xs">{t('orders.line_total')}</label>
                    <span className="font-medium text-sm self-start pt-2 text-gray-900 dark:text-gray-100">{(currentItem.total || 0).toFixed(2)}</span>
                  </div>

                  <div className="col-span-12 md:col-span-1 flex items-end h-full">
                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button type="button" variant="secondary" onClick={() => append(getInitialItem())}>
            {t('orders.add_item')}
          </Button>
          {errors.items && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.items.message || errors.items.root?.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Textarea label={t('common.notes')} {...register('notes')} />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-lg dark:border-gray-700">
              <Controller
                name="discountType"
                control={control}
                render={({ field }) => (
                  <Combobox label={t('orders.form.discount_type')} options={discountTypeOptions} value={field.value} onChange={field.onChange} />
                )}
              />
              {watchDiscountType === 'fixed' && (
                <Controller
                  name="discountValue"
                  control={control}
                  render={({ field }) => (
                    <CurrencyInput label={t('orders.form.discount_value')} value={field.value as number | null} onChange={field.onChange} error={errors.discountValue?.message} />
                  )}
                />
              )}
              {watchDiscountType === 'percentage' && (
                <Input label={t('orders.form.discount_value')} type="number" step="0.01" {...register('discountValue')} error={errors.discountValue?.message} />
              )}
            </div>
            <div className="mt-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" {...register('vatEnabled')} className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('invoices.enable_vat')}</span>
              </label>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2 text-right">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('common.subtotal')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {subtotal.toFixed(2)} {settings.currency}
              </span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span className="text-red-600 dark:text-red-400">{t('orders.form.discount')}:</span>
                <span className="font-medium">
                  - {discountAmount.toFixed(2)} {settings.currency}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">
                {t('invoices.vat')} ({settings.vatRate}%):
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {vatAmount.toFixed(2)} {settings.currency}
              </span>
            </div>
            <div className="flex justify-between text-lg border-t border-gray-200 dark:border-gray-700 pt-2">
              <span className="font-bold text-gray-900 dark:text-white">{t('common.total')}:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {total.toFixed(2)} {settings.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary">
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OrderForm;
