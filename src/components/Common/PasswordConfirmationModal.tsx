import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface PasswordConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const PasswordConfirmationModal: React.FC<PasswordConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(false);
      }, 820);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleConfirm = () => {
    if (password === currentUser?.password) {
      onConfirm();
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className={clsx('space-y-4', error && 'animate-shake')}>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-500/20">
            <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        </div>
        <Input
          label="Senha do Administrador"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ? t('security.incorrect_password') : undefined}
          autoFocus
        />
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={handleConfirm}>
          {t('common.confirm')}
        </Button>
      </div>
    </Modal>
  );
};

export default PasswordConfirmationModal;
