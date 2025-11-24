import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePurchaseStore } from '../../store/usePurchaseStore';
import { useStore } from '../../store/useStore';
import { useMaterialStore } from '../../store/useMaterialStore';
import { Plus, Search, Trash2, ShoppingBag } from 'lucide-react';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import PurchaseForm from './PurchaseForm';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ModuleDataState from '../Common/ModuleDataState';
import { useLoadMaterialsOnMount, useLoadPurchasesOnMount } from '../../hooks/useModuleLoaders';
import { TableSkeleton } from '../Common/SkeletonLoaders';

const PurchasesModule: React.FC = () => {
  const { t } = useTranslation();
  const { purchases, deletePurchase } = usePurchaseStore();
  const { materials } = useMaterialStore();
  const { currentUser, settings } = useStore();
  const {
    loading: purchasesLoading,
    error: purchasesError,
    hasLoaded: purchasesLoaded,
    reload: reloadPurchases,
  } = useLoadPurchasesOnMount();
  useLoadMaterialsOnMount();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleOpenForm = () => {
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPurchaseToDelete(id);
    setIsPasswordPromptOpen(true);
  };

  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      deletePurchase(purchaseToDelete);
    }
    setIsConfirmOpen(false);
    setPurchaseToDelete(null);
  };

  const filteredPurchases = useMemo(() => {
    return purchases
      .filter(purchase =>
        purchase.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.supplier && purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [purchases, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('purchases.title')}
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <Input
            placeholder={t('common.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={handleOpenForm} icon={Plus}>
            {!isMobile && t('purchases.new_purchase')}
          </Button>
        </div>
      </div>

      <ModuleDataState
        loading={purchasesLoading}
        hasLoaded={purchasesLoaded}
        error={purchasesError}
        onRetry={reloadPurchases}
        skeleton={<TableSkeleton rows={6} columns={isAdmin ? 6 : 5} />}
      >
        {isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPurchases.map((purchase) => {
            const material = materials.find(m => m.id === purchase.materialId);
            const unitLabel = material ? t(`materials.units.${material.unit}`) : '';
            const quantityDisplay = `${purchase.quantity}${unitLabel}`;
            return (
            <div key={purchase.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{purchase.materialName}</h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{purchase.total.toFixed(2)} {settings.currency}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('common.quantity')}: {quantityDisplay}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('materials.supplier')}: {purchase.supplier || '-'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(purchase.date).toLocaleDateString()}</p>
              </div>
              {isAdmin && (
                <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1">
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(purchase.id)} icon={Trash2} />
                </div>
              )}
            </div>
          )})}
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
              <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('materials.title')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.quantity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.total')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('materials.supplier')}</th>
                  {isAdmin && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredPurchases.length > 0 ? filteredPurchases.map((purchase) => {
                   const material = materials.find(m => m.id === purchase.materialId);
                   const unitLabel = material ? t(`materials.units.${material.unit}`) : '';
                   const quantityDisplay = `${purchase.quantity}${unitLabel}`;
                  return (
                  <tr key={purchase.id} className="hover:bg-gray-500/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(purchase.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{purchase.materialName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{quantityDisplay}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{purchase.total.toFixed(2)} {settings.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{purchase.supplier || '-'}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end">
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(purchase.id)} icon={Trash2} />
                        </div>
                      </td>
                    )}
                  </tr>
                )}) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="text-center py-10">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
                        <ShoppingBag className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('purchases.no_purchases_found')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('purchases.no_purchases_found_description')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </ModuleDataState>

      {isFormOpen && (
        <PurchaseForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
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
            title={t('purchases.delete_purchase')}
            message={t('purchases.delete_purchase_confirm')}
          />
        </>
      )}
    </div>
  );
};

export default PurchasesModule;
