import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import { Employee } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer, Edit, Save, RotateCcw } from 'lucide-react';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useStore } from '../../store/useStore';
import { ASSETS } from '../../utils/assetPath';

interface EmploymentTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const EmploymentTermModal: React.FC<EmploymentTermModalProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const { updateCustomTerm } = useEmployeeStore();
  const { settings } = useStore();
  const { company } = settings;
  const termRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const getPositionSpecificClauses = useCallback((position: Employee['position']): string[] => {
    let clauseKey = position;
    // Group security roles for clauses
    if (position.startsWith('security')) {
      clauseKey = 'security';
    }
    const key = `employees.term.position_clauses.${clauseKey}`;
    
    // Use i18next to get an array of strings
    const clauses = t(key, { returnObjects: true });

    // Check if the result is an array and not just the key itself
    if (Array.isArray(clauses)) {
      return clauses;
    }
    
    return []; // Return empty array if no specific clauses are found
  }, [t]);

  const generateDefaultTerm = useCallback(() => {
    const generalClauses = t('employees.term.general_clauses', { returnObjects: true }) as string[];
    const specificClauses = getPositionSpecificClauses(employee.position);
    
    const allClauses = [...generalClauses, ...specificClauses];

    const header = `
      <div style="text-align: center; margin-bottom: 2rem;">
        <img src="${ASSETS.LOGO}" alt="Logo" style="height: 4rem; width: auto; object-fit: contain; display: inline-block;" />
      </div>
    `;

    const body = `
      <div class="prose prose-sm max-w-none text-justify">
        <h1 class="text-center text-lg font-bold mb-8">${t('employees.term.title')}</h1>
        <p class="mb-4"><strong>${t('employees.term.between')}</strong></p>
        <p>${t('employees.term.first_party', { name: company.name, address: company.address, nuit: company.nuit })}</p>
        <p class="my-4"><strong>${t('employees.term.and')}</strong></p>
        <p>${t('employees.term.second_party', { name: employee.name, documentNumber: employee.documentNumber || 'N/A', address: employee.address || 'N/A' })}</p>
        <p class="mt-8 mb-4">${t('employees.term.clauses_title')}</p>
        <ol class="list-decimal pl-5 space-y-2">
          ${allClauses.map(clause => `<li>${clause.replace('{{position}}', t(`employees.positions.${employee.position}`))}</li>`).join('')}
        </ol>
        <p class="mt-8">${t('employees.term.declaration')}</p>
        <div class="mt-24">
          <div class="flex justify-between text-center" style="page-break-inside: avoid;">
            <div class="w-1/2">
              <div class="border-t border-black w-2/3 mx-auto pt-1">${t('employees.term.employer_signature')}</div>
            </div>
            <div class="w-1/2">
              <div class="border-t border-black w-2/3 mx-auto pt-1">${t('employees.term.employee_signature')}</div>
            </div>
          </div>
          <p class="text-center mt-8">
            ${t('employees.term.location_date', { date: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) })}
          </p>
        </div>
      </div>
    `;

    return header + body;
  }, [t, company, employee, getPositionSpecificClauses]);

  useEffect(() => {
    if (isOpen) {
      setEditedContent(employee.customTerm || generateDefaultTerm());
    }
  }, [employee, isOpen, generateDefaultTerm]);


  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    await updateCustomTerm(employee.id, editedContent);
    setIsEditing(false);
  };

  const handleReset = async () => {
    const defaultTerm = generateDefaultTerm();
    setEditedContent(defaultTerm);
    await updateCustomTerm(employee.id, undefined);
    setIsEditing(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employees.term.title')} size="2xl" printable>
      <div className="printable-area">
        <div id="term-preview-modal">
          <div ref={termRef} id="term-content" className="bg-white text-black p-16 font-serif printable-content">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-[60vh] font-mono text-xs border border-gray-300 p-2 rounded"
              />
            ) : (
              <div dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(editedContent, {
                  ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'img', 'span'],
                  ALLOWED_ATTR: ['class', 'style', 'src', 'alt', 'height', 'width'],
                  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                })
              }} />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 no-print">
        {isEditing ? (
          <>
            <Button variant="secondary" onClick={() => setIsEditing(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} icon={Save}>{t('employees.term.save_custom_term')}</Button>
            <Button variant="danger" onClick={handleReset} icon={RotateCcw}>{t('employees.term.reset_to_default')}</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
            <Button onClick={() => setIsEditing(true)} icon={Edit}>{t('employees.term.edit_term')}</Button>
            <Button onClick={handlePrint} icon={Printer}>{t('common.print')}</Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default EmploymentTermModal;
