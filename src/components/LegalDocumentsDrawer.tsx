import React, { useState, useEffect } from 'react';
import { FileText, Shield, HelpCircle, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PrivacyPolicy from '../pages/PrivacyPolicy';
import TermsOfUse from '../pages/TermsOfUse';
import HelpPanel from './HelpPanel';

// Legal Documents Drawer with Help Panel
interface LegalDocumentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocument?: 'privacy' | 'terms' | null;
}

const LegalDocumentsDrawer: React.FC<LegalDocumentsDrawerProps> = ({
  isOpen,
  onClose,
  selectedDocument: initialDocument,
}) => {
  const { t } = useTranslation();
  const [selectedDocument, setSelectedDocument] = useState<'privacy' | 'terms'>('privacy');
  const [helpPanelOpen, setHelpPanelOpen] = useState(false);

  // Update selected document when prop changes
  useEffect(() => {
    if (initialDocument) {
      setSelectedDocument(initialDocument);
    }
  }, [initialDocument]);

  if (!isOpen) return null;

  const documents = [
    {
      id: 'privacy' as const,
      icon: Shield,
      title: t('legal.privacy_policy.title'),
    },
    {
      id: 'terms' as const,
      icon: FileText,
      title: t('legal.terms_of_use.title'),
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer - Full Width from left to right */}
      <div className="fixed inset-0 bg-white dark:bg-neutral-900 shadow-2xl z-50 flex transition-transform">
        {/* Left Sidebar - Document List */}
        <div className="w-64 bg-gray-50 dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Documentos Legais
            </h3>
          </div>

          {/* Document List */}
          <nav className="flex-1 p-2 overflow-y-auto">
            {documents.map((doc) => {
              const Icon = doc.icon;
              const isSelected = selectedDocument === doc.id;

              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all mb-1 ${
                    isSelected
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${
                    isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                  <span className="text-sm font-medium line-clamp-2">{doc.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content - Document Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Header */}
          <div className="bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedDocument === 'privacy' ? (
                  <>
                    <Shield className="h-6 w-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('legal.privacy_policy.title')}
                    </h2>
                  </>
                ) : (
                  <>
                    <FileText className="h-6 w-6 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t('legal.terms_of_use.title')}
                    </h2>
                  </>
                )}
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-3">
                {/* Help Icon - No background */}
                <button
                  onClick={() => setHelpPanelOpen(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-600 dark:text-gray-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all duration-300"
                  aria-label="Ajuda"
                >
                  <HelpCircle className="h-6 w-6" />
                </button>

                {/* Login Button */}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 dark:hover:from-cyan-400 dark:hover:to-blue-500 shadow-md hover:shadow-lg transition-all duration-300"
                  aria-label="Voltar para Login"
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">Login</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-neutral-900">
            <div className="max-w-4xl">
              {selectedDocument === 'privacy' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <PrivacyPolicy embedded />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <TermsOfUse embedded />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Panel */}
      <HelpPanel
        isOpen={helpPanelOpen}
        onClose={() => setHelpPanelOpen(false)}
      />
    </>
  );
};

export default LegalDocumentsDrawer;
