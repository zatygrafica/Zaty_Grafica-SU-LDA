import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../../store/useUserStore';
import { useStore } from '../../store/useStore';
import { User } from '../../types';
import { Users, LogIn, Lock, Unlock, Edit, KeyRound, Trash2, Plus, ArrowRightLeft } from 'lucide-react';
import { clsx } from 'clsx';

import Button from '../Common/Button';
import UserForm from './UserForm';
import ConfirmationModal from '../Common/ConfirmationModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ChangePasswordModal from './ChangePasswordModal';
import DeleteUserConfirmationModal from './DeleteUserConfirmationModal';
import TransferDataModal from './TransferDataModal';
import TransferProgressModal from './TransferProgressModal';
import { generateId } from '../../utils/id';
import ModuleDataState from '../Common/ModuleDataState';
import { CardGridSkeleton, TableSkeleton } from '../Common/SkeletonLoaders';
import { useIncrementalList } from '../../hooks/useIncrementalList';

const UsersModule: React.FC = () => {
  const { t } = useTranslation();
  const { users, listUsers, toggleUserBlock, loading, hasLoaded, error: loadError } = useUserStore();
  const { currentUser, startImpersonation, addNotification } = useStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBlockConfirmOpen, setIsBlockConfirmOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [isTransferConfirmOpen, setIsTransferConfirmOpen] = useState(false);
  const [isTransferProgressOpen, setIsTransferProgressOpen] = useState(false);
  
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [userToProcess, setUserToProcess] = useState<User | null>(null);

  useEffect(() => {
    listUsers().catch((error) => {
      console.error('Failed to load users:', error);
    });
  }, [listUsers]);

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleOpenForm = (user: User | null = null) => {
    setSelectedUserForEdit(user);
    setIsFormOpen(true);
  };

  const handleToggleBlockClick = (user: User) => {
    setUserToProcess(user);
    setIsBlockConfirmOpen(true);
  };

  const confirmToggleBlock = async () => {
    if (userToProcess) {
      await toggleUserBlock(userToProcess.id);
      addNotification({
        id: generateId(),
        type: 'success',
        title: t('common.success'),
        message: userToProcess.isBlocked ? t('users.user_unblocked_success') : t('users.user_blocked_success'),
        read: false,
        createdAt: new Date(),
      });
    }
    setIsBlockConfirmOpen(false);
    setUserToProcess(null);
  };

  const handleChangePasswordClick = (user: User) => {
    setUserToProcess(user);
    setIsChangePasswordModalOpen(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setUserToProcess(user);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleTransferDataClick = (user: User) => {
    setUserToProcess(user);
    setIsTransferConfirmOpen(true);
  };

  const handleConfirmTransfer = () => {
    setIsTransferConfirmOpen(false);
    setIsTransferProgressOpen(true);
  };

  const handleCloseTransferProgress = useCallback(() => {
    setIsTransferProgressOpen(false);
  }, []);

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('navigation.users')}
        </h1>
          {isAdmin && (
            <Button onClick={() => handleOpenForm()} icon={Plus}>
              {!isMobile && t('users.new_user')}
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</div>
        ) : loadError ? (
          <div className="text-center text-sm text-red-500">{loadError}</div>
        ) : users.length === 0 ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('users.empty_state', 'Nenhum usuário encontrado')}
          </div>
        ) : isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((user) => (
              <div key={user.id} className={clsx("bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between", user.isBlocked && 'opacity-60')}>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 flex items-center justify-center overflow-hidden">
                      {user.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t(`users.roles.${user.role}`)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                {isAdmin && user.id !== currentUser?.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1 flex-wrap gap-1">
                    <Button size="sm" variant="ghost" icon={LogIn} onClick={() => startImpersonation(user)} title={t('users.impersonate')} />
                    <Button size="sm" variant="ghost" icon={ArrowRightLeft} onClick={() => handleTransferDataClick(user)} title={t('users.transfer_data')} />
                    <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => handleChangePasswordClick(user)} title={t('users.change_password')} />
                    <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenForm(user)} title={t('common.edit')} />
                    <Button size="sm" variant="ghost" icon={user.isBlocked ? Unlock : Lock} onClick={() => handleToggleBlockClick(user)} title={user.isBlocked ? t('users.unblock') : t('users.block')} className={clsx(user.isBlocked ? 'text-green-500' : 'text-yellow-600')} />
                    <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDeleteUserClick(user)} title={t('common.delete')} className="text-red-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('common.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('common.email')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('users.role')}</th>
                    {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('common.actions')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                  {users.map((user) => (
                    <tr key={user.id} className={clsx("hover:bg-gray-500/10", user.isBlocked && 'bg-red-500/10 opacity-70')}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200/50 dark:bg-neutral-800/50 flex items-center justify-center overflow-hidden">
                          {user.photoUrl ? (
                            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t(`users.roles.${user.role}`)}</td>
                      {isAdmin && user.id !== currentUser?.id && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <Button size="sm" variant="ghost" icon={LogIn} onClick={() => startImpersonation(user)} title={t('users.impersonate')} />
                            <Button size="sm" variant="ghost" icon={ArrowRightLeft} onClick={() => handleTransferDataClick(user)} title={t('users.transfer_data')} />
                            <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => handleChangePasswordClick(user)} title={t('users.change_password')} />
                            <Button size="sm" variant="ghost" icon={Edit} onClick={() => handleOpenForm(user)} title={t('common.edit')} />
                            <Button size="sm" variant="ghost" icon={user.isBlocked ? Unlock : Lock} onClick={() => handleToggleBlockClick(user)} title={user.isBlocked ? t('users.unblock') : t('users.block')} className={clsx(user.isBlocked ? 'text-green-500' : 'text-yellow-600')} />
                            <Button size="sm" variant="ghost" icon={Trash2} onClick={() => handleDeleteUserClick(user)} title={t('common.delete')} className="text-red-500" />
                          </div>
                        </td>
                      )}
                      {user.id === currentUser?.id && <td className="px-6 py-4"></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <UserForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        user={selectedUserForEdit}
      />
      {userToProcess && (
        <ConfirmationModal
          isOpen={isBlockConfirmOpen}
          onClose={() => setIsBlockConfirmOpen(false)}
          onConfirm={confirmToggleBlock}
          title={userToProcess.isBlocked ? t('users.unblock_user_title') : t('users.block_user_title')}
          message={userToProcess.isBlocked ? t('users.unblock_user_confirm', { name: userToProcess.name }) : t('users.block_user_confirm', { name: userToProcess.name })}
          confirmText={userToProcess.isBlocked ? t('users.unblock') : t('users.block')}
        />
      )}
      {userToProcess && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          user={userToProcess}
        />
      )}
      {userToProcess && (
        <DeleteUserConfirmationModal
          isOpen={isDeleteConfirmModalOpen}
          onClose={() => setIsDeleteConfirmModalOpen(false)}
          user={userToProcess}
        />
      )}
      {userToProcess && (
        <TransferDataModal
          isOpen={isTransferConfirmOpen}
          onClose={() => setIsTransferConfirmOpen(false)}
          user={userToProcess}
          onConfirm={handleConfirmTransfer}
        />
      )}
      {userToProcess && (
        <TransferProgressModal
          isOpen={isTransferProgressOpen}
          onClose={handleCloseTransferProgress}
          user={userToProcess}
        />
      )}
    </>
  );
};

export default UsersModule;

