import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { format, parseISO } from 'date-fns';

import { Employee } from '../../types';
import { useEmployeeStore } from '../../store/useEmployeeStore';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import Textarea from '../Common/Textarea';
import CurrencyInput from '../Common/CurrencyInput';
import { formatPhoneNumber, formatDigitsOnly } from '../../utils/formatting';
import { storageService } from '../../services/storageService';
import { generateId } from '../../utils/id';

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

type EmployeeFormData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'documents' | 'workSchedule' | 'customTerm' | 'startDate'> & {
  startDate?: string;
};

const EmployeeForm: React.FC<EmployeeFormProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const { createEmployee, updateEmployeeById } = useEmployeeStore();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(employee?.photoUrl || null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationSchema = yup.object().shape({
    name: yup.string().required(t('employees.form.name_required')),
    motherName: yup.string().optional().nullable(),
    phone: yup.string()
      .required(t('employees.form.phone_required'))
      .matches(/^[0-9]{9}$/, t('employees.form.phone_invalid')),
    position: yup.string().required(t('employees.form.position_required')),
    photoUrl: yup.string().optional().nullable(),
    email: yup.string().email().optional().nullable(),
    documentType: yup.string().oneOf(['bi', 'passport', 'voter_card', 'drivers_license']).required(t('employees.form.documentType_required')),
    documentNumber: yup.string().required(t('employees.form.documentNumber_required')),
    nuit: yup.string().optional().nullable(),
    address: yup.string().optional().nullable(),
    neighborhood: yup.string().optional().nullable(),
    city: yup.string().optional().nullable(),
    salary: yup.number().positive(t('employees.form.salary_positive')).optional().nullable(),
    startDate: yup.string().required(t('employees.form.startDate_required')),
    paymentDate: yup.number().typeError(t('employees.form.paymentDate_invalid')).min(1).max(31).optional().nullable(),
  });

  const { register, handleSubmit, reset, control, setValue, formState: { errors, isSubmitting } } = useForm<EmployeeFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: employee?.name ?? '',
      motherName: employee?.motherName ?? '',
      phone: employee?.phone ?? '',
      position: employee?.position ?? 'employee',
      photoUrl: employee?.photoUrl ?? '',
      email: employee?.email ?? '',
      documentType: employee?.documentType ?? 'bi',
      documentNumber: employee?.documentNumber ?? '',
      nuit: employee?.nuit ?? '',
      address: employee?.address ?? '',
      neighborhood: employee?.neighborhood ?? '',
      city: employee?.city ?? '',
      salary: employee?.salary ?? null,
      startDate: employee?.startDate ? format(new Date(employee.startDate), 'yyyy-MM-dd') : '',
      paymentDate: employee?.paymentDate ?? null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        reset({
          name: employee.name,
          motherName: employee.motherName ?? '',
          phone: employee.phone,
          position: employee.position,
          photoUrl: employee.photoUrl ?? '',
          email: employee.email ?? '',
          documentType: employee.documentType ?? 'bi',
          documentNumber: employee.documentNumber ?? '',
          nuit: employee.nuit ?? '',
          address: employee.address ?? '',
          neighborhood: employee.neighborhood ?? '',
          city: employee.city ?? '',
          salary: employee.salary ?? null,
          startDate: employee.startDate ? format(new Date(employee.startDate), 'yyyy-MM-dd') : '',
          paymentDate: employee.paymentDate ?? null,
        });
        setPhotoPath(employee.photoUrl ?? null);
        if (employee.photoUrl) {
          const cached = storageService.getCachedSignedUrl(employee.photoUrl, 'profile_photos');
          if (cached) setPhotoPreview(cached);
          void storageService
            .getSignedUrlCached(employee.photoUrl, 300, 'profile_photos')
            .then(setPhotoPreview)
            .catch(() => setPhotoPreview((prev) => prev ?? null));
        } else {
          setPhotoPreview(null);
        }
      } else {
        reset({
          name: '',
          motherName: '',
          phone: '',
          position: 'employee',
          photoUrl: '',
          email: '',
          documentType: 'bi',
          documentNumber: '',
          nuit: '',
          address: '',
          neighborhood: '',
          city: '',
          salary: null,
          startDate: '',
          paymentDate: null,
        });
        setPhotoPreview(null);
        setPhotoPath(null);
      }
    }
  }, [isOpen, employee, reset]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      console.error('Arquivo inválido: deve ser uma imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('Arquivo muito grande: máximo 5MB');
      return;
    }

    // Apenas criar preview - não fazer upload ainda
    const tempUrl = URL.createObjectURL(file);
    setPhotoPreview(tempUrl);
    setPendingPhotoFile(file);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    let workSchedule;
    switch (data.position) {
      case 'security_day':
        workSchedule = { start: '07:00', end: '17:30', totalHours: 10.5 };
        break;
      case 'security_night':
        workSchedule = { start: '17:30', end: '07:00', totalHours: 13.5 };
        break;
      default:
        workSchedule = { start: '08:00', end: '18:00', totalHours: 10 };
        break;
    }

    let finalPhotoPath = photoPath;

    // Upload da foto apenas se houver uma pendente
    if (pendingPhotoFile) {
      try {
        const { path } = await storageService.upload(
          pendingPhotoFile,
          pendingPhotoFile.name,
          'employee',
          employee?.id,
          { source: 'employee_profile_photo' },
          'profile_photos'
        );
        finalPhotoPath = path;
        setPhotoPath(path);
      } catch (uploadError) {
        console.error('Upload de foto falhou', uploadError);
        // Continua sem a foto
      }
    }

    const finalData = {
      ...data,
      startDate: data.startDate ? parseISO(data.startDate) : undefined,
      photoUrl: finalPhotoPath ?? data.photoUrl,
    };

    if (employee) {
      await updateEmployeeById(employee.id, { ...finalData, workSchedule });
    } else {
      await createEmployee({
        ...finalData,
        startDate: finalData.startDate || new Date(),
        workSchedule,
        documents: [],
      });
    }

    // Limpar estados temporários
    setPendingPhotoFile(null);
    onClose();
  };

  const positionOptions = [
    'security_day', 'security_night', 'production_manager', 'production', 'manager', 
    'customer_service', 'graphic_designer', 'employee'
  ];
  
  const documentTypeOptions = ['bi', 'passport', 'voter_card', 'drivers_license'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? t('employees.edit_employee') : t('employees.new_employee')} size="2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-full object-cover"
                style={{
                  objectFit: 'cover',
                  imageRendering: 'auto',
                  filter: 'none'
                }}
              />
            ) : (
              <User className="w-12 h-12 text-gray-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t('employees.profile_photo')}</h4>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {t('employees.upload_photo')}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('common.name')} {...register('name')} error={errors.name?.message} required />
          <Input label={t('employees.mother_name')} {...register('motherName')} error={errors.motherName?.message} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="documentType"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('employees.document_type_label')}
                options={documentTypeOptions.map(doc => ({ value: doc, label: t(`employees.document_types_form.${doc}`) }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.documentType && t(errors.documentType.message as string)}
                required
              />
            )}
          />
          <Input label={t('employees.document_number')} {...register('documentNumber')} error={errors.documentNumber?.message} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <Input
                label={t('employees.contact')}
                type="tel"
                {...field}
                onChange={(e) => field.onChange(formatPhoneNumber(e.target.value))}
                error={errors.phone?.message}
                required
              />
            )}
          />
          <Input label={t('common.email')} type="email" {...register('email')} error={errors.email?.message} />
        </div>
        
        <Textarea label={t('common.address')} {...register('address')} error={errors.address?.message} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('employees.neighborhood')} {...register('neighborhood')} error={errors.neighborhood?.message} />
          <Input label={t('common.city')} {...register('city')} error={errors.city?.message} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="position"
            control={control}
            render={({ field }) => (
              <Combobox
                label={t('employees.position')}
                options={positionOptions.map(pos => ({ value: pos, label: t(`employees.positions.${pos}`) }))}
                value={field.value}
                onChange={field.onChange}
                error={errors.position && t(errors.position.message as string)}
                required
              />
            )}
          />
          <Controller
            name="nuit"
            control={control}
            render={({ field }) => (
              <Input
                label={t('employees.nuit')}
                {...field}
                onChange={(e) => field.onChange(formatDigitsOnly(e.target.value))}
                error={errors.nuit?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="salary"
            control={control}
            render={({ field }) => (
              <CurrencyInput
                label={t('employees.salary')}
                value={field.value}
                onChange={field.onChange}
                error={errors.salary?.message}
              />
            )}
          />
          <Input label={t('employees.start_date')} type="date" {...register('startDate')} error={errors.startDate?.message} required />
          <Input label={t('employees.payment_date')} type="number" {...register('paymentDate')} error={errors.paymentDate?.message} />
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>{t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeForm;
