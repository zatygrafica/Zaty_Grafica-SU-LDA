import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Employee, EmployeeDocument } from '../../types';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { Upload, Trash2, Eye, File } from 'lucide-react';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import DocumentViewerModal from './DocumentViewerModal';
import { generateId } from '../../utils/id';
import { storageService } from '../../services/storageService';
import { supabase } from '../../services/supabaseClient';

interface EmployeeDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

const EmployeeDocumentsModal: React.FC<EmployeeDocumentsModalProps> = ({ isOpen, onClose, employee }) => {
  const { t } = useTranslation();
  const employees = useEmployeeStore((state) => state.employees);
  const { addDocumentToEmployee, deleteDocumentFromEmployee, listEmployees } = useEmployeeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState('other');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<EmployeeDocument | null>(null);
  const [signing, setSigning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Sempre usa a versão mais recente do funcionário (realtime)
  const currentEmployee = useMemo(
    () => employees.find((e) => e.id === employee.id) ?? employee,
    [employees, employee]
  );

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setUploading(true);
        const { path } = await storageService.upload(
          file,
          file.name,
          'employee_doc',
          currentEmployee.id,
          { type: documentType },
          'employee_docs'
        );
        const newDocument: EmployeeDocument = {
          id: generateId(),
          name: file.name,
          type: documentType,
          url: path, // armazenamos o path; a URL assinada é gerada na visualização
          path,
          uploadedAt: new Date(),
        };
        await addDocumentToEmployee(currentEmployee.id, newDocument);
      } catch (error) {
        console.error('Falha ao enviar documento', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleViewDocument = async (doc: EmployeeDocument) => {
    // Abre modal com doc imediatamente (usa path, se houver)
    const baseDoc = doc.path ? { ...doc, url: doc.path } : doc;
    setViewingDocument(baseDoc);
    setIsViewerOpen(true);
    setSigning(true);
    try {
      const signedUrl = await storageService.getSignedUrlCached(doc.path ?? doc.url, 900, 'employee_docs');
      setViewingDocument({ ...baseDoc, url: signedUrl });
    } catch (error) {
      console.error('Falha ao abrir documento', error);
    } finally {
      setSigning(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      setDeletingDocId(docId);
      await deleteDocumentFromEmployee(currentEmployee.id, docId);
    } catch (error) {
      console.error('Falha ao excluir documento', error);
    } finally {
      setDeletingDocId((prev) => (prev === docId ? null : prev));
    }
  };

  const documentTypeOptions = ['bi', 'nuit', 'cv', 'criminal_record', 'other'];

  // Realtime: escuta mudanças na linha do funcionário e recarrega lista
  useEffect(() => {
    if (!isOpen) return;
    if (!currentEmployee?.id) return;

    const channel = supabase
      .channel(`employee-docs-${currentEmployee.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees', filter: `id=eq.${currentEmployee.id}` },
        async () => {
          try {
            await listEmployees(true);
          } catch (error) {
            console.error('Falha ao atualizar documentos em tempo real', error);
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [currentEmployee?.id, isOpen, listEmployees]);

  // Título com fallback seguro
  const translatedTitle = t('employees.documents_title', { name: currentEmployee.name });
  const documentsTitle =
    translatedTitle && !translatedTitle.includes('{name}')
      ? translatedTitle
      : `Documentos de ${currentEmployee.name}`;

  const docs = currentEmployee.documents ?? [];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={documentsTitle} size="xl">
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
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="*/*" />
              <Button onClick={handleUploadClick} icon={Upload} disabled={uploading || signing}>
                {uploading ? t('common.loading', { defaultValue: 'Carregando...' }) : t('employees.upload_document')}
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {docs.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {docs.map(doc => (
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        icon={Trash2}
                        disabled={deletingDocId === doc.id}
                        onClick={() => { void handleDeleteDocument(doc.id); }}
                        title={t('common.delete')}
                      />
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
