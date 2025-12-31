import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useStore } from '../../store/useStore';
import { Invoice } from '../../types';
import { Search, Eye, Trash2, FileText } from 'lucide-react';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import InvoicePreviewModal from './InvoicePreviewModal';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ModuleDataState from '../Common/ModuleDataState';
import { useLoadInvoicesOnMount } from '../../hooks/useModuleLoaders';
import { TableSkeleton } from '../Common/SkeletonLoaders';

const InvoicesModule: React.FC = () => {
  const { t } = useTranslation();
  const { invoices, deleteInvoice } = useInvoiceStore();
  const { currentUser, settings } = useStore();
  const {
    loading: invoicesLoading,
    error: invoicesError,
    hasLoaded: invoicesLoaded,
    reload: reloadInvoices,
  } = useLoadInvoicesOnMount();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleOpenPreview = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteClick = (id: string) => {
    setInvoiceToDelete(id);
    setIsPasswordPromptOpen(true);
  };

  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      deleteInvoice(invoiceToDelete);
    }
    setIsConfirmOpen(false);
    setInvoiceToDelete(null);
  };

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.order?.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('invoices.title')}
        </h1>
        <div className="w-full md:w-auto">
          <Input
            placeholder={t('invoices.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
      </div>

      <ModuleDataState
        loading={invoicesLoading}
        hasLoaded={invoicesLoaded}
        error={invoicesError}
        onRetry={reloadInvoices}
        skeleton={<TableSkeleton rows={6} columns={isAdmin ? 6 : 5} />}
      >
        {isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{invoice.invoiceNumber}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{(invoice.order?.total ?? 0).toFixed(2)} {settings.currency}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.order?.clientName ?? 'N/A'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('orders.order_number')}: {invoice.order?.orderNumber ?? 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('common.date')}: {new Date(invoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1">
                <Button size="sm" variant="ghost" onClick={() => handleOpenPreview(invoice)} icon={Eye} title={t('common.view')} />
                {isAdmin && <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeleteClick(invoice.id)} icon={Trash2} title={t('common.delete')} />}
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
              <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('invoices.invoice_number')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orders.order_number')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('orders.client')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.total')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredInvoices.length > 0 ? filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-500/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.order?.orderNumber ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{invoice.order?.clientName ?? 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{(invoice.order?.total ?? 0).toFixed(2)} {settings.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        <Button size="sm" variant="ghost" onClick={() => handleOpenPreview(invoice)} icon={Eye} title={t('common.view')} />
                        {isAdmin && <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(invoice.id)} icon={Trash2} title={t('common.delete')} />}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
                        <FileText className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('invoices.no_invoices_found')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('invoices.no_invoices_found_description')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </ModuleDataState>

      {isPreviewOpen && selectedInvoice && (
        <InvoicePreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          invoice={selectedInvoice}
        />
      )}

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
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={confirmDelete}
            title={t('invoices.delete_invoice')}
            message={t('invoices.delete_invoice_confirm')}
          />
        </>
      )}
    </div>
  );
};

export default InvoicesModule;
