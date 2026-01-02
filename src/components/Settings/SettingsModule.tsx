import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Moon, 
  Sun, 
  Globe, 
  RotateCcw,
  Bell,
  Shield,
  Database,
  HelpCircle,
  User,
  Info,
  Palette,
  Calculator,
  Building,
  Cpu,
  Keyboard
} from 'lucide-react';
import Button from '../Common/Button';
import Input from '../Common/Input';
import NotificationsSettings from './NotificationsSettings';
import PasswordConfirmationModal from '../Common/PasswordConfirmationModal';
import MyProfileSettings from './MyProfileSettings';
import IntelligentCalculator from './IntelligentCalculator';
import PasswordStrengthMeter from '../Users/PasswordStrengthMeter';
import DataSettings from './DataSettings';
import AboutSettings from './AboutSettings';
import SecuritySettings from './SecuritySettings';
import { generateId } from '../../utils/id';
import { useSettingsStore } from '../../store/useSettingsStore';

interface SupportFormData {
  phone: string;
  email: string;
  link: string;
}

interface CompanyFormData {
  name: string;
  address: string;
  nuit: string;
  phone: string;
}

const SettingsModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    currentUser, 
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    settings, 
    updateSetting,
    addNotification,
    enablePendingServicesPopup,
    setSettings,
  } = useStore();
  const { loadSettings } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetDeletionPasswordConfirmOpen, setIsResetDeletionPasswordConfirmOpen] = useState(false);
  const [newDeletionPassword, setNewDeletionPassword] = useState('');
  const [confirmNewDeletionPassword, setConfirmNewDeletionPassword] = useState('');

  // Security: Idle Timeout State
  const [idleTimeout, setIdleTimeout] = useState<number>(() => {
    const saved = localStorage.getItem('security_idle_timeout');
    return saved ? parseInt(saved, 10) : 3 * 60 * 1000; // Default: 3 minutes
  });

  const isAdmin = currentUser?.role === 'admin';

  React.useEffect(() => {
    void loadSettings(true)
      .then((loaded) => {
        setSettings(loaded);
        if (loaded.theme) {
          setTheme(loaded.theme);
        }
        if (loaded.language) {
          i18n.changeLanguage(loaded.language);
          setLanguage(loaded.language);
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar configurações', err);
      });
  }, [loadSettings, setSettings, setTheme, setLanguage, i18n]);

  const allTabs = [
    { id: 'profile', label: t('settings.my_profile'), icon: User, adminOnly: false },
    { id: 'appearance', label: t('settings.appearance'), icon: Palette, adminOnly: false },
    { id: 'company', label: t('settings.company_info'), icon: Building, adminOnly: true },
    { id: 'general', label: t('settings.general'), icon: Info, adminOnly: true },
    { id: 'security', label: t('settings.security'), icon: Shield, adminOnly: true },
    { id: 'data', label: t('settings.data'), icon: Database, adminOnly: true },
    { id: 'financial', label: t('settings.financial'), icon: Database, adminOnly: true },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell, adminOnly: true },
    { id: 'calculator', label: t('settings.calculator'), icon: Calculator, adminOnly: false },
    { id: 'shortcuts', label: t('settings.keyboard_shortcuts'), icon: Keyboard, adminOnly: false },
    { id: 'support', label: t('settings.support'), icon: HelpCircle, adminOnly: false },
    { id: 'system_info', label: t('settings.system_info'), icon: Cpu, adminOnly: false },
  ];

  const visibleTabs = allTabs.filter(tab => !tab.adminOnly || isAdmin);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  const supportSchema = yup.object().shape({
    phone: yup.string().optional(),
    email: yup.string().email('Formato de e-mail inválido').optional(),
    link: yup.string().url('URL inválida').optional(),
  });

  const { register: registerSupport, handleSubmit: handleSupportSubmit, formState: { errors: supportErrors }, reset: resetSupportForm } = useForm<SupportFormData>({
    resolver: yupResolver(supportSchema),
    defaultValues: {
      phone: settings.support?.phone || '',
      email: settings.support?.email || '',
      link: settings.support?.link || '',
    }
  });

  const onSupportSubmit = (data: SupportFormData) => {
    updateSetting('support', data);
    addNotification({
      id: generateId(),
      type: 'success',
      title: 'Sucesso',
      message: 'Informações de suporte atualizadas!',
      read: false,
      createdAt: new Date(),
    });
    resetSupportForm({ phone: '', email: '', link: '' });
  };
  
  const handleResetPreferences = () => {
    setTheme('light');
    setLanguage('pt');
    enablePendingServicesPopup();
  };

  const handleResetDeletionPassword = () => {
    if (!newDeletionPassword || newDeletionPassword.length < 6) {
      addNotification({ id: generateId(), type: 'error', title: t('common.error'), message: 'A nova senha deve ter pelo menos 6 caracteres.', read: false, createdAt: new Date() });
      return;
    }
    if (newDeletionPassword !== confirmNewDeletionPassword) {
      addNotification({ id: generateId(), type: 'error', title: t('common.error'), message: t('security.passwords_do_not_match'), read: false, createdAt: new Date() });
      return;
    }
    setIsResetDeletionPasswordConfirmOpen(true);
  };

  const confirmResetDeletionPassword = () => {
    updateSetting('deletionPassword', newDeletionPassword);
    addNotification({ id: generateId(), type: 'success', title: t('common.success'), message: t('security.deletion_password_updated'), read: false, createdAt: new Date() });
    setNewDeletionPassword('');
    setConfirmNewDeletionPassword('');
    setIsResetDeletionPasswordConfirmOpen(false);
  };

  const companySchema = yup.object().shape({
    name: yup.string().required('O nome da empresa é obrigatório'),
    address: yup.string().required('O endereço é obrigatório'),
    nuit: yup.string().required('O NUIT é obrigatório'),
    phone: yup.string().required('O telefone é obrigatório'),
  });

  const { register: registerCompany, handleSubmit: handleCompanySubmit, formState: { errors: companyErrors } } = useForm<CompanyFormData>({
    resolver: yupResolver(companySchema),
    defaultValues: {
      name: settings.company?.name || '',
      address: settings.company?.address || '',
      nuit: settings.company?.nuit || '',
      phone: settings.company?.phone || '',
    }
  });

  const onCompanySubmit = (data: CompanyFormData) => {
    updateSetting('company', data);
    addNotification({
      id: generateId(),
      type: 'success',
      title: t('common.success'),
      message: 'Informações da empresa atualizadas!',
      read: false,
      createdAt: new Date(),
    });
  };

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.theme')}</h3>
        <div className="flex items-center space-x-4">
          <Button variant={theme === 'light' ? 'primary' : 'secondary'} onClick={() => handleThemeChange('light')} icon={Sun}>{t('settings.light')}</Button>
          <Button variant={theme === 'dark' ? 'primary' : 'secondary'} onClick={() => handleThemeChange('dark')} icon={Moon}>{t('settings.dark')}</Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.language')}</h3>
        <div className="flex items-center space-x-4">
          <Button variant={language === 'pt' ? 'primary' : 'secondary'} onClick={() => handleLanguageChange('pt')} icon={Globe}>Português</Button>
          <Button variant={language === 'en' ? 'primary' : 'secondary'} onClick={() => handleLanguageChange('en')} icon={Globe}>English</Button>
        </div>
      </div>
    </div>
  );

  const renderCompanySettings = () => (
    <form onSubmit={handleCompanySubmit(onCompanySubmit)} className="space-y-4 max-w-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('settings.company_info')}</h3>
      <Input label={t('common.name')} {...registerCompany('name')} error={companyErrors.name?.message} />
      <Input label={t('common.address')} {...registerCompany('address')} error={companyErrors.address?.message} />
      <Input label={t('common.nuit')} {...registerCompany('nuit')} error={companyErrors.nuit?.message} />
      <Input label={t('common.phone')} {...registerCompany('phone')} error={companyErrors.phone?.message} />
      <div className="pt-4">
        <Button type="submit">{t('common.save')}</Button>
      </div>
    </form>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Input label={t('settings.timezone')} value={settings.timezone || 'Africa/Maputo'} onChange={(e) => updateSetting('timezone', e.target.value)} />
      <Input label={t('settings.currency')} value={settings.currency || 'MZN'} onChange={(e) => updateSetting('currency', e.target.value)} />
      <div className="pt-4">
        <Button variant="danger" icon={RotateCcw} onClick={() => setIsResetConfirmOpen(true)}>
          {t('settings.reset_preferences')}
        </Button>
      </div>
    </div>
  );

  const handleIdleTimeoutChange = (timeout: number) => {
    setIdleTimeout(timeout);
    // localStorage is already set in SecuritySettings component
    // Trigger a custom event to notify App.tsx (in addition to storage event)
    window.dispatchEvent(new CustomEvent('idle-timeout-changed', { detail: timeout }));
  };

  const renderSecuritySettings = () => (
    <div className="space-y-8">
      {/* Idle Timeout Configuration */}
      <SecuritySettings
        idleTimeout={idleTimeout}
        onIdleTimeoutChange={handleIdleTimeoutChange}
      />

      {/* Deletion Password */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('security.reset_deletion_password')}</h3>
        <div className="space-y-4 max-w-md mt-4">
          <Input
            label={t('security.new_deletion_password')}
            type="password"
            value={newDeletionPassword}
            onChange={(e) => setNewDeletionPassword(e.target.value)}
          />
          <Input
            label={t('security.confirm_new_deletion_password')}
            type="password"
            value={confirmNewDeletionPassword}
            onChange={(e) => setConfirmNewDeletionPassword(e.target.value)}
          />
          <PasswordStrengthMeter password={newDeletionPassword} />
        </div>
        <Button onClick={handleResetDeletionPassword} className="mt-4">{t('common.save')}</Button>
      </div>
    </div>
  );

  const renderFinancialSettings = () => (
    <div className="space-y-6">
      <Input label={t('settings.vat_rate')} type="number" value={settings.vatRate || 17} onChange={(e) => updateSetting('vatRate', parseFloat(e.target.value) || 0)} />
    </div>
  );

  const renderNotificationsSettings = () => (
    <NotificationsSettings />
  );

  const renderShortcutsSettings = () => {
    const shortcuts = [
      { keys: ['Alt', 'D'], description: t('navigation.dashboard') },
      { keys: ['Alt', 'O'], description: t('navigation.orders') },
      { keys: ['Alt', 'I'], description: t('navigation.invoices') },
      { keys: ['Alt', 'C'], description: t('navigation.clients') },
      { keys: ['Alt', 'E'], description: t('navigation.employees') },
      { keys: ['Alt', 'M'], description: t('navigation.materials') },
      { keys: ['Alt', 'P'], description: t('navigation.purchases') },
      { keys: ['Alt', 'F'], description: t('navigation.financial') },
      { keys: ['Alt', 'S'], description: t('navigation.settings') },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('settings.keyboard_shortcuts')}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('settings.keyboard_shortcuts_desc')}
        </p>
        <div className="space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-lg">
              <span className="text-gray-800 dark:text-gray-200 font-medium">{shortcut.description}</span>
              <div className="flex items-center space-x-1">
                {shortcut.keys.map(key => (
                  <kbd key={key} className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 border border-gray-300 dark:border-neutral-600 rounded-md">
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSupportSettings = () => {
    if (isAdmin) {
      return (
        <form onSubmit={handleSupportSubmit(onSupportSubmit)} className="space-y-4">
          <Input label="Telefone de Suporte" {...registerSupport('phone')} error={supportErrors.phone?.message} />
          <Input label="Email de Suporte" type="email" {...registerSupport('email')} error={supportErrors.email?.message} />
          <Input label="Link de Ajuda" {...registerSupport('link')} error={supportErrors.link?.message} />
          <div className="pt-4">
            <Button type="submit">{t('common.save')}</Button>
          </div>
        </form>
      );
    }
    return (
      <div className="space-y-3 text-sm">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Informações de Suporte</h3>
        {settings.support?.phone && <p><strong>Telefone:</strong> {settings.support.phone}</p>}
        {settings.support?.email && <p><strong>Email:</strong> {settings.support.email}</p>}
        {settings.support?.link && <p><strong>Link:</strong> <a href={settings.support.link} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">{settings.support.link}</a></p>}
        {!settings.support?.phone && !settings.support?.email && !settings.support?.link && (
          <p className="text-gray-500">Nenhuma informação de suporte configurada.</p>
        )}
      </div>
    );
  };

  const renderSystemInfo = () => <AboutSettings />;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <MyProfileSettings />;
      case 'appearance': return renderAppearanceSettings();
      case 'company': return isAdmin ? renderCompanySettings() : null;
      case 'general': return isAdmin ? renderGeneralSettings() : null;
      case 'security': return isAdmin ? renderSecuritySettings() : null;
      case 'data': return isAdmin ? <DataSettings /> : null;
      case 'financial': return isAdmin ? renderFinancialSettings() : null;
      case 'notifications': return isAdmin ? renderNotificationsSettings() : null;
      case 'calculator': return <IntelligentCalculator />;
      case 'shortcuts': return renderShortcutsSettings();
      case 'support': return renderSupportSettings();
      case 'system_info': return renderSystemInfo();
      default: return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100/80 dark:bg-neutral-800/80 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      {isAdmin && (
        <>
          <PasswordConfirmationModal
            isOpen={isResetConfirmOpen}
            onClose={() => setIsResetConfirmOpen(false)}
            onConfirm={handleResetPreferences}
            title={t('settings.reset_preferences')}
            message="Esta ação irá restaurar as configurações de tema, idioma e notificações para o padrão. Digite sua senha para confirmar."
          />
          <PasswordConfirmationModal
            isOpen={isResetDeletionPasswordConfirmOpen}
            onClose={() => setIsResetDeletionPasswordConfirmOpen(false)}
            onConfirm={confirmResetDeletionPassword}
            title={t('security.reset_deletion_password_confirm_title')}
            message={t('security.reset_deletion_password_confirm_message')}
          />
        </>
      )}
    </>
  );
};

export default SettingsModule;
