import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store/useStore';
import { useUserStore } from '../../store/useUserStore';
import { useOrderStore } from '../../store/useOrderStore';
import { useClientStore } from '../../store/useClientStore';
import { useMaterialStore } from '../../store/useMaterialStore';
import { useServiceStore } from '../../store/useServiceStore';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';
import { Printer, User, Users, ShoppingCart } from 'lucide-react';
import { Client, Order } from '../../types';

type UserActivityEntry =
  | { type: 'client'; item: Client; date: Date | string }
  | { type: 'order'; item: Order; date: Date | string };

const ReportsModule: React.FC = () => {
  const { t } = useTranslation();
  const { settings } = useStore();
  const { clients } = useClientStore();
  const { users } = useUserStore();
  const { orders } = useOrderStore();
  const { materials, stockMovements } = useMaterialStore();
  const { services } = useServiceStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Normaliza labels com possíveis caracteres corrompidos
  const normalizeLabel = (val: string, fallback: string) => (val && val.includes('�') ? fallback : val || fallback);
  const labelLast7 = normalizeLabel(t('financial.last_7_days'), 'Últimos 7 dias');
  const labelLast30 = normalizeLabel(t('financial.last_30_days'), 'Últimos 30 dias');
  const labelThisMonth = normalizeLabel(t('financial.this_month'), 'Este Mês');

  const setDateRange = (preset: '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    if (preset === '7days') {
      setStartDate(subDays(today, 6));
      setEndDate(today);
    } else if (preset === '30days') {
      setStartDate(subDays(today, 29));
      setEndDate(today);
    } else if (preset === 'thisMonth') {
      setStartDate(startOfMonth(today));
      setEndDate(endOfMonth(today));
    }
  };

  const filteredData = useMemo(() => {
    const interval = { start: startDate, end: endOfMonth(endDate) };
    const filteredOrders = orders.filter(o => isWithinInterval(new Date(o.createdAt), interval));
    const filteredClients = clients.filter(c => c.createdAt && isWithinInterval(new Date(c.createdAt), interval));
    return { filteredOrders, filteredClients };
  }, [orders, clients, startDate, endDate]);

  const userRevenue = useMemo(() => {
    const revenueMap = new Map<string, number>();
    filteredData.filteredOrders.forEach(order => {
      if (order.createdBy) {
        revenueMap.set(order.createdBy, (revenueMap.get(order.createdBy) || 0) + order.total);
      }
    });
    return Array.from(revenueMap.entries())
      .map(([userId, total]) => ({ userId, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData.filteredOrders]);

  const topClients = useMemo(() => {
    const clientSpentMap = new Map<string, number>();
    filteredData.filteredOrders.forEach(order => {
      clientSpentMap.set(order.clientId, (clientSpentMap.get(order.clientId) || 0) + order.total);
    });
    return Array.from(clientSpentMap.entries())
      .map(([clientId, total]) => ({ clientId, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData.filteredOrders]);

  const userActivity = useMemo<UserActivityEntry[]>(() => {
    if (!selectedUserId) return [];
    const interval = { start: startDate, end: endOfMonth(endDate) };
    const userClients = clients.filter(c => c.createdBy === selectedUserId && c.createdAt && isWithinInterval(new Date(c.createdAt), interval));
    const userOrders = orders.filter(o => o.createdBy === selectedUserId && isWithinInterval(new Date(o.createdAt), interval));
    
    const activity: UserActivityEntry[] = [
      ...userClients.map(c => ({ type: 'client', item: c, date: c.createdAt })),
      ...userOrders.map(o => ({ type: 'order', item: o, date: o.createdAt })),
    ];
    
    return activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedUserId, clients, orders, startDate, endDate]);
  
  const transferredClients = clients.filter(c => c.transferredFrom && c.transferredAt && isWithinInterval(new Date(c.transferredAt), { start: startDate, end: endOfMonth(endDate) }));

  const filteredConsumptionMovements = useMemo(() => {
    return stockMovements
      .filter(m => {
        const movementDate = new Date(m.createdAt);
        const isDeduction = m.quantity < 0;
        const inDateRange = movementDate >= startDate && movementDate <= endOfMonth(endDate);
        const materialMatch = !materialFilter || m.materialId === materialFilter;

        if (!isDeduction || !inDateRange || !materialMatch) return false;

        const order = orders.find(o => o.id === m.referenceId);
        if (!order) return false;

        const clientMatch = !clientFilter || order.clientId === clientFilter;
        const serviceMatch = !serviceFilter || order.items.some(item => item.serviceId === serviceFilter);

        return clientMatch && serviceMatch;
      })
      .map(m => {
        const order = orders.find(o => o.id === m.referenceId);
        const material = materials.find(mat => mat.id === m.materialId);
        return {
          ...m,
          clientName: order?.clientName || 'N/A',
          serviceNames: order?.items.map(i => i.serviceName).join(', ') || 'N/A',
          unit: material?.unit || 'unit'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [stockMovements, startDate, endDate, materialFilter, serviceFilter, clientFilter, orders, materials]);

  const handlePrint = () => {
    const doc = new jsPDF();
    const dateRange = `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
    doc.text(`${t(`reports.${activeTab}`)} - ${dateRange}`, 14, 16);

    if (activeTab === 'overview') {
       autoTable(doc, {
        startY: 25,
        head: [[t('reports.user'), t('reports.total_revenue'), t('reports.total_orders')]],
        body: userRevenue.map(item => [
          users.find(u => u.id === item.userId)?.name || 'N/A',
          `${item.total.toFixed(2)} ${settings.currency}`,
          filteredData.filteredOrders.filter(o => o.createdBy === item.userId).length
        ]),
        foot: [[t('common.total'), `${userRevenue.reduce((s, i) => s + i.total, 0).toFixed(2)} ${settings.currency}`, filteredData.filteredOrders.length]],
        footStyles: { fontStyle: 'bold' }
      });
    } else if (activeTab === 'user_activity') {
        autoTable(doc, {
            startY: 25,
            head: [[t('common.date'), 'Tipo', t('common.details')]],
            body: userActivity.map(act => [
                format(new Date(act.date), 'dd/MM/yyyy'),
                act.type === 'client' ? t('clients.title') : t('orders.title'),
                act.type === 'client' ? act.item.name : `${act.item.orderNumber} - ${act.item.total.toFixed(2)}`
            ])
        });
    } else if (activeTab === 'transfers') {
        autoTable(doc, {
            startY: 25,
            head: [[t('clients.title'), t('reports.from_user'), t('reports.transfer_date')]],
            body: transferredClients.map(c => [
                c.name,
                c.transferredFrom,
                format(new Date(c.transferredAt!), 'dd/MM/yyyy')
            ])
        });
    } else if (activeTab === 'consumption') {
        autoTable(doc, {
            startY: 25,
            head: [[t('common.date'), t('materials.title'), t('common.quantity'), t('reports.service_reference'), t('reports.client_reference')]],
            body: filteredConsumptionMovements.map(move => [
                format(new Date(move.createdAt), 'dd/MM/yy HH:mm'),
                move.materialName,
                `${Math.abs(move.quantity).toFixed(2)} ${t(`materials.units.${move.unit}`)}`,
                move.serviceNames,
                move.clientName,
            ])
        });
    }
    
    doc.save(`relatorio_${activeTab}_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('reports.user_revenue_ranking')}</h3>
        <ul className="space-y-2">
          {userRevenue.map(({ userId, total }) => (
            <li key={userId} className="flex justify-between items-center p-2 bg-gray-50/10 dark:bg-neutral-800/30 rounded">
              <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100"><User className="w-4 h-4 text-gray-500" />{users.find(u => u.id === userId)?.name || 'N/A'}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{total.toFixed(2)} {settings.currency}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('reports.top_clients_ranking')}</h3>
        <ul className="space-y-2">
          {topClients.map(({ clientId, total }) => (
            <li key={clientId} className="flex justify-between items-center p-2 bg-gray-50/10 dark:bg-neutral-800/30 rounded">
              <span className="flex items-center gap-2 text-gray-900 dark:text-gray-100"><Users className="w-4 h-4 text-gray-500" />{clients.find(c => c.id === clientId)?.name || 'N/A'}</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{total.toFixed(2)} {settings.currency}</span>
            </li>
          ))}
        </ul>
      </div>
       <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 transition-transform duration-300 hover:-translate-y-1">
        <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">{t('reports.new_registrations')}</h3>
        <p className="text-4xl font-bold text-primary-600">{filteredData.filteredClients.length}</p>
      </div>
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800 transition-transform duration-300 hover:-translate-y-1">
        <h3 className="font-semibold mb-2 text-gray-700 dark:text-gray-300">{t('reports.transferred_clients')}</h3>
        <p className="text-4xl font-bold text-primary-600">{transferredClients.length}</p>
      </div>
    </div>
  );

  const renderUserActivity = () => (
    <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4">
      <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{t('reports.activity_feed_for')} {users.find(u => u.id === selectedUserId)?.name || '...'}</h3>
      {userActivity.length > 0 ? (
        <ul className="space-y-3">
          {userActivity.map((act, i) => (
            <li key={i} className="flex items-center gap-4 p-3 bg-gray-50/10 dark:bg-neutral-800/30 rounded-lg">
              <div className="p-2 bg-gray-200/50 dark:bg-neutral-700/50 rounded-full">
                {act.type === 'client' ? <User className="w-5 h-5 text-gray-800 dark:text-gray-200" /> : <ShoppingCart className="w-5 h-5 text-gray-800 dark:text-gray-200" />}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {act.type === 'client' ? t('reports.new_client_registered') : t('reports.new_order_created')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {act.type === 'client' ? act.item.name : `${act.item.orderNumber} - ${act.item.total.toFixed(2)} MZN`}
                </p>
              </div>
              <span className="text-xs text-gray-400 ml-auto">{format(new Date(act.date), 'dd/MM/yy')}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-gray-500 text-center py-4">{t('reports.no_activity')}</p>}
    </div>
  );

  const renderTransfers = () => (
    <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
            <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('clients.title')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('reports.from_user')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('reports.transfer_date')}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {transferredClients.length > 0 ? transferredClients.map(client => (
                    <tr key={client.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-500/10">
                        <td className="px-6 py-4 font-medium">{client.name}</td>
                        <td className="px-6 py-4">{client.transferredFrom}</td>
                        <td className="px-6 py-4">{client.transferredAt ? format(new Date(client.transferredAt), 'dd/MM/yyyy') : ''}</td>
                    </tr>
                )) : (
                    <tr><td colSpan={3} className="text-center py-10 text-gray-500">{t('reports.no_transfers')}</td></tr>
                )}
            </tbody>
        </table>
    </div>
  );

  const renderConsumption = () => (
    <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
          <thead className="bg-gray-50/5 dark:bg-neutral-800/20 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('common.date')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('materials.title')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('common.quantity')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('reports.service_reference')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('reports.client_reference')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
            {filteredConsumptionMovements.length > 0 ? filteredConsumptionMovements.map(move => (
              <tr key={move.id} className="hover:bg-gray-500/10">
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{format(new Date(move.createdAt), 'dd/MM/yy HH:mm')}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{move.materialName}</td>
                <td className="px-6 py-4 text-sm font-semibold text-red-600">{`${Math.abs(move.quantity).toFixed(2)} ${t(`materials.units.${move.unit}`)}`}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{move.serviceNames}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{move.clientName}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">{t('reports.no_movements')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports.title')}</h1>
        <Button onClick={handlePrint} icon={Printer}>{t('reports.print_report')}</Button>
      </div>

      <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDateRange('7days')} className="whitespace-nowrap">{labelLast7}</Button>
            <Button size="sm" variant="secondary" onClick={() => setDateRange('30days')} className="whitespace-nowrap">{labelLast30}</Button>
            <Button size="sm" variant="secondary" onClick={() => setDateRange('thisMonth')} className="whitespace-nowrap">{labelThisMonth}</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('financial.start_date')} type="date" value={format(startDate, 'yyyy-MM-dd')} onChange={(e) => setStartDate(new Date(e.target.value))} />
            <Input label={t('financial.end_date')} type="date" value={format(endDate, 'yyyy-MM-dd')} onChange={(e) => setEndDate(new Date(e.target.value))} />
        </div>
        {activeTab === 'consumption' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-gray-200/80 dark:border-white/10">
            <Combobox label={t('reports.filter_by_material')} options={[{ value: '', label: t('reports.all_materials') }, ...materials.map(m => ({ value: m.id, label: m.name }))]} value={materialFilter} onChange={(val) => setMaterialFilter(val || '')} />
            <Combobox label={t('reports.filter_by_service')} options={[{ value: '', label: t('reports.all_services') }, ...services.map(s => ({ value: s.id, label: s.name }))]} value={serviceFilter} onChange={(val) => setServiceFilter(val || '')} />
            <Combobox label={t('reports.filter_by_client')} options={[{ value: '', label: t('reports.all_clients') }, ...clients.map(c => ({ value: c.id, label: c.name }))]} value={clientFilter} onChange={(val) => setClientFilter(val || '')} />
          </div>
        )}
        {activeTab === 'user_activity' && (
          <div className="border-t pt-4 border-gray-200/80 dark:border-white/10">
            <Combobox label={t('reports.filter_by_user')} options={[{ value: '', label: t('reports.all_users') }, ...users.map(u => ({ value: u.id, label: u.name }))]} value={selectedUserId} onChange={(val) => setSelectedUserId(val || '')} />
          </div>
        )}
      </div>

      <div className="border-b border-gray-200/50 dark:border-neutral-800/50">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('overview')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('reports.overview')}
          </button>
          <button onClick={() => setActiveTab('consumption')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'consumption' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('reports.consumption')}
          </button>
          <button onClick={() => setActiveTab('user_activity')} disabled={!selectedUserId} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'user_activity' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('reports.user_activity')}
          </button>
          <button onClick={() => setActiveTab('transfers')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'transfers' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t('reports.transfers')}
          </button>
        </nav>
      </div>

      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'user_activity' && renderUserActivity()}
        {activeTab === 'consumption' && renderConsumption()}
        {activeTab === 'transfers' && renderTransfers()}
      </div>
    </div>
  );
};

export default ReportsModule;
