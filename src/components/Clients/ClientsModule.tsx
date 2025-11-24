import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useClientStore } from '../../store/useClientStore';
import { useOrderStore } from '../../store/useOrderStore';
import { Client } from '../../types';
import {
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Info, 
  Copy, 
  Building2, 
  User as UserIcon,
  Phone,
  Mail,
  ArrowRightLeft,
  ClipboardList,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import ClientProfileModal from './ClientInfoModal';
import ClientForm from './ClientForm';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ExportContactsModal from './ExportContactsModal';
import ModuleDataState from '../Common/ModuleDataState';
import { CardGridSkeleton } from '../Common/SkeletonLoaders';
import { useLoadClientsOnMount, useLoadOrdersOnMount } from '../../hooks/useModuleLoaders';
import { generateId } from '../../utils/id';

const ClientsModule: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, addNotification, settings } = useStore();
  const { clients, deleteClient } = useClientStore();
  const { orders } = useOrderStore();
  const {
    loading: clientsLoading,
    error: clientsError,
    hasLoaded: clientsLoaded,
    reload: reloadClients,
  } = useLoadClientsOnMount();
  useLoadOrdersOnMount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientForProfile, setClientForProfile] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');

  const ordersByClient = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(order => {
      map.set(order.clientId, (map.get(order.clientId) || 0) + 1);
    });
    return map;
  }, [orders]);

  const filteredClients = useMemo(() => {
    return clients
      .filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients, searchTerm]);

  const handleOpenModal = (client: Client | null = null) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  const handleOpenProfileModal = (client: Client) => {
    setClientForProfile(client);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setClientForProfile(null);
  };

  const handleCopyPhone = async (phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      addNotification({
        id: generateId(),
        type: 'success',
        title: t('common.success'),
        message: t('clients.phone_copied_success'),
        read: false,
        createdAt: new Date(),
      });
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = phone;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        addNotification({
          id: generateId(),
          type: 'success',
          title: t('common.success'),
          message: t('clients.phone_copied_success'),
          read: false,
          createdAt: new Date(),
        });
      } catch (fallbackErr) {
        console.error('Failed to copy text with both methods:', fallbackErr);
        addNotification({
          id: generateId(),
          type: 'error',
          title: t('common.error'),
          message: t('common.copy_error'),
          read: false,
          createdAt: new Date(),
        });
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setIsPasswordPromptOpen(true);
  };

  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      await deleteClient(clientToDelete);
    }
    setIsConfirmModalOpen(false);
    setClientToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('clients.title')}
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <Input
            placeholder={t('common.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={() => setIsExportModalOpen(true)} icon={ClipboardList} variant="secondary">
            {!isMobile && t('clients.export_contacts')}
          </Button>
          <Button onClick={() => handleOpenModal()} icon={Plus}>
            {!isMobile && t('clients.new_client')}
          </Button>
        </div>
      </div>

      <ModuleDataState
        loading={clientsLoading}
        hasLoaded={clientsLoaded}
        error={clientsError}
        onRetry={reloadClients}
        skeleton={<CardGridSkeleton cards={8} />}
      >
        {filteredClients.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClients.map((client) => {
              const clientOrdersCount = ordersByClient.get(client.id) || 0;
              return (
                <div key={client.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100/50 dark:bg-neutral-800/50 rounded-full">
                      {client.clientType === 'company' ? <Building2 className="w-5 h-5 text-primary-600 dark:text-primary-400" /> : <UserIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={client.name}>{client.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t(`clients.${client.clientType}`)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleOpenProfileModal(client)} icon={Info} title={t('clients.client_details')} />
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{client.phone}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyPhone(client.phone)} icon={Copy} title={t('common.copy')} className="ml-auto" />
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span className="truncate">{client.email || '-'}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <ShoppingCart className="w-4 h-4 mr-3 flex-shrink-0" />
                    <span>{t('clients.total_orders')}: {clientOrdersCount}</span>
                  </div>
                  {client.transferredFrom && (
                    <div className="flex items-center text-blue-500 text-xs mt-1 pt-2 border-t border-gray-200/20 dark:border-neutral-800/50">
                      <ArrowRightLeft className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span>
                        {t('users.transferred_from', {
                          name: client.transferredFrom,
                          date: format(new Date(client.transferredAt!), 'dd/MM/yyyy', { locale: pt })
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200/20 dark:border-neutral-800/50 flex items-center justify-end space-x-1">
                <Button size="sm" variant="ghost" onClick={() => handleOpenModal(client)} icon={Edit} title={t('common.edit')} />
                {isAdmin && (
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(client.id)} icon={Trash2} title={t('common.delete')} />
                )}
              </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
            <Users className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">{t('clients.no_clients_found')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('clients.no_clients_found_description')}</p>
        </div>
      )}
      </ModuleDataState>

      <ClientForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />

      <ExportContactsModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {isAdmin && (
        <>
          <PasswordPromptModal
            isOpen={isPasswordPromptOpen}
            onClose={() => setIsPasswordPromptOpen(false)}
            onSuccess={proceedToDelete}
            passwordToMatch={settings.deletionPassword || ''}
            title={t('security.deletion_password_prompt_title')}
            message={t('security.deletion_password_prompt_message')}
          />
          <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title={t('clients.delete_client')}
            message={t('clients.delete_client_confirm')}
          />
        </>
      )}

      {clientForProfile && (
        <ClientProfileModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          client={clientForProfile}
        />
      )}
    </div>
  );
};

export default ClientsModule;
