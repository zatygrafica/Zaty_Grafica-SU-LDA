import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { ShieldAlert } from 'lucide-react';
import { clsx } from 'clsx';

interface PasswordPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  passwordToMatch: string;
  title: string;
  message: string;
}

const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  passwordToMatch,
  title,
  message,
}) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Focus the input when the modal opens
      setTimeout(() => {
        const input = document.getElementById('password-prompt-input');
        if (input) {
          input.focus();
        }
      }, 100);
    } else {
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
    if (password === passwordToMatch) {
      onSuccess();
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
          id="password-prompt-input"
          label={t('security.deletion_password')}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error ? t('security.incorrect_password') : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleConfirm();
            }
          }}
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

export default PasswordPromptModal;
