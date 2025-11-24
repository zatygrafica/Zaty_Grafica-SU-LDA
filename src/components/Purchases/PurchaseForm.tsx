import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Purchase } from '../../types';
import { useMaterialStore } from '../../store/useMaterialStore';
import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useStore } from '../../store/useStore';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import CurrencyInput from '../Common/CurrencyInput';

interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
}

type PurchaseFormData = {
  materialId: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  date: string;
};

const PurchaseForm: React.FC<PurchaseFormProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { materials } = useMaterialStore();
  const { addPurchase } = usePurchaseStore();
  const { settings } = useStore();
  
  const [rollLength, setRollLength] = useState(1);

  const validationSchema = yup.object().shape({
    materialId: yup.string().required(t('purchases.form.material_required')),
    quantity: yup.number().typeError(t('purchases.form.quantity_required')).positive(t('purchases.form.quantity_required')).required(t('purchases.form.quantity_required')),
    unitPrice: yup.number().typeError(t('purchases.form.unitPrice_required')).min(0).required(t('purchases.form.unitPrice_required')),
    supplier: yup.string().optional().nullable(),
    date: yup.string().required(t('common.date')),
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<PurchaseFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      materialId: '',
      quantity: 1,
      unitPrice: null,
      supplier: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const watchMaterialId = watch('materialId');
  const watchQuantity = watch('quantity');
  const watchUnitPrice = watch('unitPrice');
  const selectedMaterial = materials.find(m => m.id === watchMaterialId);

  // Sync form values based on selected material
  useEffect(() => {
    if (selectedMaterial) {
      if (selectedMaterial.unit === 'meter') {
        const length = rollLength || 0;
        setValue('quantity', length);
        setValue('unitPrice', selectedMaterial.pricePerUnit || 0);
      } else {
        setValue('quantity', 1);
        setValue('unitPrice', selectedMaterial.pricePerUnit || 0);
      }
    }
  }, [selectedMaterial, rollLength, setValue]);

  const totalPurchaseValue = useMemo(() => {
    if (!selectedMaterial) return 0;

    if (selectedMaterial.unit === 'meter') {
      const length = rollLength || 0;
      return length * (selectedMaterial.pricePerUnit || 0);
    } else {
      const quantity = Number(watchQuantity) || 0;
      const price = Number(watchUnitPrice) || 0;
      return quantity * price;
    }
  }, [selectedMaterial, rollLength, watchQuantity, watchUnitPrice]);

  const onSubmit = (data: PurchaseFormData) => {
    const material = materials.find(m => m.id === data.materialId);
    if (!material) return;

    const finalQuantity = material.unit === 'meter' ? (rollLength || 0) : data.quantity;
    const finalUnitPrice = material.unit === 'meter' ? material.pricePerUnit : data.unitPrice;
    const finalTotal = totalPurchaseValue;

    const newPurchaseData: Omit<Purchase, 'id' | 'createdAt'> = {
      materialId: data.materialId,
      materialName: material.name,
      quantity: finalQuantity,
      unitPrice: finalUnitPrice,
      total: finalTotal,
      supplier: data.supplier,
      date: new Date(data.date),
    };
    addPurchase(newPurchaseData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('purchases.new_purchase')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="materialId"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t('purchases.material')}
              options={materials.map(m => ({ value: m.id, label: `${m.name} (${t(`materials.units.${m.unit}`)})` }))}
              value={field.value}
              onChange={field.onChange}
              error={errors.materialId && t(errors.materialId.message as string)}
              required
            />
          )}
        />
        
        {selectedMaterial?.unit === 'meter' ? (
          <div className="p-4 border dark:border-gray-600 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('purchases.roll_width')}
                type="number"
                value={selectedMaterial.defaultWidth || 0}
                disabled
              />
              <Input
                label={t('purchases.roll_length')}
                type="number"
                step="0.01"
                value={rollLength}
                onChange={(e) => setRollLength(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Preço por Metro Linear</label>
                <span className="font-bold text-gray-900 dark:text-white">{(selectedMaterial.pricePerUnit || 0).toFixed(2)} {settings.currency}</span>
              </div>
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Comprimento a Adicionar</label>
                <span className="font-bold text-gray-900 dark:text-white">{(Number(watchQuantity) || 0).toFixed(2)} m</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('common.quantity')} type="number" {...register('quantity')} error={errors.quantity?.message} required />
            <Controller
              name="unitPrice"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label={t('materials.price_per_unit')}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.unitPrice?.message}
                  required
                />
              )}
            />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('materials.supplier')} {...register('supplier')} error={errors.supplier?.message} />
          <Input label={t('common.date')} type="date" {...register('date')} error={errors.date?.message} required />
        </div>
        
        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md text-right">
          <span className="font-bold text-lg text-gray-900 dark:text-white">{t('purchases.total_value')}: {totalPurchaseValue.toFixed(2)} {settings.currency}</span>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseForm;
