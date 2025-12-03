import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useServiceStore } from '../../store/useServiceStore';
import { useStore } from '../../store/useStore';
import { Service } from '../../types';
import { Plus, Search, Edit, Trash2, Wrench, Layers, Box } from 'lucide-react';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import ServiceForm from './ServiceForm';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ModuleDataState from '../Common/ModuleDataState';
import { useLoadServicesOnMount } from '../../hooks/useModuleLoaders';
import { CardGridSkeleton } from '../Common/SkeletonLoaders';

const ServicesModule: React.FC = () => {
  const { t } = useTranslation();
  const { services, deleteService } = useServiceStore();
  const { currentUser, settings } = useStore();
  const {
    loading: servicesLoading,
    error: servicesError,
    hasLoaded: servicesLoaded,
    reload: reloadServices,
  } = useLoadServicesOnMount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');

  const filteredServices = useMemo(() => {
    return services
      .filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services, searchTerm]);

  const handleOpenModal = (service: Service | null = null) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    setIsPasswordPromptOpen(true);
  };

  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      await deleteService(serviceToDelete);
    }
    setIsConfirmModalOpen(false);
    setServiceToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('navigation.services')}
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <Input
            placeholder={t('common.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={() => handleOpenModal()} icon={Plus}>
            {!isMobile && t('services.new_service')}
          </Button>
        </div>
      </div>

      <ModuleDataState
        loading={servicesLoading}
        hasLoaded={servicesLoaded}
        error={servicesError}
        onRetry={reloadServices}
        skeleton={<CardGridSkeleton cards={6} />}
      >
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
            <div 
              key={service.id} 
              className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-full">
                      <Wrench className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate" title={service.name}>{service.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {service.unit === 'meter'
                          ? `${service.basePrice.toFixed(2)} ${settings.currency} / m²`
                          : `${service.basePrice.toFixed(2)} ${settings.currency} / ${t(`materials.units.${service.unit}`)}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600 dark:text-gray-400 line-clamp-2 h-10">{service.description || 'Sem descrição.'}</p>
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pt-2">
                    {service.variations && service.variations.length > 0 && (
                      <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> {service.variations.length} variações de preço</span>
                    )}
                    {service.materialsUsed && service.materialsUsed.length > 0 && (
                      <span className="flex items-center gap-1.5"><Box className="w-3 h-3" /> {service.materialsUsed.length} materiais consumidos</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800 flex items-center justify-end space-x-1">
                <Button size="sm" variant="ghost" onClick={() => handleOpenModal(service)} icon={Edit} title={t('common.edit')} />
                {isAdmin && (
                  <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteClick(service.id)} icon={Trash2} title={t('common.delete')} />
                )}
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
              <Wrench className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">{t('services.no_services_found')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('services.no_services_found_description')}</p>
          </div>
        )}
      </ModuleDataState>

      {isModalOpen && (
        <ServiceForm
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          service={selectedService}
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
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title={t('services.delete_service')}
            message={t('services.delete_service_confirm')}
          />
        </>
      )}
    </div>
  );
};

export default ServicesModule;
