import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuditLogViewer from './AuditLogViewer';
import Button from '../Common/Button';
import PasswordPromptModal from '../Common/PasswordPromptModal';
import ConfirmationModal from '../Common/ConfirmationModal';
import { useStore } from '../../store/useStore';

const AuditModule: React.FC = () => {
    const { t } = useTranslation();
    const { settings, clearAuditLogs } = useStore();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);

    const handleClearClick = () => {
        setIsPasswordPromptOpen(true);
    };

    const proceedToConfirm = () => {
        setIsPasswordPromptOpen(false);
        setIsConfirmOpen(true);
    };
    
    const handleConfirm = () => {
        clearAuditLogs();
        setIsConfirmOpen(false);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.audit')}</h1>
                    <Button variant="danger" onClick={handleClearClick}>
                        {t('settings.clear_logs')}
                    </Button>
                </div>
                <AuditLogViewer />
            </div>
            <PasswordPromptModal
                isOpen={isPasswordPromptOpen}
                onClose={() => setIsPasswordPromptOpen(false)}
                onSuccess={proceedToConfirm}
                passwordToMatch={settings.deletionPassword || ''}
                title={t('security.deletion_password_prompt_title')}
                message={t('security.deletion_password_prompt_message')}
            />
            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirm}
                title="Limpar Logs de Auditoria"
                message="Tem certeza que deseja limpar todos os logs de auditoria? Esta ação é irreversível."
            />
        </>
    );
};

export default AuditModule;
