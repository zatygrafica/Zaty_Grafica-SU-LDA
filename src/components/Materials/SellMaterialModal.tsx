import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { generateId, generateNumericCode } from '../../utils/id';

import { Material, Order } from '../../types';
import { useStore } from '../../store/useStore';
import { useClientStore } from '../../store/useClientStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useMaterialStore } from '../../store/useMaterialStore';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import Switch from '../Common/Switch';

interface SellMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

type SellMaterialFormData = {
  clientId: string;
  quantity: number;
  generateInvoice: boolean;
  vatEnabled: boolean;
};

const SellMaterialModal: React.FC<SellMaterialModalProps> = ({ isOpen, onClose, material }) => {
  const { t } = useTranslation();
  const { settings, currentUser, addNotification } = useStore();
  const { clients } = useClientStore();
  const { addOrder } = useOrderStore();
  const { addInvoice } = useInvoiceStore();
  const { deductStock } = useMaterialStore();

  const [meters, setMeters] = useState(0);
  const [centimeters, setCentimeters] = useState(0);

  const validationSchema = yup.object().shape({
    clientId: yup.string().required(t('orders.form.client_required')),
    quantity: yup.number()
      .typeError(t('materials.form.quantity_type_error'))
      .positive(t('materials.form.quantity_positive'))
      .required(t('materials.form.quantity_required'))
      .max(material.currentStock, t('materials.stock_insufficient', { max: material.currentStock })),
    generateInvoice: yup.boolean(),
    vatEnabled: yup.boolean(),
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SellMaterialFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      clientId: '',
      quantity: 1,
      generateInvoice: true,
      vatEnabled: false,
    },
  });

  const watchQuantity = watch('quantity');
  const watchVatEnabled = watch('vatEnabled');
  const sellingPrice = material.sellingPrice || material.pricePerUnit;

  const subtotal = (watchQuantity || 0) * sellingPrice;
  const vatRate = settings.vatRate / 100;
  const vatAmount = watchVatEnabled ? subtotal * vatRate : 0;
  const total = subtotal + vatAmount;

  useEffect(() => {
    if (material.unit === 'meter') {
      const totalMeters = (meters || 0) + (centimeters || 0) / 100;
      setValue('quantity', totalMeters, { shouldValidate: true });
    }
  }, [meters, centimeters, material.unit, setValue]);

  const onSubmit = (data: SellMaterialFormData) => {
    const client = clients.find(c => c.id === data.clientId);
    if (!client) return;

    // 1. Create an Order for the material sale
    const orderItem = {
      id: generateId(),
      serviceId: material.id, // Using material id as a reference
      serviceName: `${t('materials.direct_sale')}: ${material.name}`,
      quantity: data.quantity,
      unit: material.unit,
      unitPrice: sellingPrice,
      total: data.quantity * sellingPrice,
    };

    const orderSubtotal = orderItem.total;
    const orderVatAmount = data.vatEnabled ? orderSubtotal * (settings.vatRate / 100) : 0;
    const orderTotal = orderSubtotal + orderVatAmount;

    const newOrderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
      orderNumber: `MAT-${generateNumericCode(5)}`,
      clientId: client.id,
      clientName: client.name,
      items: [orderItem],
      status: 'completed',
      type: 'material_sale',
      subtotal: orderSubtotal,
      vatEnabled: data.vatEnabled,
      vatAmount: orderVatAmount,
      total: orderTotal,
      invoiceGenerated: false, // Will be updated if invoice is generated
      createdBy: currentUser?.id,
    };

    const createdOrder = addOrder(newOrderData);

    // 2. Deduct stock
    deductStock(material.id, data.quantity, createdOrder.id, `${t('materials.direct_sale')} - Pedido ${createdOrder.orderNumber}`);

    // 3. Generate Invoice if requested
    if (data.generateInvoice) {
      const newInvoice = {
        id: generateId(),
        invoiceNumber: `INV-${generateNumericCode(5)}`,
        orderId: createdOrder.id,
        order: createdOrder,
        vatRate: settings.vatRate,
        createdAt: new Date(),
      };
      addInvoice(newInvoice);
      useOrderStore.getState().markOrderAsInvoiced(createdOrder.id);
    }

    addNotification({
      id: generateId(),
      type: 'success',
      title: t('materials.sale_success_title'),
      message: t('materials.sale_success_message', { quantity: data.quantity, unit: t(`materials.units.${material.unit}`), materialName: material.name, clientName: client.name }),
      read: false,
      createdAt: new Date(),
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('materials.sell_material_title', { name: material.name })} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-md text-sm text-gray-600 dark:text-gray-300">
          {t('materials.stock')} disponível: <span className="font-bold text-gray-800 dark:text-white">{material.currentStock.toFixed(2)} {t(`materials.units.${material.unit}`)}</span>
        </div>

        <Controller
          name="clientId"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t('orders.client')}
              options={clients.map(c => ({ value: c.id, label: c.name }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.clientId?.message}
              required
            />
          )}
        />

        {material.unit === 'meter' ? (
          <div className="p-4 border dark:border-neutral-700 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('materials.quantity_to_sell')}</label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('materials.units.meter_plural')}
                type="number"
                value={meters}
                onChange={(e) => setMeters(parseFloat(e.target.value) || 0)}
              />
              <Input
                label={t('materials.units.cm_plural')}
                type="number"
                value={centimeters}
                onChange={(e) => setCentimeters(parseFloat(e.target.value) || 0)}
              />
            </div>
            {errors.quantity && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{errors.quantity.message}</p>}
          </div>
        ) : (
          <Input
            label={t('common.quantity')}
            type="number"
            step="0.01"
            {...control.register('quantity', { valueAsNumber: true })}
            error={errors.quantity?.message}
            required
          />
        )}

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
          <p className="font-medium text-gray-900 dark:text-white">{t('invoices.enable_vat')}</p>
          <Controller
            name="vatEnabled"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
          <p className="font-medium text-gray-900 dark:text-white">{t('materials.generate_invoice_auto')}</p>
          <Controller
            name="generateInvoice"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md text-right space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('common.subtotal')}:</span>
            <span className="font-medium text-gray-900 dark:text-white">{subtotal.toFixed(2)} {settings.currency}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{t('invoices.vat')} ({settings.vatRate}%):</span>
            <span className="font-medium text-gray-900 dark:text-white">{vatAmount.toFixed(2)} {settings.currency}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t border-gray-300 dark:border-neutral-700 mt-1 pt-1">
            <span className="text-gray-900 dark:text-white">{t('common.total')}:</span>
            <span className="text-gray-900 dark:text-white">{total.toFixed(2)} {settings.currency}</span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{t('materials.confirm_sale')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default SellMaterialModal;
