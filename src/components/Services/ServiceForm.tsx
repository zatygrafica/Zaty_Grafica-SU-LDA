import React from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

import { Service } from '../../types';
import { useServiceStore } from '../../store/useServiceStore';
import { useMaterialStore } from '../../store/useMaterialStore';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import Textarea from '../Common/Textarea';
import CurrencyInput from '../Common/CurrencyInput';
import { generateId } from '../../utils/id';

interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
}

type ServiceFormData = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;

const ServiceForm: React.FC<ServiceFormProps> = ({ isOpen, onClose, service }) => {
  const { t } = useTranslation();
  const { createService, updateService } = useServiceStore();
  const { materials } = useMaterialStore();

  const validationSchema = yup.object().shape({
    name: yup.string().required(t('services.form.name_required')),
    basePrice: yup.number().typeError(t('services.form.basePrice_required')).positive(t('services.form.basePrice_positive')).required(t('services.form.basePrice_required')),
    unit: yup.string().oneOf(['meter', 'unit', 'kg', 'package', 'roll']).required(t('services.form.unit_required')),
    description: yup.string().optional().nullable(),
    variations: yup.array().of(
      yup.object().shape({
        name: yup.string().required('Nome da variação é obrigatório'),
        price: yup.number().typeError('Preço é obrigatório').positive('Preço deve ser positivo').required('Preço é obrigatório'),
      })
    ).optional(),
    materialsUsed: yup.array().of(
      yup.object().shape({
        materialId: yup.string().required('Material é obrigatório'),
        quantity: yup.number().when('materialId', {
          is: (materialId: string | undefined) => {
            if (!materialId) return false;
            const material = materials.find(m => m.id === materialId);
            return material?.unit !== 'meter';
          },
          then: (schema) => schema.typeError('Quantidade é obrigatória').positive('Quantidade deve ser positiva').required('Quantidade é obrigatória'),
          otherwise: (schema) => schema.optional().nullable(),
        }),
        length: yup.number().when('materialId', {
          is: (materialId: string | undefined) => {
            if (!materialId) return false;
            const material = materials.find(m => m.id === materialId);
            return material?.unit === 'meter';
          },
          then: (schema) => schema.typeError('O consumo de comprimento é obrigatório').positive('O consumo deve ser positivo').required('O consumo de comprimento é obrigatório'),
          otherwise: (schema) => schema.optional().nullable(),
        }),
        width: yup.number().optional().nullable(),
      })
    ).optional(),
  });

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<ServiceFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      basePrice: null,
      unit: 'unit',
      description: '',
      variations: [],
      materialsUsed: [],
    },
  });

  const { fields: variationFields, append: appendVariation, remove: removeVariation } = useFieldArray({ control, name: "variations" });
  const { fields: materialFields, append: appendMaterial, remove: removeMaterial } = useFieldArray({ control, name: "materialsUsed" });

  const watchMaterialsUsed = watch("materialsUsed");

  React.useEffect(() => {
    if (isOpen) {
      if (service) {
        reset({
          name: service.name,
          basePrice: service.basePrice,
          unit: service.unit,
          description: service.description ?? '',
          variations: service.variations ?? [],
          materialsUsed: (service.materialsUsed ?? []).map(mu => ({
            materialId: mu.materialId,
            quantity: mu.quantity ?? 0,
            width: mu.width ?? 0,
            length: mu.length ?? 0,
          })),
        });
      } else {
        reset({ name: '', basePrice: null, unit: 'unit', description: '', variations: [], materialsUsed: [] });
      }
    }
  }, [service, isOpen, reset]);

  const onSubmit = async (data: ServiceFormData) => {
    const finalData = {
      ...data,
      variations: data.variations?.map(v => ({
        ...v,
        id: v.id || generateId(),
      })),
    };
    if (service) {
      await updateService(service.id, finalData);
    } else {
      await createService(finalData);
    }
    onClose();
  };

  const unitOptions = [
    { value: 'meter', label: t('materials.units.meter') },
    { value: 'unit', label: t('materials.units.unit') },
    { value: 'kg', label: t('materials.units.kg') },
    { value: 'package', label: t('materials.units.package') },
    { value: 'roll', label: t('materials.units.roll') },
  ];

  const materialOptions = materials.map(m => ({ value: m.id, label: `${m.name} (${t(`materials.units.${m.unit}`)})` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={service ? t('services.edit_service') : t('services.new_service')} size="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('common.name')} {...register('name')} error={errors.name?.message} required />
          <Controller
            name="basePrice"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={t('services.base_price')}
                value={field.value}
                onChange={field.onChange}
                error={errors.basePrice?.message}
                required
              />
            )}
          />
        </div>
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <Combobox label={t('common.unit')} options={unitOptions} value={field.value} onChange={field.onChange} error={errors.unit && t(errors.unit.message as string)} required />
          )}
        />
        <Textarea label={t('common.description')} {...register('description')} error={errors.description?.message} />

        {/* Variations Section */}
        <div className="space-y-3 pt-4 border-t dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Variações de Preço</h3>
          {variationFields.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Input {...register(`variations.${index}.name`)} placeholder="Nome da Variação" className="flex-1" error={errors.variations?.[index]?.name?.message} />
              <Controller
                name={`variations.${index}.price`}
                control={control}
                render={({ field }) => (
                  <CurrencyInput
                    value={field.value as number | null}
                    onChange={field.onChange}
                    placeholder="Preço"
                    className="w-40"
                    error={errors.variations?.[index]?.price?.message}
                  />
                )}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeVariation(index)} icon={Trash2} className="text-red-500" />
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => appendVariation({ id: generateId(), name: '', price: 0 })}>
            Adicionar Variação
          </Button>
        </div>

        {/* Materials Used Section */}
        <div className="space-y-3 pt-4 border-t dark:border-gray-700">
          <h3 className="text-md font-medium text-gray-900 dark:text-white">Materiais Consumidos</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('services.form.materials_used_desc')}</p>
          {materialFields.map((item, index) => {
            const selectedMaterial = materials.find(m => m.id === watchMaterialsUsed?.[index]?.materialId);
            return (
              <div key={item.id} className="grid grid-cols-12 gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg items-start">
                <div className="col-span-12 md:col-span-6">
                  <Controller
                    name={`materialsUsed.${index}.materialId`}
                    control={control}
                    render={({ field }) => (
                      <Combobox options={materialOptions} value={field.value} onChange={field.onChange} placeholder="Selecione o material..." error={errors.materialsUsed?.[index]?.materialId?.message} />
                    )}
                  />
                </div>
                {selectedMaterial?.unit === 'meter' ? (
                  <div className="col-span-12 md:col-span-5">
                    <Input 
                      {...register(`materialsUsed.${index}.length`)} 
                      type="number" 
                      step="0.01" 
                      label="Consumo (Comprimento)" 
                      placeholder="Ex: 1.5 (metros)" 
                      error={errors.materialsUsed?.[index]?.length?.message} 
                    />
                  </div>
                ) : (
                  <div className="col-span-12 md:col-span-5">
                    <Input {...register(`materialsUsed.${index}.quantity`)} type="number" step="0.01" label="Quantidade" placeholder="Qtd por unidade de serviço" error={errors.materialsUsed?.[index]?.quantity?.message} />
                  </div>
                )}
                <div className="col-span-12 md:col-span-1 flex items-end h-full">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeMaterial(index)} icon={Trash2} className="text-red-500" />
                </div>
              </div>
            )
          })}
          <Button type="button" variant="secondary" size="sm" onClick={() => appendMaterial({ materialId: '', quantity: 0, width: 0, length: 0 })}>
            {t('services.form.add_material')}
          </Button>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceForm;
