import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Common/Button';

interface TermsOfUseProps {
  embedded?: boolean;
}

const TermsOfUse: React.FC<TermsOfUseProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const content = (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        {t('legal.terms_of_use.last_updated')}: {new Date().toLocaleDateString('pt-PT')}
      </p>

      <div className="prose dark:prose-invert max-w-none">
            {/* Aceitação dos Termos */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.acceptance.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.terms_of_use.acceptance.content')}
              </p>
            </section>

            {/* Descrição do Sistema */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.system_description.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.terms_of_use.system_description.content')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.terms_of_use.system_description.features.clients')}</li>
                <li>{t('legal.terms_of_use.system_description.features.orders')}</li>
                <li>{t('legal.terms_of_use.system_description.features.invoices')}</li>
                <li>{t('legal.terms_of_use.system_description.features.payments')}</li>
                <li>{t('legal.terms_of_use.system_description.features.materials')}</li>
                <li>{t('legal.terms_of_use.system_description.features.employees')}</li>
                <li>{t('legal.terms_of_use.system_description.features.reports')}</li>
                <li>{t('legal.terms_of_use.system_description.features.chat')}</li>
              </ul>
            </section>

            {/* Conta de Utilizador */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.user_account.title')}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.terms_of_use.user_account.credentials')}</li>
                <li>{t('legal.terms_of_use.user_account.responsibility')}</li>
                <li>{t('legal.terms_of_use.user_account.unauthorized')}</li>
                <li>{t('legal.terms_of_use.user_account.sharing')}</li>
              </ul>
            </section>

            {/* Permissões e Controlo de Acesso */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.permissions.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.terms_of_use.permissions.content')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.terms_of_use.permissions.admin')}</li>
                <li>{t('legal.terms_of_use.permissions.user')}</li>
                <li>{t('legal.terms_of_use.permissions.respect')}</li>
              </ul>
            </section>

            {/* Uso Adequado */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.proper_use.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.terms_of_use.proper_use.intro')}
              </p>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.terms_of_use.proper_use.prohibited.illegal')}</li>
                <li>{t('legal.terms_of_use.proper_use.prohibited.unauthorized')}</li>
                <li>{t('legal.terms_of_use.proper_use.prohibited.harmful')}</li>
                <li>{t('legal.terms_of_use.proper_use.prohibited.overload')}</li>
                <li>{t('legal.terms_of_use.proper_use.prohibited.interference')}</li>
              </ul>
            </section>

            {/* Dados e Backup */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.data_backup.title')}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.terms_of_use.data_backup.accuracy')}</li>
                <li>{t('legal.terms_of_use.data_backup.storage')}</li>
                <li>{t('legal.terms_of_use.data_backup.backup')}</li>
                <li>{t('legal.terms_of_use.data_backup.retention')}</li>
              </ul>
            </section>

            {/* Propriedade Intelectual */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.intellectual_property.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.terms_of_use.intellectual_property.system')}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.terms_of_use.intellectual_property.user_data')}
              </p>
            </section>

            {/* Limitação de Responsabilidade */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.liability.title')}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.terms_of_use.liability.availability')}</li>
                <li>{t('legal.terms_of_use.liability.errors')}</li>
                <li>{t('legal.terms_of_use.liability.data_loss')}</li>
                <li>{t('legal.terms_of_use.liability.decisions')}</li>
              </ul>
            </section>

            {/* Suspensão e Cancelamento */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.suspension.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.terms_of_use.suspension.content')}
              </p>
            </section>

            {/* Modificações */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.modifications.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.terms_of_use.modifications.content')}
              </p>
            </section>

            {/* Contacto */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.terms_of_use.contact.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {t('legal.terms_of_use.contact.content')}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Email:</strong> {t('company.email')}<br />
                <strong>{t('common.phone')}:</strong> {t('company.phone')}<br />
                <strong>{t('common.address')}:</strong> {t('company.address')}
              </p>
            </section>
          </div>
    </>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Button
          onClick={() => navigate(-1)}
          icon={ArrowLeft}
          variant="secondary"
          className="mb-6"
        >
          {t('common.back')}
        </Button>

        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('legal.terms_of_use.title')}
          </h1>
          {content}
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
