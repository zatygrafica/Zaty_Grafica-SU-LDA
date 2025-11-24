import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User } from '../../types';
import { useClientStore } from '../../store/useClientStore';
import { useStore } from '../../store/useStore';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { generateId } from '../../utils/id';

interface TransferProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const TransferProgressModal: React.FC<TransferProgressModalProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { transferClients } = useClientStore();
  const { currentUser, addNotification } = useStore();
  
  const [progress, setProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const startTransfer = async () => {
      if (!currentUser) return;

      setProgress(0);

      try {
        const result = await transferClients(user.id, user.name, currentUser.id, {
          onProgress: (p) => setProgress(p),
          signal,
        });

        if (result.success) {
          if (result.transferredCount > 0) {
            addNotification({
              id: generateId(),
              type: 'success',
              title: t('users.transfer_success_title'),
              message: t('users.transfer_success_message', { count: result.transferredCount, from: user.name, to: currentUser.name }),
              read: false,
              createdAt: new Date(),
            });
          } else {
            addNotification({
              id: generateId(),
              type: 'info',
              title: t('users.transfer_no_clients_title'),
              message: t('users.transfer_no_clients_message', { name: user.name }),
              read: false,
              createdAt: new Date(),
            });
          }
        }
        onClose();
      } catch (error) {
        // This will now only catch non-cancellation errors
        console.error("Transfer failed:", error);
        addNotification({
          id: generateId(),
          type: 'error',
          title: 'Erro na Transferência',
          message: 'Ocorreu um erro inesperado durante a transferência.',
          read: false,
          createdAt: new Date(),
        });
        onClose();
      }
    };

    startTransfer();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [isOpen, user, currentUser, transferClients, addNotification, onClose, t]);

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addNotification({
        id: generateId(),
        type: 'warning',
        title: 'Transferência Cancelada',
        message: 'A transferência de dados foi cancelada pelo usuário.',
        read: false,
        createdAt: new Date(),
      });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={t('users.transfer_data_title')} size="lg">
      <div className="space-y-4">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Transferindo clientes de <strong>{user.name}</strong> para <strong>{currentUser?.name}</strong>.
        </p>
        
        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-4 overflow-hidden">
          <motion.div
            className="bg-blue-600 h-4 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
        
        <p className="text-center font-semibold text-lg text-gray-800 dark:text-gray-200">
          {Math.round(progress)}%
        </p>

        <div className="flex justify-center pt-4">
          <Button variant="danger" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TransferProgressModal;
