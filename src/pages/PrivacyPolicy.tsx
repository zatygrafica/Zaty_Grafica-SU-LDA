import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Common/Button';

interface PrivacyPolicyProps {
  embedded?: boolean;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const content = (
    <>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        {t('legal.privacy_policy.last_updated')}: {new Date().toLocaleDateString('pt-PT')}
      </p>

      <div className="prose dark:prose-invert max-w-none">
            {/* Introdução */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.introduction.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.privacy_policy.introduction.content')}
              </p>
            </section>

            {/* Dados Coletados */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.data_collected.title')}
              </h2>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('legal.privacy_policy.data_collected.user_data.title')}
              </h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>{t('legal.privacy_policy.data_collected.user_data.email')}</li>
                <li>{t('legal.privacy_policy.data_collected.user_data.name')}</li>
                <li>{t('legal.privacy_policy.data_collected.user_data.role')}</li>
                <li>{t('legal.privacy_policy.data_collected.user_data.photo')}</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('legal.privacy_policy.data_collected.client_data.title')}
              </h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>{t('legal.privacy_policy.data_collected.client_data.name')}</li>
                <li>{t('legal.privacy_policy.data_collected.client_data.phone')}</li>
                <li>{t('legal.privacy_policy.data_collected.client_data.email')}</li>
                <li>{t('legal.privacy_policy.data_collected.client_data.address')}</li>
                <li>{t('legal.privacy_policy.data_collected.client_data.nuit')}</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('legal.privacy_policy.data_collected.employee_data.title')}
              </h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>{t('legal.privacy_policy.data_collected.employee_data.name')}</li>
                <li>{t('legal.privacy_policy.data_collected.employee_data.contact')}</li>
                <li>{t('legal.privacy_policy.data_collected.employee_data.documents')}</li>
                <li>{t('legal.privacy_policy.data_collected.employee_data.salary')}</li>
                <li>{t('legal.privacy_policy.data_collected.employee_data.attendance')}</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3">
                {t('legal.privacy_policy.data_collected.business_data.title')}
              </h3>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 mb-4 space-y-2">
                <li>{t('legal.privacy_policy.data_collected.business_data.orders')}</li>
                <li>{t('legal.privacy_policy.data_collected.business_data.invoices')}</li>
                <li>{t('legal.privacy_policy.data_collected.business_data.payments')}</li>
                <li>{t('legal.privacy_policy.data_collected.business_data.materials')}</li>
                <li>{t('legal.privacy_policy.data_collected.business_data.services')}</li>
              </ul>
            </section>

            {/* Como Usamos os Dados */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.data_usage.title')}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.privacy_policy.data_usage.operations')}</li>
                <li>{t('legal.privacy_policy.data_usage.invoicing')}</li>
                <li>{t('legal.privacy_policy.data_usage.communication')}</li>
                <li>{t('legal.privacy_policy.data_usage.reports')}</li>
                <li>{t('legal.privacy_policy.data_usage.attendance')}</li>
              </ul>
            </section>

            {/* Armazenamento */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.storage.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.privacy_policy.storage.database')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('legal.privacy_policy.storage.local_storage')}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.privacy_policy.storage.documents')}
              </p>
            </section>

            {/* Segurança */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.security.title')}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.privacy_policy.security.authentication')}</li>
                <li>{t('legal.privacy_policy.security.encryption')}</li>
                <li>{t('legal.privacy_policy.security.access_control')}</li>
                <li>{t('legal.privacy_policy.security.audit')}</li>
              </ul>
            </section>

            {/* Compartilhamento */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.sharing.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300">
                {t('legal.privacy_policy.sharing.content')}
              </p>
            </section>

            {/* Direitos do Utilizador */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.user_rights.title')}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t('legal.privacy_policy.user_rights.access')}</li>
                <li>{t('legal.privacy_policy.user_rights.correction')}</li>
                <li>{t('legal.privacy_policy.user_rights.deletion')}</li>
                <li>{t('legal.privacy_policy.user_rights.export')}</li>
              </ul>
            </section>

            {/* Contacto */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('legal.privacy_policy.contact.title')}
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {t('legal.privacy_policy.contact.content')}
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
            {t('legal.privacy_policy.title')}
          </h1>
          {content}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
