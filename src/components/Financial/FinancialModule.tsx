import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInvoiceStore } from '../../store/useInvoiceStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useStore } from '../../store/useStore';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import Button from '../Common/Button';
import Input from '../Common/Input';
import { HoverEffect } from '../ui/hover-effect';
import { supabase } from '../../services/supabaseClient';

const FinancialModule: React.FC = () => {
  const { t } = useTranslation();
  const { invoices } = useInvoiceStore();
  const { expenses } = useFinanceStore();
  const { settings, currentUser } = useStore();

  const [startDate, setStartDate] = useState<Date>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

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

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      const isUserInvoice = currentUser?.role !== 'admin' ? invoice.order.createdBy === currentUser?.id : true;
      return invoiceDate >= startDate && invoiceDate <= endOfMonth(endDate) && isUserInvoice;
    });
  }, [invoices, startDate, endDate, currentUser]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isUserExpense = currentUser?.role !== 'admin' ? expense.createdBy === currentUser?.id : true;
      return expenseDate >= startDate && expenseDate <= endOfMonth(endDate) && isUserExpense;
    });
  }, [expenses, startDate, endDate, currentUser]);

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.order.total, 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const getProfitColor = () => {
    if (netProfit > 0) return 'text-green-600 dark:text-green-500';
    if (netProfit < 0) return 'text-red-600 dark:text-red-500';
    return 'text-gray-900 dark:text-white';
  };

  const financialStats = [
    {
      title: t('financial.total_revenue'),
      description: <span className="text-3xl font-bold text-green-600 dark:text-green-500">{`${totalRevenue.toFixed(2)} ${settings.currency}`}</span>,
      icon: TrendingUp,
    },
    {
      title: t('financial.total_expenses'),
      description: <span className="text-3xl font-bold text-red-600 dark:text-red-500">{`${totalExpenses.toFixed(2)} ${settings.currency}`}</span>,
      icon: TrendingDown,
    },
    {
      title: t('financial.net_profit'),
      description: <span className={`text-3xl font-bold ${getProfitColor()}`}>{`${netProfit.toFixed(2)} ${settings.currency}`}</span>,
      icon: DollarSign,
    },
  ];

  const handlePrintReport = () => {
    const doc = new jsPDF();
    type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } };
    const autoTableDoc = doc as AutoTableDoc;
    const getTableY = () => autoTableDoc.lastAutoTable?.finalY ?? 25;
    const dateRange = `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
    
    doc.text(`${t('financial.financial_report')} - ${dateRange}`, 14, 20);
    
    autoTable(doc, {
      startY: 25,
      body: [
        [t('financial.total_revenue'), `${totalRevenue.toFixed(2)} ${settings.currency}`],
        [t('financial.total_expenses'), `${totalExpenses.toFixed(2)} ${settings.currency}`],
        [t('financial.net_profit'), `${netProfit.toFixed(2)} ${settings.currency}`],
      ],
      theme: 'striped',
      styles: { fontStyle: 'bold' },
    });

    if (filteredInvoices.length > 0) {
      doc.text(t('financial.revenue_details'), 14, getTableY() + 10);
      autoTable(doc, {
        startY: getTableY() + 12,
        head: [['Data', 'Fatura', 'Cliente', 'Valor']],
        body: filteredInvoices.map(inv => [
          format(new Date(inv.createdAt), 'dd/MM/yyyy'),
          inv.invoiceNumber,
          inv.order.clientName,
          `${inv.order.total.toFixed(2)} ${settings.currency}`
        ]),
      });
    }

    if (filteredExpenses.length > 0) {
      doc.text(t('financial.expense_details'), 14, getTableY() + 10);
      autoTable(doc, {
        startY: getTableY() + 12,
        head: [['Data', 'Descrição', 'Valor']],
        body: filteredExpenses.map(exp => [
          format(new Date(exp.date), 'dd/MM/yyyy'),
          exp.description,
          `${exp.amount.toFixed(2)} ${settings.currency}`
        ]),
      });
    }

    doc.save(`relatorio_financeiro_${format(new Date(), 'yyyyMMdd')}.pdf`);
  };

  const getExpenseDescription = (expense: typeof expenses[0]) => {
    if (expense.type === 'salary') return `${t('financial.expense_type_salary')}: ${expense.description}`;
    if (expense.type === 'purchase') return `${t('financial.expense_type_purchase')}: ${expense.description}`;
    return expense.description;
  }

  // Sempre carregar dados do Supabase ao abrir o módulo
  useEffect(() => {
    void useInvoiceStore.getState().listInvoices();
    void useFinanceStore.getState().listExpenses();
    void useFinanceStore.getState().listSalaryPayments();
  }, []);

  // Assina realtime para manter as listas sincronizadas sem recarregar
  useEffect(() => {
    const channel = supabase.channel('financial-realtime');
    const refreshInvoices = () => void useInvoiceStore.getState().listInvoices();
    const refreshExpenses = () => void useFinanceStore.getState().listExpenses();
    const refreshSalaryPayments = () => void useFinanceStore.getState().listSalaryPayments();

    [
      { table: 'invoices', handler: refreshInvoices },
      { table: 'expenses', handler: refreshExpenses },
      { table: 'salary_payments', handler: refreshSalaryPayments },
    ].forEach(({ table, handler }) => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('financial.title')}</h1>
        <Button onClick={handlePrintReport} icon={Printer}>{t('financial.print_report')}</Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 p-4 space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => setDateRange('7days')}>{t('financial.last_7_days')}</Button>
          <Button size="sm" variant="secondary" onClick={() => setDateRange('30days')}>{t('financial.last_30_days')}</Button>
          <Button size="sm" variant="secondary" onClick={() => setDateRange('thisMonth')}>{t('financial.this_month')}</Button>
        </div>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('financial.start_date')}
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
          <Input
            label={t('financial.end_date')}
            type="date"
            value={format(endDate, 'yyyy-MM-dd')}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
      </div>

      {/* Stats */}
      <HoverEffect items={financialStats} className="lg:grid-cols-3" />

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20">
          <h3 className="text-lg font-semibold p-4 border-b border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white">{t('financial.revenue_details')}</h3>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
              <thead className="bg-gray-50/5 dark:bg-neutral-800/20 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Fatura</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-500/10">
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{format(new Date(inv.createdAt), 'dd/MM/yy')}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{inv.invoiceNumber}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{inv.order.total.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="text-center py-6 text-sm text-gray-500">{t('financial.no_transactions')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Expenses */}
        <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20">
          <h3 className="text-lg font-semibold p-4 border-b border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white">{t('financial.expense_details')}</h3>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
              <thead className="bg-gray-50/5 dark:bg-neutral-800/20 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Descrição</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredExpenses.length > 0 ? filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-500/10">
                    <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{format(new Date(exp.date), 'dd/MM/yy')}</td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{getExpenseDescription(exp)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium text-gray-900 dark:text-gray-100">{exp.amount.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} className="text-center py-6 text-sm text-gray-500">{t('financial.no_transactions')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialModule;
