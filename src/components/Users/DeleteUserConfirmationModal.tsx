import React from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { useUserStore } from '../../store/useUserStore';
import { useClientStore } from '../../store/useClientStore';
import { useStore } from '../../store/useStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { AlertTriangle } from 'lucide-react';
import { generateId } from '../../utils/id';

interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const DeleteUserConfirmationModal: React.FC<DeleteUserConfirmationModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { deleteUserById } = useUserStore();
  const { transferClients } = useClientStore();
  const { currentUser, addNotification } = useStore();

  const handleTransferAndDelete = async () => {
    if (!currentUser) return;
    
    const dummyOptions = {
        onProgress: () => {},
        signal: new AbortController().signal
    };

    const result = await transferClients(user.id, user.name, currentUser.id, dummyOptions);
    
    await deleteUserById(user.id);
    
    if (result.success) {
        addNotification({
          id: generateId(),
          type: 'success',
          title: t('common.success'),
          message: t('users.user_deleted_transfer_success', { name: user.name, count: result.transferredCount }),
          read: false,
          createdAt: new Date(),
        });
    } else {
        addNotification({
          id: generateId(),
          type: 'warning',
          title: 'Aviso',
          message: `A transferência de dados falhou, mas o usuário ${user.name} foi excluído.`,
          read: false,
          createdAt: new Date(),
        });
    }
    onClose();
  };

  const handleDeleteAnyway = async () => {
    await deleteUserById(user.id);
    addNotification({
      id: generateId(),
      type: 'success',
      title: t('common.success'),
      message: t('users.user_deleted_success', { name: user.name }),
      read: false,
      createdAt: new Date(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('users.delete_user_title')} size="lg">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('users.delete_user_transfer_confirm', { name: user.name })}
          </p>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={handleDeleteAnyway}>
          {t('users.delete_anyway')}
        </Button>
        <Button variant="primary" onClick={handleTransferAndDelete}>
          {t('users.transfer_and_delete')}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteUserConfirmationModal;
