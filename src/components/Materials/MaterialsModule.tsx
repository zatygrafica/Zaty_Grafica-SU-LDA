import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMaterialStore } from '../../store/useMaterialStore';
import { useStore } from '../../store/useStore';
import { Material } from '../../types';
import { Plus, Search, Edit, Trash2, Package, ArchiveRestore, DollarSign, ShoppingCart } from 'lucide-react';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import MaterialForm from './MaterialForm';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import SellMaterialModal from './SellMaterialModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ModuleDataState from '../Common/ModuleDataState';
import { useLoadMaterialsOnMount } from '../../hooks/useModuleLoaders';
import { TableSkeleton } from '../Common/SkeletonLoaders';

const MaterialsModule: React.FC = () => {
  const { t } = useTranslation();
  const { materials, deleteMaterial, zeroStock } = useMaterialStore();
  const { currentUser, settings } = useStore();
  const {
    loading: materialsLoading,
    error: materialsError,
    hasLoaded: materialsLoaded,
    reload: reloadMaterials,
  } = useLoadMaterialsOnMount();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [materialToProcess, setMaterialToProcess] = useState<string | null>(null);
  const [materialToSell, setMaterialToSell] = useState<Material | null>(null);
  const [actionToConfirm, setActionToConfirm] = useState<'delete' | 'zeroStock' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedRole = currentUser?.role?.toLowerCase();
  const canManageMaterials =
    ['admin', 'manager', 'administrador', 'user'].includes(normalizedRole ?? '') ||
    currentUser?.permissions?.includes('materials:manage') ||
    currentUser?.permissions?.includes('admin');
  const isMobile = useMediaQuery('(max-width: 767px)');

  const handleOpenForm = (material: Material | null = null) => {
    setSelectedMaterial(material);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setMaterialToProcess(id);
    setActionToConfirm('delete');
    setIsPasswordPromptOpen(true);
  };

  const handleZeroStockClick = (id: string) => {
    setMaterialToProcess(id);
    setActionToConfirm('zeroStock');
    setIsPasswordPromptOpen(true);
  };

  const handleSellClick = (material: Material) => {
    setMaterialToSell(material);
    setIsSellModalOpen(true);
  };

  const proceedToConfirm = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (materialToProcess) {
      if (actionToConfirm === 'delete') {
        deleteMaterial(materialToProcess);
      } else if (actionToConfirm === 'zeroStock') {
        zeroStock(materialToProcess);
      }
    }
    setIsConfirmOpen(false);
    setMaterialToProcess(null);
    setActionToConfirm(null);
  };

  const filteredMaterials = useMemo(() => {
    return materials
      .filter(material =>
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (material.supplier && material.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [materials, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('materials.title')}
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <Input
            placeholder={t('common.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          {canManageMaterials && (
            <Button onClick={() => handleOpenForm()} icon={Plus}>
              {!isMobile && t('materials.new_material')}
            </Button>
          )}
        </div>
      </div>

      <ModuleDataState
        loading={materialsLoading}
        hasLoaded={materialsLoaded}
        error={materialsError}
        onRetry={reloadMaterials}
        skeleton={<TableSkeleton rows={6} columns={canManageMaterials ? 6 : 5} />}
      >
        {isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {material.isSellable && <DollarSign className="w-4 h-4 text-green-500" title="Vendável" />}
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{material.name}</h3>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('materials.stock')}:{' '}
                    <span className={`font-semibold ${material.currentStock < 10 ? 'text-red-500' : 'text-gray-800 dark:text-gray-200'}`}>
                      {material.currentStock.toFixed(2)}
                    </span>{' '}
                    {t(`materials.units.${material.unit}`)}
                    {material.unit === 'meter' && material.defaultWidth ? (
                      <span className="text-xs ml-1"> (Larg: {material.defaultWidth.toFixed(2)}m)</span>
                    ) : null}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('materials.price_per_unit')}: <span className="font-semibold text-gray-800 dark:text-gray-200">{material.pricePerUnit.toFixed(2)} {settings.currency}</span>
                  </p>
                  {material.isSellable && material.sellingPrice && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('materials.selling_price')}: <span className="font-semibold text-gray-800 dark:text-gray-200">{material.sellingPrice.toFixed(2)} {settings.currency}</span>
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('materials.supplier')}: {material.supplier || '-'}</p>
                </div>
              </div>
              {canManageMaterials && (
                <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1 flex-wrap gap-1">
                  {material.isSellable && <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleSellClick(material)} icon={ShoppingCart} title={t('materials.sell_material')} />}
                  <Button size="sm" variant="ghost" className="text-yellow-600 hover:text-yellow-700" onClick={() => handleZeroStockClick(material.id)} icon={ArchiveRestore} title={t('materials.zero_stock')} />
                  <Button size="sm" variant="ghost" onClick={() => handleOpenForm(material)} icon={Edit} title={t('common.edit')} />
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(material.id)} icon={Trash2} title={t('common.delete')} />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('materials.stock')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('materials.price_per_unit')} (Custo)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('materials.selling_price')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('materials.supplier')}</th>
                  {canManageMaterials && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredMaterials.length > 0 ? filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-500/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      <div className="flex items-center gap-2">
                        {material.isSellable && <DollarSign className="w-4 h-4 text-green-500" title="Vendável" />}
                        <span>{material.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <span className={`font-semibold ${material.currentStock < 10 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {material.currentStock.toFixed(2)}
                      </span> {t(`materials.units.${material.unit}`)}
                      {material.unit === 'meter' && material.defaultWidth && (
                        <span className="text-xs ml-1 text-gray-400">(Larg: {material.defaultWidth.toFixed(2)}m)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{material.pricePerUnit.toFixed(2)} {settings.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                      {material.isSellable && material.sellingPrice ? `${material.sellingPrice.toFixed(2)} ${settings.currency}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{material.supplier || '-'}</td>
                    {canManageMaterials && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                  {material.isSellable && (
                    <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleSellClick(material)} icon={ShoppingCart} title={t('materials.sell_material')} />
                  )}
                          <Button size="sm" variant="ghost" className="text-yellow-600 hover:text-yellow-700" onClick={() => handleZeroStockClick(material.id)} icon={ArchiveRestore} title={t('materials.zero_stock')} />
                          <Button size="sm" variant="ghost" onClick={() => handleOpenForm(material)} icon={Edit} title={t('common.edit')} />
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(material.id)} icon={Trash2} title={t('common.delete')} />
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={canManageMaterials ? 6 : 5} className="text-center py-10">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('materials.no_materials_found')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('materials.no_materials_found_description')}</p>
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
        <MaterialForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          material={selectedMaterial}
        />
      )}

      {isSellModalOpen && materialToSell && (
        <SellMaterialModal
          isOpen={isSellModalOpen}
          onClose={() => setIsSellModalOpen(false)}
          material={materialToSell}
        />
      )}

      {canManageMaterials && (
        <>
          <PasswordPromptModal
            isOpen={isPasswordPromptOpen}
            onClose={() => setIsPasswordPromptOpen(false)}
            onSuccess={proceedToConfirm}
            passwordToMatch={settings.deletionPassword || ''}
            title={t('security.deletion_password_prompt_title')}
            message={t('security.deletion_password_prompt_message')}
          />
          <ConfirmationModal
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirm}
            title={actionToConfirm === 'delete' ? t('materials.delete_material') : t('materials.zero_stock')}
            message={actionToConfirm === 'delete' ? t('materials.delete_material_confirm') : t('materials.zero_stock_confirm')}
            confirmText={actionToConfirm === 'zeroStock' ? t('materials.zero_stock') : t('common.delete')}
          />
        </>
      )}
    </div>
  );
};

export default MaterialsModule;
