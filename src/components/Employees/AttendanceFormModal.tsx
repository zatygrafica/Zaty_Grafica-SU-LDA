import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { format } from 'date-fns';

import { Employee, NotificationType } from '../../types';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useStore } from '../../store/useStore';
import { calculateSalaryDeduction, calculateDelayMinutes } from '../../utils/calculations';
import { generateId } from '../../utils/id';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import { User as UserIcon } from 'lucide-react';
import Textarea from '../Common/Textarea';
import { storageService } from '../../services/storageService';

interface AttendanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  date: Date;
}

interface DelayFormData {
  actualArrivalTime: string;
  notes?: string;
}

interface AbsenceFormData {
  notes?: string;
}

const AttendanceFormModal: React.FC<AttendanceFormModalProps> = ({ isOpen, onClose, employee, date }) => {
  const { t } = useTranslation();
  const { createAbsence, createDelay } = useAttendanceStore();
  const { settings, addNotification } = useStore((state) => ({
    settings: state.settings,
    addNotification: state.addNotification,
  }));
  const [activeTab, setActiveTab] = useState<'delay' | 'absence'>('delay');
  const [delaySubmitting, setDelaySubmitting] = useState(false);
  const [absenceSubmitting, setAbsenceSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // --- Delay Form ---
  const delaySchema = yup.object().shape({
    actualArrivalTime: yup.string().required(t('employees.form.actual_arrival_time_required')),
    notes: yup.string().optional(),
  });
  const {
    register: registerDelay,
    handleSubmit: handleDelaySubmit,
    watch: watchDelay,
    reset: resetDelay,
    formState: { errors: delayErrors },
  } = useForm<DelayFormData>({
    resolver: yupResolver(delaySchema),
    defaultValues: {
      actualArrivalTime: '',
      notes: '',
    },
  });
  
  const watchedActualTime = watchDelay('actualArrivalTime');
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [delayDeduction, setDelayDeduction] = useState(0);

  useEffect(() => {
    if (watchedActualTime) {
      const minutes = calculateDelayMinutes(employee.workSchedule.start, watchedActualTime);
      setDelayMinutes(minutes);
      const deduction = calculateSalaryDeduction(employee.salary || 0, employee.workSchedule.totalHours, date, 'delay', minutes);
      setDelayDeduction(deduction);
    } else {
      setDelayMinutes(0);
      setDelayDeduction(0);
    }
  }, [watchedActualTime, employee, date]);

  // Avatar com cache para carregamento imediato
  useEffect(() => {
    const path = employee?.photoUrl;
    if (!path) {
      setAvatarUrl(undefined);
      return;
    }
    const cached = storageService.getCachedSignedUrl(path, 'profile_photos');
    if (cached) setAvatarUrl(cached);
    void storageService
      .getSignedUrlCached(path, 900, 'profile_photos')
      .then((url) => setAvatarUrl(url))
      .catch(() => setAvatarUrl((prev) => prev ?? path));
  }, [employee?.photoUrl]);

  const notify = (type: NotificationType, baseMessage: string, detail?: string) => {
    const fullMessage = detail && type === 'error' ? `${baseMessage} ${detail}` : baseMessage;
    addNotification({
      id: generateId(),
      type,
      title: type === 'success' ? t('common.success') : t('common.error'),
      message: fullMessage,
      read: false,
      createdAt: new Date(),
    });
  };

  const onDelaySubmit = async (data: DelayFormData) => {
    setDelaySubmitting(true);
    try {
      await createDelay({
        employeeId: employee.id,
        type: 'delay',
        status: 'late',
        date,
        actualArrivalTime: data.actualArrivalTime,
        minutes: delayMinutes,
        deduction: delayDeduction,
        notes: data.notes,
      });
      notify('success', t('employees.attendance_saved_success'));
      onClose();
    } catch (error) {
      notify('error', t('employees.attendance_saved_error'), (error as Error).message);
    } finally {
      setDelaySubmitting(false);
    }
  };

  // --- Absence Form ---
  const absenceSchema = yup.object().shape({
    notes: yup.string().optional(),
  });
  const {
    register: registerAbsence,
    handleSubmit: handleAbsenceSubmit,
    reset: resetAbsence,
  } = useForm<AbsenceFormData>({
    resolver: yupResolver(absenceSchema),
    defaultValues: {
      notes: '',
    },
  });

  const absenceDeduction = calculateSalaryDeduction(employee.salary || 0, employee.workSchedule.totalHours, date, 'absence');

  const onAbsenceSubmit = async (data: AbsenceFormData) => {
    setAbsenceSubmitting(true);
    try {
      await createAbsence({
        employeeId: employee.id,
        type: 'absence',
        status: 'present',
        date,
        hours: employee.workSchedule.totalHours,
        deduction: absenceDeduction,
        notes: data.notes,
      });
      notify('success', t('employees.attendance_saved_success'));
      onClose();
    } catch (error) {
      notify('error', t('employees.attendance_saved_error'), (error as Error).message);
    } finally {
      setAbsenceSubmitting(false);
    }
  };

  // Reset forms when modal opens
  useEffect(() => {
    if (isOpen) {
      resetDelay({ actualArrivalTime: '', notes: '' });
      resetAbsence({ notes: '' });
    }
  }, [isOpen, resetDelay, resetAbsence]);

  const renderDelayForm = () => (
    <form onSubmit={handleDelaySubmit(onDelaySubmit)} className="space-y-4">
      <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md text-sm">
        {t('employees.standard_arrival_time')}: <span className="font-bold">{employee.workSchedule.start}</span>
      </div>
      <Input
        label={t('employees.actual_arrival_time')}
        type="time"
        {...registerDelay('actualArrivalTime')}
        error={delayErrors.actualArrivalTime?.message}
      />
      <Textarea
        label={t('employees.justification')}
        {...registerDelay('notes')}
      />
      <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{t('employees.delay_duration')}:</span>
          <span className="font-bold">{delayMinutes} min</span>
        </div>
        <div className="flex justify-between">
          <span>{t('employees.calculated_deduction')}:</span>
          <span className="font-bold text-red-500">{delayDeduction.toFixed(2)} {settings.currency}</span>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" loading={delaySubmitting}>
          {delaySubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );

  const renderAbsenceForm = () => (
    <form onSubmit={handleAbsenceSubmit(onAbsenceSubmit)} className="space-y-4">
      <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md text-sm">
        {t('employees.full_day_absence')} ({employee.workSchedule.totalHours}h)
      </div>
      <Textarea
        label={t('employees.justification')}
        {...registerAbsence('notes')}
      />
      <div className="p-3 bg-gray-100 dark:bg-neutral-800 rounded-md space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{t('employees.day_deduction')}:</span>
          <span className="font-bold text-red-500">{absenceDeduction.toFixed(2)} {settings.currency}</span>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" loading={absenceSubmitting}>
          {absenceSubmitting ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div className="flex items-center justify-between mb-4 -mt-2">
        <div className="flex items-center gap-4">
          {employee.photoUrl ? (
            <img src={avatarUrl ?? employee.photoUrl} alt={employee.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('employees.register_event_for', { date: format(date, 'dd/MM/yyyy') })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{employee.name}</p>
          </div>
        </div>
      </div>
      <div className="border-b border-gray-200 dark:border-neutral-800">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => setActiveTab('delay')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'delay' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {t('employees.delays')}
          </button>
          <button onClick={() => setActiveTab('absence')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'absence' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            {t('employees.absences')}
          </button>
        </nav>
      </div>
      <div className="py-6">
        {activeTab === 'delay' ? renderDelayForm() : renderAbsenceForm()}
      </div>
    </Modal>
  );
};

export default AttendanceFormModal;
