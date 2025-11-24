import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useClientStore } from '../../store/useClientStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useMaterialStore } from '../../store/useMaterialStore';
import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useServiceStore } from '../../store/useServiceStore';
import { useUserStore } from '../../store/useUserStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useTaskStore } from '../../store/useTaskStore';
import { useNotesStore } from '../../store/useNotesStore';
import { useChatStore } from '../../store/useChatStore';
import { format } from 'date-fns';

import Button from '../Common/Button';
import ConfirmationModal from '../Common/ConfirmationModal';
import { Download, Upload, HardDrive } from 'lucide-react';
import { generateId } from '../../utils/id';

type StoreState = ReturnType<typeof useStore.getState>;
type ClientState = ReturnType<typeof useClientStore.getState>;
type OrderState = ReturnType<typeof useOrderStore.getState>;
type InvoiceState = ReturnType<typeof useInvoiceStore.getState>;
type EmployeeState = ReturnType<typeof useEmployeeStore.getState>;
type MaterialState = ReturnType<typeof useMaterialStore.getState>;
type PurchaseState = ReturnType<typeof usePurchaseStore.getState>;
type ServiceState = ReturnType<typeof useServiceStore.getState>;
type UserState = ReturnType<typeof useUserStore.getState>;
type FinanceState = ReturnType<typeof useFinanceStore.getState>;
type TaskState = ReturnType<typeof useTaskStore.getState>;
type NotesState = ReturnType<typeof useNotesStore.getState>;
type ChatState = ReturnType<typeof useChatStore.getState>;

type BackupData = {
  settings: StoreState['settings'];
  notifications?: StoreState['notifications'];
  auditLogs?: StoreState['auditLogs'];
  payments?: StoreState['payments'];
  clients?: ClientState['clients'];
  orders?: OrderState['orders'];
  invoices?: InvoiceState['invoices'];
  employees?: EmployeeState['employees'];
  materials?: MaterialState['materials'];
  stockMovements?: MaterialState['stockMovements'];
  purchases?: PurchaseState['purchases'];
  services?: ServiceState['services'];
  users?: UserState['users'];
  expenses?: FinanceState['expenses'];
  salaryPayments?: FinanceState['salaryPayments'];
  tasks?: TaskState['tasks'];
  notes?: NotesState['notes'];
  chatConversations?: ChatState['conversations'];
  chatMessages?: ChatState['messages'];
};

const DataSettings: React.FC = () => {
  const { t } = useTranslation();
  const { addNotification } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [backupData, setBackupData] = useState<BackupData | null>(null);

  const handleExport = () => {
    const allData: BackupData = {
      // Main store
      settings: useStore.getState().settings,
      notifications: useStore.getState().notifications,
      auditLogs: useStore.getState().auditLogs,
      payments: useStore.getState().payments,
      // Other stores
      clients: useClientStore.getState().clients,
      orders: useOrderStore.getState().orders,
      invoices: useInvoiceStore.getState().invoices,
      employees: useEmployeeStore.getState().employees,
      materials: useMaterialStore.getState().materials,
      stockMovements: useMaterialStore.getState().stockMovements,
      purchases: usePurchaseStore.getState().purchases,
      services: useServiceStore.getState().services,
      users: useUserStore.getState().users,
      expenses: useFinanceStore.getState().expenses,
      salaryPayments: useFinanceStore.getState().salaryPayments,
      tasks: useTaskStore.getState().tasks,
      notes: useNotesStore.getState().notes,
      chatConversations: useChatStore.getState().conversations,
      chatMessages: useChatStore.getState().messages,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(allData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `zaty_backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    link.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const data = JSON.parse(text) as BackupData;
            if (data?.settings) {
              setBackupData(data);
              setIsConfirmOpen(true);
            } else {
              throw new Error('Invalid backup format');
            }
          }
        } catch (error) {
          addNotification({
            id: generateId(),
            type: 'error',
            title: t('common.error'),
            message: t('settings.import_error'),
            read: false,
            createdAt: new Date(),
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const confirmImport = () => {
    if (!backupData) return;

    try {
      // Restore main store
      useStore.setState({
        settings: backupData.settings,
        notifications: backupData.notifications || [],
        auditLogs: backupData.auditLogs || [],
        payments: backupData.payments || [],
      });
      // Restore other stores
      useClientStore.setState({ clients: backupData.clients || [] });
      useOrderStore.setState({ orders: backupData.orders || [] });
      useInvoiceStore.setState({ invoices: backupData.invoices || [] });
      useEmployeeStore.setState({ employees: backupData.employees || [] });
      useMaterialStore.setState({ materials: backupData.materials || [], stockMovements: backupData.stockMovements || [] });
      usePurchaseStore.setState({ purchases: backupData.purchases || [] });
      useServiceStore.setState({ services: backupData.services || [] });
      useUserStore.setState({ users: backupData.users || [] });
      useFinanceStore.setState({ expenses: backupData.expenses || [], salaryPayments: backupData.salaryPayments || [] });
      useTaskStore.setState({ tasks: backupData.tasks || [] });
      useNotesStore.setState({ notes: backupData.notes || [] });
      useChatStore.setState({ conversations: backupData.chatConversations || [], messages: backupData.chatMessages || {} });

      addNotification({
        id: generateId(),
        type: 'success',
        title: t('common.success'),
        message: t('settings.import_success'),
        read: false,
        createdAt: new Date(),
      });

      // Reload the app to reflect changes everywhere
      setTimeout(() => window.location.reload(), 1500);

    } catch (error) {
      addNotification({
        id: generateId(),
        type: 'error',
        title: t('common.error'),
        message: t('settings.import_error'),
        read: false,
        createdAt: new Date(),
      });
    }

    setIsConfirmOpen(false);
    setBackupData(null);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="p-4 border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-r-lg">
            <div className="flex">
                <div className="flex-shrink-0">
                    <HardDrive className="h-5 w-5 text-primary-500" />
                </div>
                <div className="ml-3">
                    <h3 className="text-lg font-medium text-primary-800 dark:text-primary-200">{t('settings.backup_instructions_title')}</h3>
                    <div className="mt-2 text-sm text-primary-700 dark:text-primary-300">
                        <p>{t('settings.backup_instructions_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExport} icon={Download} variant="primary">
            {t('settings.export_backup')}
          </Button>
          <Button onClick={handleImportClick} icon={Upload} variant="secondary">
            {t('settings.import_backup')}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmImport}
        title={t('settings.import_confirm_title')}
        message={t('settings.import_confirm_message')}
      />
    </>
  );
};

export default DataSettings;
