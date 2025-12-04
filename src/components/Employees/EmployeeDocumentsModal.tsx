import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Employee, EmployeeDocument } from '../../types';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { Upload, Trash2, Eye, File } from 'lucide-react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import DocumentViewerModal from './DocumentViewerModal';
import { generateId } from '../../utils/id';
import { storageService } from '../../services/storageService';

interface EmployeeDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const EmployeeDocumentsModal: React.FC<EmployeeDocumentsModalProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const { addDocumentToEmployee, deleteDocumentFromEmployee } = useEmployeeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('other');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<EmployeeDocument | null>(null);
  const [signing, setSigning] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { path } = await storageService.upload(
          file,
          file.name,
          'employee_doc',
          employee.id,
          { type: documentType },
          'employee_docs'
        );
        const signedUrl = await storageService.getSignedUrl(path, 60, 'employee_docs');
        const newDocument: EmployeeDocument = {
          id: generateId(),
          name: file.name,
          type: documentType,
          url: signedUrl,
          path,
          uploadedAt: new Date(),
        };
        await addDocumentToEmployee(employee.id, newDocument);
      } catch (error) {
        console.error('Falha ao enviar documento', error);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleViewDocument = async (doc: EmployeeDocument) => {
    setSigning(true);
    try {
      const signedUrl = await storageService.getSignedUrl(doc.path ?? doc.url, 60, 'employee_docs');
      setViewingDocument({ ...doc, url: signedUrl });
    } catch (error) {
      console.error('Falha ao abrir documento', error);
      setViewingDocument(doc);
    } finally {
      setSigning(false);
    }
    setIsViewerOpen(true);
  };

  const documentTypeOptions = ['bi', 'nuit', 'cv', 'criminal_record', 'other'];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={t('employees.documents_title', { name: employee.name })} size="xl">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('employees.document_type')}</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {documentTypeOptions.map(type => (
                  <option key={type} value={type}>{t(`employees.document_types.${type}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex-shrink-0 self-end">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
              <Button onClick={handleUploadClick} icon={Upload}>{t('employees.upload_document')}</Button>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {employee.documents.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {employee.documents.map(doc => (
                  <li key={doc.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t(`employees.document_types.${doc.type}`)} - {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="ghost" icon={Eye} onClick={() => handleViewDocument(doc)} title={t('common.view')} />
                      <Button size="sm" variant="ghost" className="text-red-500" icon={Trash2} onClick={() => { void deleteDocumentFromEmployee(employee.id, doc.id); }} title={t('common.delete')} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">{t('employees.no_documents')}</p>
            )}
          </div>
        </div>
      </Modal>

      {viewingDocument && (
        <DocumentViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          document={viewingDocument}
        />
      )}
    </>
  );
};

export default EmployeeDocumentsModal;
