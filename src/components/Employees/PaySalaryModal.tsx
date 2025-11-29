import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';

import { Employee, NotificationType } from '../../types';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useStore } from '../../store/useStore';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { generateId } from '../../utils/id';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Combobox from '../Common/Combobox';

interface PaySalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const PaySalaryModal: React.FC<PaySalaryModalProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const { getEventsForMonth } = useAttendanceStore();
  const { createSalaryPayment } = useFinanceStore();
  const { getEmployeeById } = useEmployeeStore();
  const { settings, addNotification } = useStore((state) => ({
    settings: state.settings,
    addNotification: state.addNotification,
  }));

  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [duplicateInfo, setDuplicateInfo] = useState<string | null>(null);

  const currentEmployee = useMemo(() => getEmployeeById(employee.id) ?? employee, [employee, getEmployeeById]);

  const monthEvents = useMemo(() => {
    return getEventsForMonth(currentEmployee.id, selectedMonth);
  }, [getEventsForMonth, currentEmployee.id, selectedMonth]);

  const totalDeductions = monthEvents.reduce((sum, event) => sum + event.deduction, 0);
  const grossSalary = currentEmployee.salary || 0;
  const netSalary = grossSalary - totalDeductions;

  const validationSchema = yup.object().shape({
    method: yup.string().oneOf(['cash', 'transfer', 'mobile_money']).required('O método é obrigatório'),
  });

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: { method: 'transfer' as const },
  });

  const notify = (type: NotificationType, baseMessage: string, detail?: string) => {
    const fullMessage = detail ? `${baseMessage} ${detail}` : baseMessage;
    addNotification({
      id: generateId(),
      type,
      title: type === 'error' ? t('common.error') : t('common.success'),
      message: fullMessage,
      read: false,
      createdAt: new Date(),
    });
  };

  const onSubmit = async (data: { method: 'cash' | 'transfer' | 'mobile_money' }) => {
    setDuplicateInfo(null);
    if (netSalary <= 0) {
      notify('error', t('common.error'), 'Valor de pagamento inválido');
      return;
    }

    try {
      await createSalaryPayment({
        employeeId: currentEmployee.id,
        employeeName: currentEmployee.name,
        amount: netSalary,
        date: new Date(),
        month: selectedMonth.getMonth(),
        year: selectedMonth.getFullYear(),
        deductions: totalDeductions,
        grossSalary,
        method: data.method,
      });
      notify('success', 'Pagamento registrado com sucesso');
      onClose();
    } catch (error) {
      const message = (error as Error).message;
      if (message?.toLowerCase().includes('já possui pagamento')) {
        notify('error', 'Funcionário já recebeu salário neste mês.');
        const eventLines = monthEvents
          .filter((e) => e.deduction > 0)
          .map((e) => {
            const label = e.type === 'absence' ? t('employees.absences_short') : t('employees.delays_short');
            const date = format(new Date(e.date), 'dd/MM');
            return `- ${date}: ${label} (${e.deduction.toFixed(2)} ${settings.currency})`;
          })
          .join('\n');
        setDuplicateInfo(
          [
            `Período: ${format(selectedMonth, 'MM/yyyy')}`,
            `Salário bruto: ${grossSalary.toFixed(2)} ${settings.currency}`,
            `Total descontos: ${totalDeductions.toFixed(2)} ${settings.currency}`,
            `Salário líquido: ${netSalary.toFixed(2)} ${settings.currency}`,
            eventLines ? `Detalhe dos descontos:\n${eventLines}` : 'Sem descontos aplicados.',
          ].join('\n')
        );
      } else {
        notify('error', t('common.error'), message);
      }
    }
  };
  
  const methodOptions = [
    { value: 'transfer', label: t('payments.methods.transfer') },
    { value: 'cash', label: t('payments.methods.cash') },
    { value: 'mobile_money', label: t('payments.methods.mobile_money') },
  ];

  const rawTitle = t('employees.pay_salary_for', { name: currentEmployee.name });
  const title = rawTitle.includes('{name}')
    ? rawTitle.replace('{name}', currentEmployee.name ?? '')
    : rawTitle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {duplicateInfo && (
          <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-4 text-sm whitespace-pre-line text-center">
            <p className="font-semibold mb-2">Funcionário já pago neste mês</p>
            <p>{duplicateInfo}</p>
          </div>
        )}
        <div>
          <label className="form-label">{t('employees.payment_month')}</label>
          <Input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
          />
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
          <div className="flex justify-between"><span>{t('employees.gross_salary')}:</span><span className="font-medium">{grossSalary.toFixed(2)} {settings.currency}</span></div>
          <div className="flex justify-between text-red-500"><span>{t('employees.total_deductions')}:</span><span className="font-medium">-{totalDeductions.toFixed(2)} {settings.currency}</span></div>
          <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2"><span>{t('employees.net_salary')}:</span><span>{netSalary.toFixed(2)} {settings.currency}</span></div>
        </div>

        <Controller
          name="method"
          control={control}
          render={({ field }) => (
            <Combobox
              label={t('payments.method')}
              options={methodOptions}
              value={field.value}
              onChange={field.onChange}
              required
            />
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="primary">{t('employees.confirm_payment')}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaySalaryModal;
