import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { ArrowRightLeft } from 'lucide-react';

interface TransferDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onConfirm: () => void;
}

const TransferDataModal: React.FC<TransferDataModalProps> = ({ isOpen, onClose, user, onConfirm }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.transfer_data_title')} size="lg">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <ArrowRightLeft className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('users.transfer_data_confirm', { name: user.name })}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          {t('users.transfer_data_action')}
        </Button>
      </div>
    </Modal>
  );
};

export default TransferDataModal;
