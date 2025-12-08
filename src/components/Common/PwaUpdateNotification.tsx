import React from 'react';
import DOMPurify from 'dompurify';
import { useTranslation } from 'react-i18next';
import { Gift } from 'lucide-react';
import Button from './Button';
import Modal from './Modal';
import { releaseNotes } from '../../releaseNotes';

interface PwaUpdateNotificationProps {
  onUpdate: () => void;
  onClose: () => void;
}

const PwaUpdateNotification: React.FC<PwaUpdateNotificationProps> = ({ onUpdate, onClose }) => {
  const { t } = useTranslation();

  // Processa as notas da versão para criar uma lista HTML
  const notesList = releaseNotes
    .split('- ')
    .map(note => note.trim())
    .filter(note => note.length > 0);

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('pwa.update_available_title')}
      size="lg"
    >
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
          <Gift className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('pwa.update_available_message')}
        </p>
        
        <div className="max-h-60 overflow-y-auto text-left bg-gray-50 dark:bg-neutral-800/50 p-4 rounded-lg border dark:border-neutral-700/50">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t('pwa_update.whats_new')}</h4>
          <ul className="space-y-2 list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
            {notesList.map((note, index) => (
              <li key={index} dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  note.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                  {
                    ALLOWED_TAGS: ['strong', 'em'],
                    ALLOWED_ATTR: [],
                  }
                )
              }} />
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          {t('pwa.update_later')}
        </Button>
        <Button variant="primary" onClick={onUpdate}>
          {t('pwa.update_now')}
        </Button>
      </div>
    </Modal>
  );
};

export default PwaUpdateNotification;
