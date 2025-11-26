import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useClientStore } from '../../store/useClientStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useMaterialStore } from '../../store/useMaterialStore';
import { useServiceStore } from '../../store/useServiceStore';
import { useUserStore } from '../../store/useUserStore';
import { usePurchaseStore } from '../../store/usePurchaseStore';
import { HoverEffect } from '../ui/hover-effect';
import { 
  ShoppingCart, 
  FileText, 
  Users, 
  Package,
  UserCheck,
  BarChart2,
  PieChart,
  Wrench,
  ShoppingBag,
} from 'lucide-react';
import Button from '../Common/Button';
import RevenueChart from './charts/RevenueChart';
import OrdersByStatusChart from './charts/OrdersByStatusChart';
import SystemAlerts from './SystemAlerts';
import TopServicesCard from './TopServicesCard';
import { subDays, isAfter, format, isWithinInterval } from 'date-fns';
import { pt } from 'date-fns/locale';
import { supabase } from '../../services/supabaseClient';

interface DashboardProps {
  onModuleChange: (module: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onModuleChange }) => {
  const { t } = useTranslation();
  const { currentUser, settings } = useStore();
  const { clients } = useClientStore();
  const { orders } = useOrderStore();
  const { invoices } = useInvoiceStore();
  const { employees } = useEmployeeStore();
  const { materials } = useMaterialStore();
  const { services } = useServiceStore();
  const { users } = useUserStore();
  const { purchases } = usePurchaseStore();
  
  const [activeChart, setActiveChart] = useState<'revenue' | 'orders'>('revenue');

  const isAdmin = currentUser?.role === 'admin';

  // Carrega dados reais do Supabase assim que o painel monta
  useEffect(() => {
    void useOrderStore.getState().listOrders();
    void useInvoiceStore.getState().listInvoices();
    void useClientStore.getState().listClients();
    void useServiceStore.getState().listServices(true);
    void usePurchaseStore.getState().listPurchases();
    void useMaterialStore.getState().listMaterials();
    void useEmployeeStore.getState().listEmployees(true);
    void useUserStore.getState().listUsers(true);
  }, []);

  // Atualiza automaticamente via Realtime para INSERT/UPDATE/DELETE
  useEffect(() => {
    const channel = supabase.channel('dashboard-realtime');
    const subscriptions = [
      { table: 'orders', handler: () => void useOrderStore.getState().listOrders() },
      { table: 'invoices', handler: () => void useInvoiceStore.getState().listInvoices() },
      { table: 'clients', handler: () => void useClientStore.getState().listClients() },
      { table: 'services', handler: () => void useServiceStore.getState().listServices(true) },
      { table: 'purchases', handler: () => void usePurchaseStore.getState().listPurchases() },
      { table: 'materials', handler: () => void useMaterialStore.getState().listMaterials() },
      { table: 'employees', handler: () => void useEmployeeStore.getState().listEmployees(true) },
      { table: 'profiles', handler: () => void useUserStore.getState().listUsers(true) },
    ] as const;

    subscriptions.forEach(({ table, handler }) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          handler();
        }
      );
    });

    void channel.subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, []);

  // --- Percentage Change Calculation ---
  const now = new Date();
  const currentPeriod = { start: subDays(now, 30), end: now };
  const previousPeriod = { start: subDays(now, 60), end: subDays(now, 31) };
  const currentPeriodStart = currentPeriod.start;
  const previousPeriodStart = previousPeriod.start;
  const previousPeriodEnd = previousPeriod.end;

  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };

  // --- Detailed Stats for Cards ---
  const detailedOrderStats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const inProduction = orders.filter(o => ['in_production', 'in_design'].includes(o.status)).length;
    return { pending, inProduction };
  }, [orders]);

  const detailedClientStats = useMemo(() => {
    const newClients = clients.filter(c => c.createdAt && isAfter(new Date(c.createdAt), currentPeriodStart)).length;
    return { newClients };
  }, [clients, currentPeriodStart]);

  // --- Main Stats Calculation ---
  const orderStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = orders.filter(o => isAfter(new Date(o.createdAt), currentPeriodStart)).length;
    const previous = orders.filter(o => isWithinInterval(new Date(o.createdAt), previousInterval)).length;
    return { total: orders.length, change: calculatePercentageChange(current, previous) };
  }, [orders, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);
  
  const invoiceStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = invoices.filter(i => isAfter(new Date(i.createdAt), currentPeriodStart)).length;
    const previous = invoices.filter(i => isWithinInterval(new Date(i.createdAt), previousInterval)).length;
    return { total: invoices.length, change: calculatePercentageChange(current, previous) };
  }, [invoices, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);

  const clientStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = clients.filter(c => c.createdAt && isAfter(new Date(c.createdAt), currentPeriodStart)).length;
    const previous = clients.filter(c => c.createdAt && isWithinInterval(new Date(c.createdAt), previousInterval)).length;
    return { total: clients.length, change: calculatePercentageChange(current, previous) };
  }, [clients, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);

  const serviceStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = services.filter(s => s.createdAt && isAfter(new Date(s.createdAt), currentPeriodStart)).length;
    const previous = services.filter(s => s.createdAt && isWithinInterval(new Date(s.createdAt), previousInterval)).length;
    return { total: services.length, change: calculatePercentageChange(current, previous) };
  }, [services, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);

  const purchaseStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = purchases.filter(p => isAfter(new Date(p.date), currentPeriodStart)).length;
    const previous = purchases.filter(p => isWithinInterval(new Date(p.date), previousInterval)).length;
    return { total: purchases.length, change: calculatePercentageChange(current, previous) };
  }, [purchases, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);

  const userStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = users.filter(u => u.createdAt && isAfter(new Date(u.createdAt), currentPeriodStart)).length;
    const previous = users.filter(u => u.createdAt && isWithinInterval(new Date(u.createdAt), previousInterval)).length;
    return { total: users.filter(u => !u.isBlocked).length, change: calculatePercentageChange(current, previous) };
  }, [users, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);

  const employeeStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = employees.filter(e => e.createdAt && isAfter(new Date(e.createdAt), currentPeriodStart)).length;
    const previous = employees.filter(e => e.createdAt && isWithinInterval(new Date(e.createdAt), previousInterval)).length;
    return { total: employees.length, change: calculatePercentageChange(current, previous) };
  }, [employees, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);
  
  const materialStats = useMemo(() => {
    const previousInterval = { start: previousPeriodStart, end: previousPeriodEnd };
    const current = materials.filter(m => m.createdAt && isAfter(new Date(m.createdAt), currentPeriodStart)).length;
    const previous = materials.filter(m => m.createdAt && isWithinInterval(new Date(m.createdAt), previousInterval)).length;
    return { total: materials.length, change: calculatePercentageChange(current, previous) };
  }, [materials, currentPeriodStart, previousPeriodStart, previousPeriodEnd]);

  const stats = [
    {
      title: t('navigation.orders'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{orderStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {detailedOrderStats.pending} {t('orders.status.pending')} / {detailedOrderStats.inProduction} {t('orders.status.in_production')}
          </p>
        </div>
      ),
      icon: ShoppingCart,
      onClick: () => onModuleChange('orders'),
      percentageChange: orderStats.change,
    },
    {
      title: t('navigation.invoices'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{invoiceStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.generated_invoices')}</p>
        </div>
      ),
      icon: FileText,
      onClick: () => onModuleChange('invoices'),
      percentageChange: invoiceStats.change,
    },
    {
      title: t('navigation.clients'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{clientStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            +{detailedClientStats.newClients} {t('dashboard.new_this_month')}
          </p>
        </div>
      ),
      icon: Users,
      onClick: () => onModuleChange('clients'),
      percentageChange: clientStats.change,
    },
    {
      title: t('navigation.services'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{serviceStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.registered_services')}</p>
        </div>
      ),
      icon: Wrench,
      onClick: () => onModuleChange('services'),
      percentageChange: serviceStats.change,
    },
    {
      title: t('navigation.purchases'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{purchaseStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.total_purchases')}</p>
        </div>
      ),
      icon: ShoppingBag,
      onClick: () => onModuleChange('purchases'),
      percentageChange: purchaseStats.change,
    },
    ...(isAdmin ? [{
      title: t('navigation.users'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.active_users')}</p>
        </div>
      ),
      icon: Users,
      onClick: () => onModuleChange('users'),
      percentageChange: userStats.change,
    }] : []),
    ...(isAdmin ? [{
      title: t('navigation.employees'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{employeeStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.active_employees')}</p>
        </div>
      ),
      icon: UserCheck,
      onClick: () => onModuleChange('employees'),
      percentageChange: employeeStats.change,
    }] : []),
    {
      title: t('navigation.materials'),
      description: (
        <div>
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{materialStats.total}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dashboard.material_types')}</p>
        </div>
      ),
      icon: Package,
      onClick: () => onModuleChange('materials'),
      percentageChange: materialStats.change,
    },
  ];

  const recentData = useMemo(() => {
    const sevenDaysAgo = subDays(new Date(), 7);
    return {
      orders: orders.filter(o => isAfter(new Date(o.createdAt), sevenDaysAgo)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
      clients: clients.filter(c => c.createdAt && isAfter(new Date(c.createdAt), sevenDaysAgo)).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).slice(0, 5),
    };
  }, [orders, clients]);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white dark:from-primary-500/80 dark:to-primary-600/80 dark:backdrop-blur-sm dark:border dark:border-white/10">
        <h1 className="text-2xl font-bold mb-2">
          {t('dashboard.welcome_message')}
        </h1>
        <p className="text-primary-100">
          {t('dashboard.system_subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div id="dashboard-cards">
        <HoverEffect items={stats} className="lg:grid-cols-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Section */}
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-0">
                {t('dashboard.graphical_analysis')}
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeChart === 'revenue' ? 'primary' : 'secondary'} 
                  size="sm"
                  icon={BarChart2}
                  onClick={() => setActiveChart('revenue')}
                >
                  {t('dashboard.revenue')}
                </Button>
                <Button 
                  variant={activeChart === 'orders' ? 'primary' : 'secondary'} 
                  size="sm"
                  icon={PieChart}
                  onClick={() => setActiveChart('orders')}
                >
                  {t('navigation.orders')}
                </Button>
              </div>
            </div>
            <div>
              {activeChart === 'revenue' && <RevenueChart />}
              {activeChart === 'orders' && <OrdersByStatusChart />}
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          <SystemAlerts onNavigate={onModuleChange} />
          <TopServicesCard />
        </div>
      </div>

      {/* Recent Activity Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('dashboard.recent_activity')} ({t('dashboard.last_7_days')})
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20">
            <h4 className="p-4 border-b border-gray-200/80 dark:border-white/10 font-semibold text-gray-900 dark:text-white">
              {t('navigation.orders')}
            </h4>
            <ul className="divide-y divide-gray-200/80 dark:divide-white/10">
              {recentData.orders.length > 0 ? recentData.orders.map(order => (
                <li key={order.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{order.clientName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{order.total.toFixed(2)} {settings.currency}</p>
                    <p className="text-xs text-gray-400">{format(new Date(order.createdAt), 'dd MMM', { locale: pt })}</p>
                  </div>
                </li>
              )) : (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400">{t('dashboard.no_recent_activity')}</p>
              )}
            </ul>
          </div>
          {/* Recent Clients */}
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20">
            <h4 className="p-4 border-b border-gray-200/80 dark:border-white/10 font-semibold text-gray-900 dark:text-white">
              {t('navigation.clients')}
            </h4>
            <ul className="divide-y divide-gray-200/80 dark:divide-white/10">
              {recentData.clients.length > 0 ? recentData.clients.map(client => (
                <li key={client.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{client.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{client.phone}</p>
                  </div>
                  <p className="text-xs text-gray-400">{client.createdAt ? format(new Date(client.createdAt), 'dd MMM', { locale: pt }) : ''}</p>
                </li>
              )) : (
                <p className="p-4 text-center text-gray-500 dark:text-gray-400">{t('dashboard.no_recent_activity')}</p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
