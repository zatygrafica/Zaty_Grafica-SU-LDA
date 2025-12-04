import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { User as UserType } from '../../types';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import Button from '../Common/Button';
import Input from '../Common/Input';
import PasswordStrengthMeter from '../Users/PasswordStrengthMeter';
import { User as UserIcon } from 'lucide-react';
import { generateId } from '../../utils/id';
import { storageService } from '../../services/storageService';

type ProfileFormData = Partial<Pick<UserType, 'name' | 'email' | 'password' | 'photoUrl'>>;

const MyProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, updateCurrentUser, addNotification } = useStore();
  const { updateUserById } = useUserStore();
  
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(currentUser?.photoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validationSchema = yup.object().shape({
    name: yup.string().required(t('users.form.name_required')),
    email: yup.string().email().optional().nullable(),
    password: yup.string().optional().nullable().test(
      'is-strong-if-present',
      t('users.form.password_strong'),
      (value) => !value || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value)
    ),
    confirmPassword: yup.string().when('password', (password, schema) => {
        return password && password[0] ? schema.oneOf([yup.ref('password')], t('security.passwords_do_not_match')).required() : schema.optional();
    }),
    photoUrl: yup.string().optional().nullable(),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue } = useForm<ProfileFormData & { confirmPassword?: string }>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: currentUser?.name ?? '',
      email: currentUser?.email ?? '',
      photoUrl: currentUser?.photoUrl ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (currentUser) {
      const defaults = {
        name: currentUser.name,
        email: currentUser.email ?? '',
        photoUrl: currentUser.photoUrl ?? '',
        password: '',
        confirmPassword: '',
      };
      reset(defaults);
      setPhotoPath(currentUser.photoUrl ?? null);
      if (currentUser.photoUrl) {
        void storageService
          .getSignedUrl(currentUser.photoUrl)
          .then(setPhotoPreview)
          .catch(() => setPhotoPreview(null));
      } else {
        setPhotoPreview(null);
      }
    }
  }, [currentUser, reset]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { path, attachment } = await storageService.upload(
          file,
          file.name,
          'user',
          currentUser?.id,
          { source: 'profile_photo' },
          'profile_photos'
        );
        const signedUrl = await storageService.getSignedUrl(path, 60, 'profile_photos');
        setPhotoPath(path);
        setValue('photoUrl', path);
        setPhotoPreview(signedUrl);

        // feedback
        addNotification({
          id: generateId(),
          type: 'success',
          title: t('common.success'),
          message: t('users.profile_photo') + ' atualizada.',
          read: false,
          createdAt: new Date(),
        });
      } catch (error) {
        console.error('Upload de foto falhou', error);
        addNotification({
          id: generateId(),
          type: 'error',
          title: t('common.error'),
          message: 'Falha ao enviar a foto. Tente novamente.',
          read: false,
          createdAt: new Date(),
        });
      }
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;

    const updateData: Partial<UserType> = { 
      name: data.name,
      email: data.email,
      photoUrl: photoPath ?? data.photoUrl,
    };
    if (data.password) {
      updateData.password = data.password;
    }

    const result = await updateUserById(currentUser.id, updateData);

    if (result.success) {
      updateCurrentUser(updateData);
      addNotification({
        id: generateId(),
        type: 'success',
        title: t('common.success'),
        message: t('users.profile_updated_success'),
        read: false,
        createdAt: new Date(),
      });
      reset({ ...data, password: '', confirmPassword: '' });
      setPassword('');
    } else {
      addNotification({
        id: generateId(),
        type: 'error',
        title: t('common.error'),
        message: t(`users.${result.message}`),
        read: false,
        createdAt: new Date(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.my_profile')}</h3>
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-12 h-12 text-gray-400" />
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
        label={t('common.email')}
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <div className="pt-4 border-t dark:border-neutral-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('users.form.password_optional')}</p>
        <div>
          <Input
            label={t('users.new_password')}
            type="password"
            {...register('password')}
            onChange={(e) => {
              setPassword(e.target.value);
              register('password').onChange(e);
            }}
            error={errors.password?.message}
          />
          {password.length > 0 && <PasswordStrengthMeter password={password} />}
        </div>
        <Input
          label={t('users.confirm_password')}
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        className="mt-4"
      />
    </div>
    <div className="flex justify-end pt-4">
      <Button type="submit" variant="primary" loading={isSubmitting}>
          {t('common.save')}
      </Button>
    </div>
  </form>
);
};

export default MyProfileSettings;
