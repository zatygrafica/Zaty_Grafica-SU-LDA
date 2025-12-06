import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmployeeDocument } from '../../types';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer, Download } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: EmployeeDocument;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, document: doc }) => {
  const { t } = useTranslation();
  const lowerName = doc.name.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf');
  const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(lowerName);
  const isOfficeDoc = /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(lowerName);
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);

  // Garante URL válida antes de exibir/baixar/imprimir
  useEffect(() => {
    let active = true;
    const pathOrUrl = doc.path ?? doc.url;
    setSignedUrl(undefined);
    void storageService
      .getSignedUrlCached(pathOrUrl, 900, 'employee_docs')
      .then((url) => {
        if (active) setSignedUrl(url);
      })
      .catch(() => {
        if (active) setSignedUrl(pathOrUrl);
      });
    return () => {
      active = false;
    };
  }, [doc.path, doc.url]);

  const handlePrint = () => {
    // Abre iframe oculto com URL atualizada e aciona print
    const iframe = window.document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = signedUrl;
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 500);
    };
    window.document.body.appendChild(iframe);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={doc.name} size="2xl">
      <div id="document-viewer-modal">
        <div id="document-viewer-content" className="w-full h-[70vh] border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          {!signedUrl ? (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-300 p-4 text-center">
              {t('common.loading', { defaultValue: 'Carregando documento...' })}
            </div>
          ) : isPdf ? (
            <iframe src={signedUrl} title={doc.name} className="w-full h-full" />
          ) : isImage ? (
            <img src={signedUrl} alt={doc.name} className="w-full h-full object-contain" />
          ) : isOfficeDoc ? (
            <iframe
              src={`https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`}
              title={doc.name}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-600 dark:text-gray-300 p-4 text-center">
              {t('common.preview_not_supported', { defaultValue: 'Visualização não suportada. Baixe o arquivo para abrir.' })}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-6 no-print">
        <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
      </div>
    </Modal>
  );
};

export default DocumentViewerModal;
