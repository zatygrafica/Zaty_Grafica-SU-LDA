import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useStore } from '../../store/useStore';
import { Employee } from '../../types';
import { Plus, Search, Edit, Trash2, UserCheck, FileText, FileSignature, CalendarDays, DollarSign, File } from 'lucide-react';
import { format } from 'date-fns';

import Button from '../Common/Button';
import Input from '../Common/Input';
import ConfirmationModal from '../Common/ConfirmationModal';
import EmployeeForm from './EmployeeForm';
import EmployeeDocumentsModal from './EmployeeDocumentsModal';
import EmploymentTermModal from './EmploymentTermModal';
import AttendanceModal from './AttendanceModal';
import PaySalaryModal from './PaySalaryModal';
import EmployeeSheetModal from './EmployeeSheetModal';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import ModuleDataState from '../Common/ModuleDataState';
import { CardGridSkeleton, TableSkeleton } from '../Common/SkeletonLoaders';
import { useLoadEmployeesOnMount } from '../../hooks/useModuleLoaders';
import { storageService } from '../../services/storageService';
import Avatar from '../Common/Avatar';

const EmployeesModule: React.FC = () => {
  const { t } = useTranslation();
  const { employees, deleteEmployeeById } = useEmployeeStore();
  const { currentUser, settings } = useStore();
  const {
    loading: employeesLoading,
    hasLoaded: employeesLoaded,
    error: employeesError,
    reload: reloadEmployees,
  } = useLoadEmployeesOnMount();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  const [isTermOpen, setIsTermOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isPaySalaryOpen, setIsPaySalaryOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = currentUser?.role === 'admin';
  const isMobile = useMediaQuery('(max-width: 767px)');
  const skeleton = isMobile ? <CardGridSkeleton cards={6} /> : <TableSkeleton rows={6} columns={5} />;

  const handleOpenForm = (employee: Employee | null = null) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleOpenDocuments = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDocumentsOpen(true);
  };

  const handleOpenTerm = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsTermOpen(true);
  };

  const handleOpenAttendance = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsAttendanceOpen(true);
  };

  const handleOpenPaySalary = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPaySalaryOpen(true);
  };
  
  const handleOpenSheet = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setEmployeeToDelete(id);
    setIsPasswordPromptOpen(true);
  };

  const proceedToDelete = () => {
    setIsPasswordPromptOpen(false);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      await deleteEmployeeById(employeeToDelete);
    }
    setIsConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  const filteredEmployees = useMemo(() => {
    return employees
      .filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t(`employees.positions.${employee.position}`).toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, searchTerm, t]);

  // Carrega fotos rapidamente usando cache de URLs assinadas
  useEffect(() => {
    const cachedEntries = employees
      .filter((e) => e.photoUrl && !avatarCache[e.id])
      .map((e) => {
        const cached = storageService.getCachedSignedUrl(e.photoUrl!, 'profile_photos');
        return cached ? [e.id, cached] as const : null;
      })
      .filter((e): e is [string, string] => Boolean(e));

    if (cachedEntries.length > 0) {
      setAvatarCache((prev) => ({ ...prev, ...Object.fromEntries(cachedEntries) }));
    }

    const loadAvatars = async () => {
      const entries = await Promise.all(
        employees
          .filter((e) => e.photoUrl && !avatarCache[e.id])
          .map(async (e) => {
            try {
              const url = await storageService.getSignedUrlCached(e.photoUrl!, 900, 'profile_photos');
              return [e.id, url] as const;
            } catch (err) {
              console.warn('Employee avatar URL fail', err);
              return null;
            }
          })
      );
      const mapped = entries.filter((e): e is [string, string] => Boolean(e));
      if (mapped.length > 0) {
        setAvatarCache((prev) => ({ ...prev, ...Object.fromEntries(mapped) }));
      }
    };

    void loadAvatars();
  }, [employees, avatarCache]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('employees.title')}
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <Input
            placeholder={t('common.search_placeholder')}
            icon={Search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button onClick={() => handleOpenForm()} icon={Plus}>
            {!isMobile && t('employees.new_employee')}
          </Button>
        </div>
      </div>

      <ModuleDataState
        loading={employeesLoading}
        hasLoaded={employeesLoaded}
        error={employeesError}
        onRetry={reloadEmployees}
        skeleton={skeleton}
      >
        {isMobile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-white/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Avatar
                    name={employee.name}
                    src={employee.photoUrl ? avatarCache[employee.id] ?? employee.photoUrl : undefined}
                    size="w-12 h-12"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{employee.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t(`employees.positions.${employee.position}`)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{employee.phone}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('common.date')}: {format(new Date(employee.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200/80 dark:border-neutral-800/50 flex items-center justify-end space-x-1 flex-wrap gap-1">
                {isAdmin && <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleOpenPaySalary(employee)} icon={DollarSign} title={t('employees.pay_salary')} />}
                <Button size="sm" variant="ghost" onClick={() => handleOpenAttendance(employee)} icon={CalendarDays} title={t('employees.attendance')} />
                <Button size="sm" variant="ghost" onClick={() => handleOpenDocuments(employee)} icon={File} title={t('employees.documents', { defaultValue: 'Documentos' })} />
                <Button size="sm" variant="ghost" onClick={() => handleOpenSheet(employee)} icon={FileText} title={t('employees.employee_sheet')} />
                <Button size="sm" variant="ghost" onClick={() => handleOpenTerm(employee)} icon={FileSignature} title={t('employees.employment_term')} />
                <Button size="sm" variant="ghost" onClick={() => handleOpenForm(employee)} icon={Edit} title={t('common.edit')} />
                {isAdmin && <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(employee.id)} icon={Trash2} title={t('common.delete')} />}
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900/80 dark:backdrop-blur-lg rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200/80 dark:divide-neutral-800/50">
              <thead className="bg-gray-50/5 dark:bg-neutral-800/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('employees.position')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('employees.contact')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80 dark:divide-neutral-800/50">
                {filteredEmployees.length > 0 ? filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-500/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-3">
                      <Avatar
                        name={employee.name}
                        src={employee.photoUrl ? avatarCache[employee.id] ?? employee.photoUrl : undefined}
                        size="w-8 h-8"
                      />
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{t(`employees.positions.${employee.position}`)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{employee.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{format(new Date(employee.createdAt), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        {isAdmin && <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleOpenPaySalary(employee)} icon={DollarSign} title={t('employees.pay_salary')} />}
                        <Button size="sm" variant="ghost" onClick={() => handleOpenAttendance(employee)} icon={CalendarDays} title={t('employees.attendance')} />
                        <Button size="sm" variant="ghost" onClick={() => handleOpenDocuments(employee)} icon={File} title={t('employees.documents', { defaultValue: 'Documentos' })} />
                        <Button size="sm" variant="ghost" onClick={() => handleOpenSheet(employee)} icon={FileText} title={t('employees.employee_sheet')} />
                        <Button size="sm" variant="ghost" onClick={() => handleOpenTerm(employee)} icon={FileSignature} title={t('employees.employment_term')} />
                        <Button size="sm" variant="ghost" onClick={() => handleOpenForm(employee)} icon={Edit} title={t('common.edit')} />
                        {isAdmin && <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(employee.id)} icon={Trash2} title={t('common.delete')} />}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-neutral-900/70 dark:backdrop-blur-lg border border-gray-200 dark:border-white/20">
                        <UserCheck className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{t('employees.no_employees_found')}</h3>
                      <p className="mt-1 text-sm text-gray-500">{t('employees.no_employees_found_description')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </ModuleDataState>

      {isFormOpen && (
        <EmployeeForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          employee={selectedEmployee}
        />
      )}
      
      {isDocumentsOpen && selectedEmployee && (
        <EmployeeDocumentsModal
          isOpen={isDocumentsOpen}
          onClose={() => setIsDocumentsOpen(false)}
          employee={selectedEmployee}
        />
      )}

      {isTermOpen && selectedEmployee && (
        <EmploymentTermModal
          isOpen={isTermOpen}
          onClose={() => setIsTermOpen(false)}
          employee={selectedEmployee}
        />
      )}

      {isAttendanceOpen && selectedEmployee && (
        <AttendanceModal
          isOpen={isAttendanceOpen}
          onClose={() => setIsAttendanceOpen(false)}
          employee={selectedEmployee}
        />
      )}

      {isPaySalaryOpen && selectedEmployee && (
        <PaySalaryModal
          isOpen={isPaySalaryOpen}
          onClose={() => setIsPaySalaryOpen(false)}
          employee={selectedEmployee}
        />
      )}

      {isSheetOpen && selectedEmployee && (
        <EmployeeSheetModal
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          employee={selectedEmployee}
        />
      )}

      {isAdmin && (
        <PasswordPromptModal
          isOpen={isPasswordPromptOpen}
          onClose={() => setIsPasswordPromptOpen(false)}
          onSuccess={proceedToDelete}
          passwordToMatch={settings.deletionPassword || ''}
          title={t('security.deletion_password_prompt_title')}
          message={t('security.deletion_password_prompt_message')}
        />
      )}

      {isAdmin && (
        <ConfirmationModal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmDelete}
          title={t('employees.delete_employee')}
          message={t('employees.delete_employee_confirm')}
        />
      )}
    </div>
  );
};

export default EmployeesModule;
