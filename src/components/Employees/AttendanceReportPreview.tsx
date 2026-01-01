import React from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Employee, AttendanceEvent, Delay } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ASSETS } from '../../utils/assetPath';

interface AttendanceReportPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  monthEvents: AttendanceEvent[];
  currentDate: Date;
}

const AttendanceReportPreview: React.FC<AttendanceReportPreviewProps> = ({ isOpen, onClose, employee, monthEvents, currentDate }) => {
  const { t } = useTranslation();
  const { settings } = useStore();
  const { company } = settings;

  const handlePrint = () => {
    window.print();
  };
  
  const grossSalary = employee.salary || 0;
  const totalAbsenceDeduction = monthEvents.filter(e => e.type === 'absence').reduce((sum, e) => sum + e.deduction, 0);
  const totalDelayDeduction = monthEvents.filter(e => e.type === 'delay').reduce((sum, e) => sum + e.deduction, 0);
  const netSalary = grossSalary - totalAbsenceDeduction - totalDelayDeduction;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employees.attendance_report')} size="2xl" printable>
      <div className="printable-area">
        <div id="report-content" className="bg-white text-black p-8 font-sans printable-content text-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <img src={ASSETS.LOGO} alt="Logo" className="h-16 w-auto object-contain mx-auto mb-4" />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center mb-2">{t('employees.attendance_report')}</h1>
          <p className="text-center text-base mb-8">{employee.name} - {format(currentDate, 'MMMM yyyy', { locale: pt })}</p>

          {/* Agreement Text */}
          <p className="text-justify mb-6 leading-relaxed">
            Prezado(a) funcionário(a), este documento detalha os descontos aplicados ao seu salário, referentes a faltas e atrasos no período indicado, em conformidade com as políticas da {company.name}. Solicitamos que revise as informações e, em caso de concordância, assine abaixo como prova de conhecimento e aceitação dos valores apresentados.
          </p>

          {/* Salary Calculation Table */}
          <table className="w-full mb-8 border-collapse">
            <tbody>
              <tr className="border-y">
                <td className="py-2">Salário Bruto</td>
                <td className="py-2 text-right">{grossSalary.toFixed(2)} {settings.currency}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">(-) Total de Faltas</td>
                <td className="py-2 text-right text-red-600">{totalAbsenceDeduction.toFixed(2)} {settings.currency}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">(-) Total de Atrasos</td>
                <td className="py-2 text-right text-red-600">{totalDelayDeduction.toFixed(2)} {settings.currency}</td>
              </tr>
              <tr className="font-bold text-base">
                <td className="py-3">Salário Líquido</td>
                <td className="py-3 text-right">{netSalary.toFixed(2)} {settings.currency}</td>
              </tr>
            </tbody>
          </table>

          {/* Detailed Events Table */}
          {monthEvents.length > 0 && (
            <div className="mb-8" style={{ pageBreakInside: 'auto' }}>
              <h2 className="text-lg font-bold mb-4">Detalhes das Ocorrências</h2>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2 border border-gray-400">Data</th>
                    <th className="p-2 border border-gray-400">Tipo</th>
                    <th className="p-2 border border-gray-400">Detalhes</th>
                    <th className="p-2 border border-gray-400 text-right">Dedução</th>
                  </tr>
                </thead>
                <tbody>
                  {monthEvents.map(event => (
                    <tr key={event.id} className="border-b border-gray-300">
                      <td className="p-2 border border-gray-400">{format(event.date, 'dd/MM/yyyy')}</td>
                      <td className="p-2 border border-gray-400">{event.type === 'absence' ? t('employees.absences_short') : t('employees.delays_short')}</td>
                      <td className="p-2 border border-gray-400">
                        {event.type === 'absence'
                          ? t('employees.full_day_absence_label')
                          : `${t('employees.standard_time')}: ${employee.workSchedule.start}, ${t('employees.actual_time')}: ${(event as Delay).actualArrivalTime} (${(event as Delay).minutes} min)`}
                      </td>
                      <td className="p-2 border border-gray-400 text-right">{event.deduction.toFixed(2)} {settings.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Signature */}
          <div className="mt-24" style={{ pageBreakInside: 'avoid' }}>
            <p className="text-center mb-8">Data: {format(new Date(), 'dd/MM/yyyy')}</p>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="border-t border-black px-16 pt-2">Assinatura do Funcionário</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 no-print">
        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
        <Button onClick={handlePrint} icon={Printer}>{t('common.print')}</Button>
      </div>
    </Modal>
  );
};

export default AttendanceReportPreview;
