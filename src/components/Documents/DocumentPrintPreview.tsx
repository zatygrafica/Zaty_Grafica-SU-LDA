import React from 'react';
import DOMPurify from 'dompurify';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import { Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface DocumentPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  fontFamily: 'serif' | 'sans';
}

const DocumentPrintPreview: React.FC<DocumentPrintPreviewProps> = ({ isOpen, onClose, content, title, fontFamily }) => {
  const { t } = useTranslation();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="2xl" printable>
      <div className={clsx("printable-area", fontFamily === 'sans' ? 'font-sans' : 'font-serif')}>
        <div id="document-viewer-modal">
          <div id="document-viewer-content" className="bg-white text-black p-8 printable-content">
             <style>
              {`
                .section-title {
                  background-color: #e5e7eb; /* gray-200 */
                  padding: 4px 8px;
                  font-weight: bold;
                  margin-top: 1rem;
                  margin-bottom: 0.5rem;
                }
              `}
            </style>
            <div dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(content, {
                ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'span', 'table', 'tr', 'td', 'th', 'thead', 'tbody'],
                ALLOWED_ATTR: ['class', 'style'],
              })
            }} />
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

export default DocumentPrintPreview;
