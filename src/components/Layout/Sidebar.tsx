import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Users as UsersIcon, 
  UserCheck, 
  Package, 
  Wrench, 
  DollarSign, 
  FileEdit, 
  Settings, 
  BarChart3,
  ShoppingBag,
  CreditCard,
  ClipboardCheck,
  StickyNote,
  MessageCircle,
  DownloadCloud,
  X,
  BookUser
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarToggleIcon from './SidebarToggleIcon';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
}

interface MenuItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  adminOnly?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange, isMobileMenuOpen, setIsMobileMenuOpen, canInstallPWA, onInstallPWA }) => {
  const { t } = useTranslation();
  const { sidebarCollapsed, setSidebarCollapsed, currentUser } = useStore();

  const mainMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('navigation.dashboard'), shortcut: 'D' },
    { id: 'chat', icon: MessageCircle, label: t('navigation.chat'), shortcut: 'H' },
    { id: 'orders', icon: ShoppingCart, label: t('navigation.orders'), shortcut: 'O' },
    { id: 'invoices', icon: FileText, label: t('navigation.invoices'), shortcut: 'I' },
    { id: 'payments', icon: CreditCard, label: t('navigation.payments') },
    { id: 'clients', icon: UsersIcon, label: t('navigation.clients'), shortcut: 'C' },
    { id: 'employees', icon: UserCheck, label: t('navigation.employees'), shortcut: 'E' },
    { id: 'materials', icon: Package, label: t('navigation.materials'), shortcut: 'M' },
    { id: 'purchases', icon: ShoppingBag, label: t('navigation.purchases'), shortcut: 'P' },
    { id: 'services', icon: Wrench, label: t('navigation.services') },
    { id: 'financial', icon: DollarSign, label: t('navigation.financial'), shortcut: 'F' },
    { id: 'documents', icon: FileEdit, label: t('navigation.documents') },
    { id: 'tasks', icon: ClipboardCheck, label: t('navigation.tasks'), shortcut: 'T' },
    { id: 'quick_notes', icon: StickyNote, label: t('navigation.quick_notes'), shortcut: 'N' },
  ];

  const footerMenuItems = [
    { id: 'users', icon: UsersIcon, label: t('navigation.users'), adminOnly: true },
    { id: 'reports', icon: BarChart3, label: t('navigation.reports'), adminOnly: true },
    { id: 'audit', icon: BookUser, label: t('settings.audit'), adminOnly: true },
    { id: 'settings', icon: Settings, label: t('navigation.settings'), adminOnly: false, shortcut: 'S' },
  ];

  const isAdmin = currentUser?.role === 'admin';

  const handleModuleChange = (module: string) => {
    onModuleChange(module);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  const renderMenuItem = (item: MenuItem, isMobile: boolean) => {
    const Icon = item.icon;
    const isActive = activeModule === item.id;
    
    if (item.adminOnly && !isAdmin) {
      return null;
    }
    
    if (item.id === 'install' && !canInstallPWA) {
      return null;
    }

    const tooltipText = sidebarCollapsed && !isMobile
        ? item.label
        : undefined;

    return (
      <li key={item.id}>
        <button
          onClick={() => item.id === 'install' ? onInstallPWA() : handleModuleChange(item.id)}
          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
            isActive
              ? 'bg-primary-100/80 dark:bg-neutral-800/80 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-500/10 dark:hover:bg-neutral-800/50'
          } ${sidebarCollapsed && !isMobile && 'justify-center'}`}
          title={tooltipText}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          {(!sidebarCollapsed || isMobile) && (
            <span className="truncate ml-3 flex-1 text-left">
              {item.label}
            </span>
          )}
        </button>
      </li>
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="bg-white dark:bg-neutral-950/70 dark:backdrop-blur-lg border-r border-gray-200/50 dark:border-neutral-800/50 h-full w-full flex flex-col">
      {/* Header */}
      <div className={`p-4 h-[65px] border-b border-gray-200/50 dark:border-neutral-800/50 flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center' : 'justify-between'}`}>
        {/* EXPANDED & MOBILE: Show full logo and collapse/close button */}
        {(!sidebarCollapsed || isMobile) && (
          <>
            <div className="flex items-center flex-1 min-w-0 overflow-hidden">
              <img src="/logo.png" alt="ZATY GRÁFICA" className="h-10 object-contain" />
            </div>
            <button
              onClick={() => isMobile ? setIsMobileMenuOpen(false) : setSidebarCollapsed(true)}
              className="p-1 rounded-lg hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
              title={isMobile ? t('common.close') : t('navigation.collapse_sidebar')}
            >
              {isMobile ? <X className="text-gray-500 w-5 h-5" /> : <SidebarToggleIcon isCollapsed={sidebarCollapsed} className="text-gray-500" />}
            </button>
          </>
        )}

        {/* COLLAPSED DESKTOP: Show icon */}
        {sidebarCollapsed && !isMobile && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="group w-12 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100/50 dark:hover:bg-neutral-800/50"
            title={t('navigation.expand_sidebar')}
          >
            <img 
              src="/icon.png" 
              alt="Icon" 
              className="h-8 w-8 object-contain group-hover:hidden" 
            />
            <SidebarToggleIcon 
              isCollapsed={true} 
              className="hidden group-hover:block text-gray-500"
            />
          </button>
        )}
      </div>

      {/* Main Menu */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {mainMenuItems.map(item => renderMenuItem(item, isMobile))}
        </ul>
      </nav>

      {/* Footer Menu */}
      <div className="p-2 mt-auto border-t border-gray-200/50 dark:border-neutral-800/50">
        <ul className="space-y-1">
          {canInstallPWA && renderMenuItem({ id: 'install', icon: DownloadCloud, label: t('pwa.install_app'), adminOnly: false }, isMobile)}
          {footerMenuItems.map(item => renderMenuItem(item, isMobile))}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        id="app-sidebar"
        initial={false}
        animate={{ width: sidebarCollapsed ? 68 : 226 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="hidden lg:flex flex-shrink-0"
      >
        <SidebarContent />
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed top-0 left-0 h-full w-80 z-50 lg:hidden"
            >
              <SidebarContent isMobile={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
