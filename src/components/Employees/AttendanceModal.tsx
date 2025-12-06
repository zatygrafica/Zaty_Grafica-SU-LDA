import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Printer, XCircle, Clock, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';

import { Employee, Delay } from '../../types';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useStore } from '../../store/useStore';
import { storageService } from '../../services/storageService';

import Modal from '../Common/Modal';
import Button from '../Common/Button';
import AttendanceFormModal from './AttendanceFormModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import AttendanceReportPreview from './AttendanceReportPreview';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const { getEventsForMonth, deleteEventById, subscribeToRealtime } = useAttendanceStore();
  const { settings } = useStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetail, setDayDetail] = useState<Date | null>(null);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  const monthEvents = useMemo(() => getEventsForMonth(employee.id, currentDate), [getEventsForMonth, employee.id, currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const startingDayIndex = getDay(startOfMonth(currentDate));

  const handleOpenForm = (day: Date) => {
    setSelectedDate(day);
    setIsFormOpen(true);
  };

  const handleDayClick = (day: Date) => {
    setDayDetail(day);
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setIsPasswordPromptOpen(true);
  };

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
  
  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete) {
      await deleteEventById(eventToDelete);
      setDayDetail(prev => prev ? new Date(prev) : null);
    }
    setIsConfirmDeleteOpen(false);
    setEventToDelete(null);
  };

  const totalDeductions = monthEvents.reduce((sum, event) => sum + event.deduction, 0);
  const netSalary = (employee.salary || 0) - totalDeductions;

  const handleOpenPreview = () => {
    setIsPreviewOpen(true);
  };

  const dayDetailEvents = dayDetail ? monthEvents.filter(e => isSameDay(e.date, dayDetail)) : [];

  useEffect(() => {
    if (!isOpen) return;
    const unsubscribe = subscribeToRealtime();
    return () => {
      unsubscribe?.();
    };
  }, [isOpen, subscribeToRealtime]);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="2xl">
        <div className="flex items-center justify-between mb-6 -mt-2">
            <div className="flex items-center gap-4">
            {employee.photoUrl ? (
              <img src={avatarUrl ?? employee.photoUrl} alt={employee.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('employees.attendance')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{employee.name}</p>
              </div>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))} icon={ChevronLeft} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {format(currentDate, 'MMMM yyyy', { locale: pt })}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))} icon={ChevronRight} />
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="font-medium text-gray-500 dark:text-gray-400">{day}</div>
              ))}
              {Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} />)}
              {daysInMonth.map(day => {
                const dayEvents = monthEvents.filter(e => isSameDay(e.date, day));
                const hasAbsence = dayEvents.some(e => e.type === 'absence');
                const hasDelay = dayEvents.some(e => e.type === 'delay');

                return (
                  <div
                    key={day.toString()}
                    onClick={() => handleDayClick(day)}
                    className={clsx(
                      'p-1 rounded-lg cursor-pointer transition-colors relative h-16 flex flex-col items-center justify-center',
                      isSameMonth(day, currentDate) ? 'bg-gray-50 dark:bg-neutral-800/50' : 'bg-gray-100 dark:bg-neutral-900 text-gray-400',
                      isSameDay(day, new Date()) && 'ring-2 ring-primary-500',
                      dayDetail && isSameDay(day, dayDetail) && 'bg-primary-100 dark:bg-primary-900/30',
                      'hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    )}
                  >
                    <span className="text-gray-800 dark:text-gray-200">{format(day, 'd')}</span>
                    <div className="mt-1 flex flex-col items-center text-[10px] leading-tight">
                      {hasAbsence && <span className="font-bold text-red-500">{t('employees.absences_short')}</span>}
                      {hasDelay && <span className="font-bold text-yellow-600">{t('employees.delays_short')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-1 bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg border dark:border-neutral-800 h-full flex flex-col">
            <h4 className="font-bold mb-4 text-gray-900 dark:text-white">{t('employees.event_details_for', { date: dayDetail ? format(dayDetail, 'dd/MM/yyyy') : '...' })}</h4>
            {dayDetail ? (
              <div className="flex-grow space-y-3 overflow-y-auto">
                {dayDetailEvents.length > 0 ? (
                  dayDetailEvents.map(event => (
                    <div key={event.id} className="p-3 rounded-md bg-white dark:bg-neutral-800 border dark:border-neutral-700 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {event.type === 'absence' ? <XCircle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-yellow-500" />}
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">{event.type === 'absence' ? t('employees.absences_short') : t('employees.delays_short')}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 text-xs"
                          onClick={() => handleDeleteClick(event.id)}
                          title={t('employees.unmark_occurrence')}
                        >
                          {t('employees.unmark_occurrence')}
                        </Button>
                      </div>
                      {event.type === 'delay' ? (
                        <div className="space-y-1 text-gray-800 dark:text-gray-300">
                          <p><strong>{t('employees.standard_time')}:</strong> {employee.workSchedule.start}</p>
                          <p><strong>{t('employees.actual_time')}:</strong> {(event as Delay).actualArrivalTime}</p>
                          <p><strong>{t('employees.duration')}:</strong> {(event as Delay).minutes} min</p>
                        </div>
                      ) : (
                        <p className="text-gray-800 dark:text-gray-300"><strong>{t('employees.full_day_absence_label')}</strong></p>
                      )}
                      <p className="text-gray-500 dark:text-gray-400 mt-1 italic">"{event.notes || 'Sem justificativa.'}"</p>
                      <p className="text-right font-bold text-red-500 mt-2">-{event.deduction.toFixed(2)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t('employees.no_events_for_day')}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center flex-grow flex items-center justify-center">Selecione um dia no calendário.</p>
            )}
            {dayDetail && <Button onClick={() => handleOpenForm(dayDetail)} className="w-full mt-4" size="sm">{t('employees.add_occurrence')}</Button>}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 dark:border-neutral-800 pt-4">
          <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{t('employees.attendance_report')}</h3>
          <div className="space-y-2 text-sm bg-gray-50 dark:bg-neutral-900 p-4 rounded-lg">
            <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>{t('employees.total_absences')}:</span><span className="font-medium text-gray-900 dark:text-white">{monthEvents.filter(e => e.type === 'absence').length}</span></div>
            <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>{t('employees.total_delays')}:</span><span className="font-medium text-gray-900 dark:text-white">{monthEvents.filter(e => e.type === 'delay').reduce((sum, d) => sum + (d as Delay).minutes, 0)} min</span></div>
            <div className="flex justify-between font-bold text-gray-600 dark:text-gray-300"><span>{t('employees.total_deductions')}:</span><span className="text-red-500">{totalDeductions.toFixed(2)} {settings.currency}</span></div>
            <div className="flex justify-between font-bold text-base text-green-600 dark:text-green-400 border-t border-gray-300 dark:border-neutral-700 mt-2 pt-2"><span>{t('employees.net_salary')}:</span><span>{netSalary.toFixed(2)} {settings.currency}</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleOpenPreview} icon={Printer} size="sm" variant="secondary">Visualizar e Imprimir</Button>
          </div>
        </div>
      </Modal>

      {selectedDate && (
        <AttendanceFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          employee={employee}
          date={selectedDate}
        />
      )}

      {isPreviewOpen && (
        <AttendanceReportPreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          employee={employee}
          monthEvents={monthEvents}
          currentDate={currentDate}
        />
      )}

      <PasswordPromptModal
        isOpen={isPasswordPromptOpen}
        onClose={() => setIsPasswordPromptOpen(false)}
        onSuccess={proceedToDelete}
        passwordToMatch={settings.deletionPassword || ''}
        title={t('security.deletion_password_prompt_title')}
        message={t('security.deletion_password_prompt_message')}
      />

      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
        title={t('employees.unmark_event_title')}
        message={t('employees.unmark_event_confirm')}
        confirmText={t('employees.unmark_occurrence')}
      />
    </>
  );
};

export default AttendanceModal;
