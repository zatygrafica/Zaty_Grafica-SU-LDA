import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import Switch from '../Common/Switch';
import Combobox from '../Common/Combobox';

const NotificationsSettings: React.FC = () => {
  const { t } = useTranslation();
  const {
    pendingServicesPopupDisabled,
    disablePendingServicesPopup,
    enablePendingServicesPopup,
    settings,
    updateSetting,
  } = useStore();
  
  const handlePopupToggle = (enabled: boolean) => {
    if (!enabled) {
      disablePendingServicesPopup();
    } else {
      enablePendingServicesPopup();
    }
  };

  const handleFrequencyChange = (value: string | null) => {
    if (value) {
      updateSetting('popupFrequency', parseInt(value, 10));
    }
  };

  const frequencyOptions = [
    { value: '15', label: '15 Minutos' },
    { value: '30', label: '30 Minutos' },
    { value: '60', label: '60 Minutos' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.notifications')}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.enable_popup')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ativa o alerta de serviços pendentes.</p>
            </div>
            <Switch
              checked={!pendingServicesPopupDisabled}
              onChange={handlePopupToggle}
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.popup_frequency')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Define a frequência do alerta.</p>
            </div>
            <div className="w-40">
              <Combobox
                options={frequencyOptions}
                value={String(settings.popupFrequency || 15)}
                onChange={handleFrequencyChange}
                disabled={pendingServicesPopupDisabled}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('settings.email_notifications')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.email_notifications_description')}</p>
            </div>
            <Switch
              checked={settings.emailNotificationsEnabled || false}
              onChange={(checked) => updateSetting('emailNotificationsEnabled', checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsSettings;
