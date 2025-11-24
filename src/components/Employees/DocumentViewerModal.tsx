import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmployeeDocument } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer, Download } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EmployeeDocument;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, document }) => {
  const { t } = useTranslation();
  const isPdf = document.name.toLowerCase().endsWith('.pdf');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={document.name} size="2xl">
      <div id="document-viewer-modal">
        <div id="document-viewer-content" className="w-full h-[70vh] border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          {isPdf ? (
            <iframe src={document.url} title={document.name} className="w-full h-full" />
          ) : (
            <img src={document.url} alt={document.name} className="w-full h-full object-contain" />
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 no-print">
        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
        <Button onClick={handlePrint} icon={Printer}>{t('common.print')}</Button>
        <a href={document.url} download={document.name}>
          <Button icon={Download}>{t('common.download')}</Button>
        </a>
      </div>
    </Modal>
  );
};

export default DocumentViewerModal;
