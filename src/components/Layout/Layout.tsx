import React, { useState, useEffect, Suspense, lazy } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ImpersonationBanner from './ImpersonationBanner';
import { useStore } from '../../store/useStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import ModuleLoadingSkeleton from '../Common/ModuleLoadingSkeleton';

// Lazy load all the modules
const Dashboard = lazy(() => import('../Dashboard/Dashboard'));
const OrdersModule = lazy(() => import('../Orders/OrdersModule'));
const InvoicesModule = lazy(() => import('../Invoices/InvoicesModule'));
const ClientsModule = lazy(() => import('../Clients/ClientsModule'));
const EmployeesModule = lazy(() => import('../Employees/EmployeesModule'));
const UsersModule = lazy(() => import('../Users/UsersModule'));
const MaterialsModule = lazy(() => import('../Materials/MaterialsModule'));
const PurchasesModule = lazy(() => import('../Purchases/PurchasesModule'));
const ServicesModule = lazy(() => import('../Services/ServicesModule'));
const FinancialModule = lazy(() => import('../Financial/FinancialModule'));
const DocumentsModule = lazy(() => import('../Documents/DocumentsModule'));
const ReportsModule = lazy(() => import('../Reports/ReportsModule'));
const SettingsModule = lazy(() => import('../Settings/SettingsModule'));
const PaymentsModule = lazy(() => import('../Payments/PaymentsModule'));
const TasksModule = lazy(() => import('../Tasks/TasksModule'));
const QuickNotesModule = lazy(() => import('../QuickNotes/QuickNotesModule'));
const ChatModule = lazy(() => import('../Chat/ChatModule'));
const AuditModule = lazy(() => import('../Audit/AuditModule'));
const PassportPhotoModule = lazy(() => import('../Photos/PassportPhotoModule'));

interface LayoutProps {
  canInstallPWA: boolean;
  onInstallPWA: () => void;
}

const Layout: React.FC<LayoutProps> = ({ canInstallPWA, onInstallPWA }) => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const { impersonatingUser, setSidebarCollapsed, pendingOrderForClient } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');

  // Define shortcuts
  const shortcuts = {
    'd': () => setActiveModule('dashboard'),
    'o': () => setActiveModule('orders'),
    'i': () => setActiveModule('invoices'),
    'c': () => setActiveModule('clients'),
    'e': () => setActiveModule('employees'),
    'm': () => setActiveModule('materials'),
    's': () => setActiveModule('settings'),
    'f': () => setActiveModule('financial'),
    'p': () => setActiveModule('purchases'),
    't': () => setActiveModule('tasks'),
    'n': () => setActiveModule('quick_notes'),
    'h': () => setActiveModule('chat'),
  };

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile, setSidebarCollapsed]);

  useEffect(() => {
    if (pendingOrderForClient) {
      setActiveModule('orders');
    }
  }, [pendingOrderForClient]);


  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onModuleChange={setActiveModule} />;
      case 'orders':
        return <OrdersModule />;
      case 'invoices':
        return <InvoicesModule />;
      case 'payments':
        return <PaymentsModule />;
      case 'clients':
        return <ClientsModule />;
      case 'employees':
        return <EmployeesModule />;
      case 'users':
        return <UsersModule />;
      case 'materials':
        return <MaterialsModule />;
      case 'purchases':
        return <PurchasesModule />;
      case 'services':
        return <ServicesModule />;
      case 'financial':
        return <FinancialModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'tasks':
        return <TasksModule />;
      case 'quick_notes':
        return <QuickNotesModule />;
      case 'chat':
        return <ChatModule />;
      case 'reports':
        return <ReportsModule />;
      case 'audit':
        return <AuditModule />;
      case 'passport_photos':
        return <PassportPhotoModule />;
      case 'settings':
        return <SettingsModule />;
      default:
        return <Dashboard onModuleChange={setActiveModule} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-transparent">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        canInstallPWA={canInstallPWA}
        onInstallPWA={onInstallPWA}
      />

      <div className="flex-1 flex flex-col">
        {impersonatingUser && <ImpersonationBanner />}
        <Header
          onModuleChange={setActiveModule}
          onMobileMenuToggle={() => setIsMobileMenuOpen(true)}
        />

        <main className="flex-1 p-6">
          <Suspense fallback={<ModuleLoadingSkeleton />}>
            {renderModule()}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default Layout;
