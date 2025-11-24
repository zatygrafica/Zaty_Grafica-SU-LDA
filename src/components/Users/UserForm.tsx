import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { User as UserType } from '../../types';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { User as UserIcon } from 'lucide-react';
import { generateId } from '../../utils/id';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
}

type UserFormData = Omit<UserType, 'id' | 'createdAt' | 'updatedAt' | 'permissions'>;

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { createUser, updateUserById, users } = useUserStore();
  const { addNotification } = useStore();
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!user;

  const validationSchema = yup.object().shape({
    name: yup.string().required(t('users.form.name_required')),
    email: yup.string().email().optional().nullable(),
    password: yup.string().when('$isEditing', {
      is: false,
      then: (schema) => schema.required(t('users.form.password_required')).matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        t('users.form.password_strong')
      ),
      otherwise: (schema) => schema.optional().nullable().test(
        'is-strong-if-present',
        t('users.form.password_strong'),
        (value) => !value || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)
      ),
    }),
    role: yup.string().oneOf(['admin', 'user']).required(t('users.form.role_required')),
    photoUrl: yup.string().optional().nullable(),
  });

  const { control, handleSubmit, register, formState: { errors, isSubmitting }, reset, setValue } = useForm<UserFormData>({
    resolver: yupResolver(validationSchema),
    context: { isEditing },
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
      photoUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        reset({
          name: user.name,
          email: user.email ?? '',
          role: user.role,
          photoUrl: user.photoUrl ?? '',
          password: '',
        });
        setPhotoPreview(user.photoUrl || null);
      } else {
        reset({
          name: '',
          email: '',
          password: '',
          role: 'user',
          photoUrl: '',
        });
        setPhotoPreview(null);
      }
      setPassword('');
    }
  }, [user, isOpen, reset]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setValue('photoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    let result;
    if (isEditing && user) {
      const updateData: Partial<UserType> = { ...data };
      if (!updateData.password) {
        delete updateData.password;
      }
      result = await updateUserById(user.id, updateData);
    } else {
      let finalEmail = data.email;
      if (!finalEmail) {
        let counter = 1;
        let generatedEmail;
        do {
          generatedEmail = `user${users.length + counter}@zatygrafica.com`;
          counter++;
        } while (users.some(u => u.email === generatedEmail));
        finalEmail = generatedEmail;
      }
      result = await createUser({
        name: data.name,
        email: finalEmail,
        password: data.password,
        role: data.role,
        photoUrl: data.photoUrl,
        permissions: data.role === 'admin' ? ['*'] : ['read:own'],
      });
    }

    addNotification({
      id: generateId(),
      type: result.success ? 'success' : 'error',
      title: result.success ? t('common.success') : t('common.error'),
      message: t(`users.${result.message}`),
      read: false,
      createdAt: new Date(),
    });

    if (result.success) {
      handleClose();
    }
  };

  const handleClose = () => {
    reset();
    setPassword('');
    setPhotoPreview(null);
    onClose();
  };
  
  const roleOptions = [
    { value: 'user', label: t('users.roles.user') },
    { value: 'admin', label: t('users.roles.admin') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? t('users.edit_user') : t('users.new_user')}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t('users.profile_photo')}</h4>
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              {t('users.upload_photo')}
            </Button>
            <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" accept="image/*" />
          </div>
        </div>
        <Input
          label={t('users.full_name')}
          {...register('name')}
          error={errors.name?.message}
          required
        />
        <Input
          label={t('users.email_optional')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <div>
          <Input
            label={t('common.password')}
            type="password"
            {...register('password')}
            onChange={(e) => {
              setPassword(e.target.value);
              register('password').onChange(e);
            }}
            error={errors.password?.message}
            required={!isEditing}
            placeholder={isEditing ? t('users.form.password_optional') : ''}
          />
          {(password.length > 0 || !isEditing) && <PasswordStrengthMeter password={password} />}
        </div>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t('users.role')}
              options={roleOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.role?.message}
              required
            />
          )}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
