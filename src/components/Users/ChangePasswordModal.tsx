import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { User } from '../../types';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import { generateId } from '../../utils/id';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { updateUserById } = useUserStore();
  const { addNotification } = useStore();
  const [password, setPassword] = useState('');

  const validationSchema = yup.object().shape({
    password: yup.string()
      .required(t('users.form.password_required'))
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        t('users.form.password_strong')
      ),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password')], t('security.passwords_do_not_match'))
      .required(t('users.form.password_required')),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit = async (data: { password: string }) => {
    await updateUserById(user.id, { password: data.password });
    
    addNotification({
      id: generateId(),
      type: 'success',
      title: t('common.success'),
      message: t('users.password_changed_success', { name: user.name }),
      read: false,
      createdAt: new Date(),
    });

    handleClose();
  };

  const handleClose = () => {
    reset();
    setPassword('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('users.change_password_for', { name: user.name })}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            required
          />
          {password.length > 0 && <PasswordStrengthMeter password={password} />}
        </div>
        <Input
          label={t('users.confirm_password')}
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          required
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

export default ChangePasswordModal;
