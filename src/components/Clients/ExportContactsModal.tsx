import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useClientStore } from '../../store/useClientStore';
import { useStore } from '../../store/useStore';
import { exportToCsv, exportToTxt } from '../../utils/export';
import { format } from 'date-fns';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Combobox from '../Common/Combobox';
import Input from '../Common/Input';
import { Copy, FileText, FileSpreadsheet } from 'lucide-react';
import { generateId } from '../../utils/id';

type ContactType = 'phone' | 'email' | 'both';
type ClientTypeFilter = 'all' | 'individual' | 'company';
type SeparatorOption = ',' | ';';

const isContactType = (value: string | null): value is ContactType =>
  value === 'phone' || value === 'email' || value === 'both';

const isClientType = (value: string | null): value is ClientTypeFilter =>
  value === 'all' || value === 'individual' || value === 'company';

const isSeparatorOption = (value: string | null): value is SeparatorOption =>
  value === ',' || value === ';';

interface ExportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportContactsModal: React.FC<ExportContactsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { clients } = useClientStore();
  const { addNotification } = useStore();

  const [contactType, setContactType] = useState<ContactType>('phone');
  const [separator, setSeparator] = useState<SeparatorOption>(',');
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientTypeFilter>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const processedData = useMemo(() => {
    const filtered = clients.filter(client => {
      const isTypeMatch = clientTypeFilter === 'all' || client.clientType === clientTypeFilter;
      
      const clientDate = new Date(client.createdAt);
      const isDateMatch = (!startDate || clientDate >= new Date(startDate)) && 
                          (!endDate || clientDate <= new Date(endDate));

      return isTypeMatch && isDateMatch;
    });

    const contacts: string[] = [];
    if (contactType === 'phone' || contactType === 'both') {
      contacts.push(...filtered.map(c => c.phone).filter(Boolean));
    }
    if (contactType === 'email' || contactType === 'both') {
      contacts.push(...filtered.map(c => c.email).filter(c => c && c.trim() !== ''));
    }

    const uniqueContacts = [...new Set(contacts)];

    return {
      contactsString: uniqueContacts.join(separator),
      csvData: filtered.map(c => ({ 
        Nome: c.name, 
        Telefone: c.phone, 
        Email: c.email || '' 
      })),
      count: uniqueContacts.length
    };
  }, [clients, contactType, separator, clientTypeFilter, startDate, endDate]);

  const handleCopy = async () => {
    if (!processedData.contactsString) return;
    
    const showSuccessNotification = () => {
      addNotification({
        id: generateId(),
        type: 'success',
        title: t('common.success'),
        message: t('clients.export.contacts_copied', { count: processedData.count }),
        read: false,
        createdAt: new Date(),
      });
    };

    const showErrorNotification = () => {
      addNotification({
        id: generateId(),
        type: 'error',
        title: t('common.error'),
        message: t('common.copy_error'),
        read: false,
        createdAt: new Date(),
      });
    };

    try {
      // Modern method
      await navigator.clipboard.writeText(processedData.contactsString);
      showSuccessNotification();
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
      // Fallback method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = processedData.contactsString;
        textArea.style.position = 'absolute';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessNotification();
      } catch (fallbackErr) {
        console.error('Failed to copy text with both methods:', fallbackErr);
        showErrorNotification();
      }
    }
  };

  const handleExportCsv = () => {
    if (processedData.csvData.length === 0) return;
    const filename = `contactos_clientes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    exportToCsv(filename, processedData.csvData, ['Nome', 'Telefone', 'Email']);
  };

  const handleExportTxt = () => {
    if (!processedData.contactsString) return;
    const filename = `contactos_${format(new Date(), 'yyyy-MM-dd')}.txt`;
    exportToTxt(filename, processedData.contactsString);
  };

  const contactTypeOptions = [
    { value: 'phone', label: t('clients.export.phones_only') },
    { value: 'email', label: t('clients.export.emails_only') },
    { value: 'both', label: t('clients.export.phones_and_emails') },
  ];

  const separatorOptions = [
    { value: ',', label: t('clients.export.comma') },
    { value: ';', label: t('clients.export.semicolon') },
  ];

  const clientTypeOptions = [
    { value: 'all', label: t('clients.export.all_types') },
    { value: 'individual', label: t('clients.individual') },
    { value: 'company', label: t('clients.company') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('clients.export.title')} size="xl">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('clients.export.filter_options')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border dark:border-neutral-800">
            <Combobox
              label={t('clients.export.filter_by_type')}
              options={clientTypeOptions}
              value={clientTypeFilter}
              onChange={(value) => {
                if (isClientType(value)) {
                  setClientTypeFilter(value);
                }
              }}
            />
            <Input
              label={t('financial.start_date')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label={t('financial.end_date')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('clients.export.export_options')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border dark:border-neutral-800">
            <Combobox
              label={t('clients.export.contact_type')}
              options={contactTypeOptions}
              value={contactType}
              onChange={(value) => {
                if (isContactType(value)) {
                  setContactType(value);
                }
              }}
            />
            <Combobox
              label={t('clients.export.separator')}
              options={separatorOptions}
              value={separator}
              onChange={(value) => {
                if (isSeparatorOption(value)) {
                  setSeparator(value);
                }
              }}
            />
          </div>
        </div>

        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
          <p className="text-lg font-semibold text-primary-800 dark:text-primary-200">
            {t('clients.export.results_found', { count: processedData.count })}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4 border-t dark:border-neutral-800">
          <Button onClick={handleCopy} icon={Copy} disabled={processedData.count === 0}>
            {t('clients.export.copy_to_clipboard')}
          </Button>
          <Button onClick={handleExportTxt} icon={FileText} variant="secondary" disabled={processedData.count === 0}>
            {t('clients.export.export_txt')}
          </Button>
          <Button onClick={handleExportCsv} icon={FileSpreadsheet} variant="secondary" disabled={processedData.csvData.length === 0}>
            {t('clients.export.export_csv')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportContactsModal;
