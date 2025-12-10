import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { Bell, LogOut, Globe, Settings, Menu, Sun, Moon } from 'lucide-react';
import NotificationPanel from '../Notifications/NotificationPanel';
import Clock from '../Common/Clock';
import SyncStatusIndicator from './SyncStatusIndicator';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import { storageService } from '../../services/storageService';
import Avatar from '../Common/Avatar';

interface HeaderProps {
  onModuleChange: (module: string) => void;
  onMobileMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ onModuleChange, onMobileMenuToggle }) => {
  const { t, i18n } = useTranslation();
  const { 
    currentUser, 
    notifications, 
    language, 
    setLanguage, 
    logout,
    impersonatingUser,
    theme,
    setTheme
  } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const avatarCache = useRef<Record<string, string>>({});

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
    setLanguage(newLanguage);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await logout();
      // Force reload to clear all state and redirect to login
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Even if logout fails, reload the page to clear state
      window.location.href = '/';
    }
  };

  const handleThemeChange = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  useEffect(() => {
    const path = currentUser?.photoUrl;
    if (!path) {
      setAvatarUrl(undefined);
      return;
    }

    // Usa URL já cacheada (persistida) para evitar atraso na renderização
    const cached = storageService.getCachedSignedUrl(path, 'profile_photos');
    if (cached) {
      avatarCache.current[path] = cached;
      setAvatarUrl(cached);
    }

    // Busca/renova URL assinada em segundo plano
    void storageService
      .getSignedUrlCached(path, 300, 'profile_photos')
      .then((url) => {
        if (avatarCache.current[path] !== url) {
          avatarCache.current[path] = url;
          setAvatarUrl(url);
        } else {
          setAvatarUrl((prev) => prev ?? url);
        }
      })
      .catch(() => {
        // Mantém a última URL conhecida para evitar flicker
        setAvatarUrl((prev) => prev ?? cached ?? path);
      });
  }, [currentUser?.photoUrl]);

  return (
    <header className="bg-white dark:bg-neutral-950/70 dark:backdrop-blur-lg border-b border-gray-200/50 dark:border-neutral-800/50 px-4 sm:px-6 py-3 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 lg:hidden"
            title={t('navigation.dashboard')}
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <img src="/logo.png" alt="ZATY GRÁFICA" className="h-8 object-contain lg:hidden" />
        </div>

        <div className="hidden lg:block">
          <Clock />
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden md:flex items-center gap-4">
            <OnlineStatusIndicator />
            <SyncStatusIndicator />
          </div>
          {/* Theme Toggle */}
          <button
            onClick={handleThemeChange}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
            title={t('settings.theme')}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => handleLanguageChange(language === 'pt' ? 'en' : 'pt')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
              title={t('settings.language')}
            >
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Notifications */}
          <div id="notifications-button" className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 relative"
              title={t('notifications.title')}
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <NotificationPanel 
                onClose={() => setShowNotifications(false)}
              />
            )}
          </div>

          {/* User Menu */}
          <div id="user-menu-button" className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800"
            >
              <Avatar
                name={currentUser?.name || 'Usuário'}
                src={currentUser?.photoUrl ? avatarUrl ?? currentUser.photoUrl : undefined}
                size="w-8 h-8"
              />
              {currentUser && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {currentUser.name}
                </span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-gray-200 dark:border-neutral-800 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {currentUser?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {currentUser?.email}
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    onModuleChange('settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('navigation.settings')}</span>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{impersonatingUser ? t('users.return_to_admin') : 'Sair'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
