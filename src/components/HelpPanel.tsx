import React from 'react';
import { X, Mail, Phone, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const helpOptions = [
    {
      icon: Mail,
      title: 'Email',
      description: 'Entre em contato conosco por email',
      contact: 'suporte@zatygrafica.com',
      action: 'mailto:suporte@zatygrafica.com',
    },
    {
      icon: Phone,
      title: 'Telefone',
      description: 'Ligue para nossa equipe de suporte',
      contact: '+258 84 123 4567',
      action: 'tel:+258841234567',
    },
    {
      icon: MessageCircle,
      title: 'Chat',
      description: 'Converse conosco em tempo real',
      contact: 'Disponível 24/7',
      action: '#',
    },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />

      {/* Panel - RIGHT SIDE */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-neutral-900 shadow-2xl z-[70] flex flex-col transition-transform">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-500 dark:to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Central de Ajuda
              </h2>
              <p className="text-sm text-cyan-50">Como podemos ajudar?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-neutral-900">
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Bem-vindo à Central de Ajuda!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escolha uma das opções abaixo para entrar em contato com nossa equipe de suporte.
                Estamos aqui para ajudá-lo com qualquer dúvida ou problema.
              </p>
            </div>

            {/* Help Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Opções de Contato
              </h4>
              {helpOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <a
                    key={option.title}
                    href={option.action}
                    className="flex items-start gap-4 bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-md transition-all group"
                  >
                    <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/30 transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        {option.title}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {option.description}
                      </p>
                      <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
                        {option.contact}
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>

            {/* FAQ Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-gray-200 dark:border-neutral-700">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Perguntas Frequentes
              </h4>
              <div className="space-y-3">
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    Como posso redefinir minha senha?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-4">
                    Entre em contato com o administrador do sistema para redefinir sua senha.
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    Onde encontro os relatórios?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-4">
                    Os relatórios estão disponíveis no menu principal, seção "Relatórios".
                  </p>
                </details>
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                    Como faço para alterar o idioma?
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 pl-4">
                    Você pode alterar o idioma no menu de configurações, clicando no ícone de bandeira no canto superior direito.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-neutral-700 px-6 py-4 bg-white dark:bg-neutral-800">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            Horário de atendimento: Segunda a Sexta, 8h às 18h
          </p>
        </div>
      </div>
    </>
  );
};

export default HelpPanel;
