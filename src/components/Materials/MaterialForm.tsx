import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

import { Material } from '../../types';
import { useMaterialStore } from '../../store/useMaterialStore';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import Switch from '../Common/Switch';
import CurrencyInput from '../Common/CurrencyInput';

interface MaterialFormProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

type MaterialFormData = Omit<Material, 'id' | 'createdAt' | 'updatedAt'>;

const MaterialForm: React.FC<MaterialFormProps> = ({ isOpen, onClose, material }) => {
  const { t } = useTranslation();
  const { createMaterial, updateMaterial } = useMaterialStore();

  const validationSchema = yup.object().shape({
    name: yup.string().required(t('materials.form.name_required')),
    unit: yup.string().oneOf(['meter', 'roll', 'unit', 'kg', 'package']).required(t('materials.form.unit_required')),
    defaultWidth: yup.number().when('unit', {
      is: 'meter',
      then: (schema) => schema.typeError('A largura é obrigatória').positive('A largura deve ser positiva').required('A largura é obrigatória'),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    pricePerUnit: yup.number().typeError(t('materials.form.price_required')).positive(t('materials.form.price_required')).required(t('materials.form.price_required')),
    isSellable: yup.boolean(),
    sellingPrice: yup.number().when('isSellable', {
      is: true,
      then: (schema) => schema.typeError('O preço de venda é obrigatório').positive('O preço de venda deve ser positivo').required('O preço de venda é obrigatório'),
      otherwise: (schema) => schema.optional().nullable(),
    }),
    currentStock: yup.number().typeError(t('materials.form.stock_required')).min(0, t('materials.form.stock_required')).required(t('materials.form.stock_required')),
    supplier: yup.string().optional().nullable(),
  });

  const { register, handleSubmit, control, watch, reset, formState: { errors, isSubmitting } } = useForm<MaterialFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      unit: 'unit',
      defaultWidth: 0,
      pricePerUnit: null,
      isSellable: false,
      sellingPrice: null,
      currentStock: 0,
      supplier: '',
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        if (material) {
            reset({
                name: material.name,
                unit: material.unit,
                defaultWidth: material.defaultWidth ?? 0,
                pricePerUnit: material.pricePerUnit ?? null,
                isSellable: material.isSellable ?? false,
                sellingPrice: material.sellingPrice ?? null,
                currentStock: material.currentStock ?? 0,
                supplier: material.supplier ?? '',
            });
        } else {
            reset({
                name: '',
                unit: 'unit',
                defaultWidth: 0,
                pricePerUnit: null,
                isSellable: false,
                sellingPrice: null,
                currentStock: 0,
                supplier: '',
            });
        }
    }
  }, [isOpen, material, reset]);

  const unit = watch('unit');
  const isSellable = watch('isSellable');

  const onSubmit = async (data: MaterialFormData) => {
    const finalData = {
      ...data,
      sellingPrice: data.isSellable ? data.sellingPrice : undefined,
    };

    if (material) {
      await updateMaterial(material.id, finalData);
    } else {
      await createMaterial(finalData);
    }
    onClose();
  };

  const unitOptions: { value: Material['unit'], label: string }[] = [
    { value: 'meter', label: t('materials.units.meter') },
    { value: 'roll', label: t('materials.units.roll') },
    { value: 'unit', label: t('materials.units.unit') },
    { value: 'kg', label: t('materials.units.kg') },
    { value: 'package', label: t('materials.units.package') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={material ? t('materials.edit_material') : t('materials.new_material')} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={unit === 'meter' ? t('materials.form.name_with_width_hint') : t('common.name')}
          {...register('name')}
          error={errors.name?.message}
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="pricePerUnit"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={`${t('materials.price_per_unit')} (Custo)`}
                value={field.value}
                onChange={field.onChange}
                error={errors.pricePerUnit?.message}
                required
              />
            )}
          />
          <Controller
            name="unit"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('common.unit')}
                options={unitOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.unit && t(errors.unit.message as string)}
                required
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Material Vendável</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Permitir venda direta deste material.</p>
            </div>
            <Controller
              name="isSellable"
              control={control}
              render={({ field }) => (
                <Switch
                  checked={field.value || false}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
          {isSellable && (
            <Controller
              name="sellingPrice"
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  label="Preço de Venda"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.sellingPrice?.message}
                  required
                />
              )}
            />
          )}
        </div>
        
        {unit === 'meter' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t('materials.form.default_width')}
              type="number"
              step="0.01"
              {...register('defaultWidth')}
              error={errors.defaultWidth?.message}
              required
              placeholder="Ex: 1.20"
            />
             <Input
              label={`${t('materials.stock')} (${t('materials.units.meter')})`}
              type="number"
              step="0.01"
              {...register('currentStock')}
              error={errors.currentStock?.message}
              required
            />
          </div>
        ) : (
          <Input
            label={t('materials.stock')}
            type="number"
            {...register('currentStock')}
            error={errors.currentStock?.message}
            required
          />
        )}

        <Input
          label={t('materials.supplier')}
          {...register('supplier')}
          error={errors.supplier?.message}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default MaterialForm;
