import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Employee } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer, User } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { storageService } from '../../services/storageService';
import Avatar from '../Common/Avatar';

interface EmployeeSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const EmployeeSheetModal: React.FC<EmployeeSheetModalProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

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

  const handlePrint = () => {
    if (sheetRef.current) {
      html2canvas(sheetRef.current, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgWidth / imgHeight;
        const width = pdfWidth - 20; // with margin
        const height = width / ratio;
        
        pdf.addImage(imgData, 'PNG', 10, 10, width, height);
        pdf.save(`ficha_${employee.name.replace(/ /g, '_')}.pdf`);
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employees.employee_sheet')} size="lg">
      <div id="employee-sheet-content" ref={sheetRef} className="bg-white text-black p-8 font-sans">
        <h1 className="text-2xl font-bold text-center mb-6">{t('employees.employee_sheet')}</h1>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <Avatar
            name={employee.name}
            src={employee.photoUrl ? avatarUrl ?? employee.photoUrl : undefined}
            size="w-32 h-32"
            className="border-4 border-gray-300"
          />
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold">{employee.name}</h2>
            <p className="text-gray-600">{t(`employees.positions.${employee.position}`)}</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.mother_name')}</strong>
            <span>{employee.motherName || 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('common.phone')}</strong>
            <span>{employee.phone}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('common.email')}</strong>
            <span>{employee.email || 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.nuit')}</strong>
            <span>{employee.nuit || 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.document_type_label')}</strong>
            <span>{employee.documentType ? t(`employees.document_types_form.${employee.documentType}`) : 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.document_number')}</strong>
            <span>{employee.documentNumber || 'N/A'}</span>
          </div>
          <div className="border-b pb-2 col-span-2">
            <strong className="text-gray-500 block">{t('common.address')}</strong>
            <span>{employee.address || 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.neighborhood')}</strong>
            <span>{employee.neighborhood || 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('common.city')}</strong>
            <span>{employee.city || 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.start_date')}</strong>
            <span>{employee.startDate ? format(new Date(employee.startDate), 'dd/MM/yyyy') : 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.payment_date')}</strong>
            <span>{employee.paymentDate ? `Dia ${employee.paymentDate} de cada mês` : 'N/A'}</span>
          </div>
          <div className="border-b pb-2">
            <strong className="text-gray-500 block">{t('employees.salary')}</strong>
            <span>{(employee.salary || 0).toFixed(2)} MZN</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6">
        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
        <Button onClick={handlePrint} icon={Printer}>{t('common.print')}</Button>
      </div>
    </Modal>
  );
};

export default EmployeeSheetModal;
