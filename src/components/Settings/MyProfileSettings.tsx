import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import { User as UserType } from '../../types';
import { useStore } from '../../store/useStore';
import Button from '../Common/Button';
import Input from '../Common/Input';
import PasswordStrengthMeter from '../Users/PasswordStrengthMeter';
import { User as UserIcon } from 'lucide-react';
import { generateId } from '../../utils/id';
import { storageService } from '../../services/storageService';
import { supabase } from '../../services/supabaseClient';

type ProfileFormData = Partial<Pick<UserType, 'name' | 'email' | 'password' | 'photoUrl'>>;

const MyProfileSettings: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, updateCurrentUser, addNotification } = useStore();
  
  const [password, setPassword] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string | null>(currentUser?.photoUrl || null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
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

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ProfileFormData & { confirmPassword?: string }>({
    resolver: yupResolver(validationSchema) as any,
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
          .getSignedUrlCached(currentUser.photoUrl, 300, 'profile_photos')
          .then(setPhotoPreview)
          .catch(() => setPhotoPreview(null));
      } else {
        setPhotoPreview(null);
      }
    }
  }, [currentUser, reset]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      addNotification({
        id: generateId(),
        type: 'error',
        title: t('common.error'),
        message: 'Por favor, selecione um arquivo de imagem válido.',
        read: false,
        createdAt: new Date(),
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        id: generateId(),
        type: 'error',
        title: t('common.error'),
        message: 'A imagem deve ter no máximo 5MB.',
        read: false,
        createdAt: new Date(),
      });
      return;
    }

    // Apenas criar preview - não fazer upload ainda
    const tempUrl = URL.createObjectURL(file);
    setPhotoPreview(tempUrl);
    setPendingPhotoFile(file);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!currentUser) return;

    try {
      let finalPhotoPath = photoPath;

      // Upload da foto apenas se houver uma pendente
      if (pendingPhotoFile) {
        try {
          const { path } = await storageService.upload(
            pendingPhotoFile,
            pendingPhotoFile.name,
            'user',
            currentUser.id,
            { source: 'profile_photo' },
            'profile_photos'
          );
          finalPhotoPath = path;
          setPhotoPath(path);
        } catch (uploadError) {
          console.error('Upload de foto falhou', uploadError);
          addNotification({
            id: generateId(),
            type: 'error',
            title: t('common.error'),
            message: 'Falha ao enviar a foto. Perfil atualizado sem a foto.',
            read: false,
            createdAt: new Date(),
          });
          // Continua sem a foto
        }
      }

      // Atualizar perfil diretamente na tabela profiles (sem Edge Function)
      const updatePayload: Record<string, unknown> = {
        full_name: data.name,
      };

      if (data.email) {
        updatePayload.email = data.email;
      }

      if (finalPhotoPath) {
        updatePayload.avatar_url = finalPhotoPath;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', currentUser.id);

      if (profileError) {
        throw profileError;
      }

      // Se houver senha, atualizar via auth
      if (data.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.password,
        });

        if (passwordError) {
          throw passwordError;
        }
      }

      // Atualizar estado local
      const updatedData: Partial<UserType> = {
        name: data.name,
        email: data.email,
        photoUrl: finalPhotoPath || undefined,
      };

      updateCurrentUser(updatedData);

      addNotification({
        id: generateId(),
        type: 'success',
        title: t('common.success'),
        message: t('users.profile_updated_success'),
        read: false,
        createdAt: new Date(),
      });

      // Limpar estados temporários
      setPendingPhotoFile(null);
      reset({ ...data, password: '', confirmPassword: '' });
      setPassword('');

      // Atualizar preview com URL assinada
      if (finalPhotoPath) {
        const signedUrl = await storageService.getSignedUrlCached(finalPhotoPath, 300, 'profile_photos');
        setPhotoPreview(signedUrl);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      addNotification({
        id: generateId(),
        type: 'error',
        title: t('common.error'),
        message: (error as Error).message || 'Erro ao atualizar perfil',
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
