import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';

import { Employee } from '../../types';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useStore } from '../../store/useStore';

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
  const { settings } = useStore();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const monthEvents = useMemo(() => {
    return getEventsForMonth(employee.id, selectedMonth);
  }, [getEventsForMonth, employee.id, selectedMonth]);

  const totalDeductions = monthEvents.reduce((sum, event) => sum + event.deduction, 0);
  const grossSalary = employee.salary || 0;
  const netSalary = grossSalary - totalDeductions;

  const validationSchema = yup.object().shape({
    method: yup.string().oneOf(['cash', 'transfer', 'mobile_money']).required('O método é obrigatório'),
  });

  const { control, handleSubmit } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: { method: 'transfer' as const },
  });

  const onSubmit = async (data: { method: 'cash' | 'transfer' | 'mobile_money' }) => {
    await createSalaryPayment({
      employeeId: employee.id,
      employeeName: employee.name,
      amount: netSalary,
      date: new Date(),
      month: selectedMonth.getMonth(),
      year: selectedMonth.getFullYear(),
      deductions: totalDeductions,
      grossSalary,
      method: data.method,
    });
    onClose();
  };
  
  const methodOptions = [
    { value: 'transfer', label: t('payments.methods.transfer') },
    { value: 'cash', label: t('payments.methods.cash') },
    { value: 'mobile_money', label: t('payments.methods.mobile_money') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employees.pay_salary_for', { name: employee.name })} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
