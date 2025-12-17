import React from 'react';
import { Shield, Clock, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SecuritySettingsProps {
  idleTimeout: number; // em milissegundos
  onIdleTimeoutChange: (timeout: number) => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  idleTimeout,
  onIdleTimeoutChange
}) => {
  const { t } = useTranslation();

  // Opções de tempo de inatividade
  const idleTimeOptions = [
    { value: 30 * 1000, label: '30 segundos', description: 'Apenas para testes' },
    { value: 60 * 1000, label: '1 minuto', description: 'Muito restritivo' },
    { value: 2 * 60 * 1000, label: '2 minutos', description: 'Restritivo' },
    { value: 3 * 60 * 1000, label: '3 minutos (Padrão)', description: 'Seguro, mas pode ser inconveniente' },
    { value: 5 * 60 * 1000, label: '5 minutos', description: 'Equilibrado' },
    { value: 10 * 60 * 1000, label: '10 minutos', description: 'Confortável' },
    { value: 15 * 60 * 1000, label: '15 minutos', description: 'Recomendado - Seguro e prático' },
    { value: 30 * 60 * 1000, label: '30 minutos', description: 'Flexível' },
    { value: 60 * 60 * 1000, label: '60 minutos (1 hora)', description: 'Menos seguro' },
  ];

  const handleTimeoutChange = (value: string) => {
    const timeout = parseInt(value, 10);
    onIdleTimeoutChange(timeout);

    // Salva no localStorage para persistir entre sessões
    localStorage.setItem('security_idle_timeout', value);
  };

  // Formatar tempo para exibição
  const formatTime = (ms: number): string => {
    if (ms < 60000) {
      return `${ms / 1000}s`;
    } else if (ms < 3600000) {
      return `${ms / 60000}min`;
    } else {
      return `${ms / 3600000}h`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Configurações de Segurança
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure o bloqueio automático por inatividade
          </p>
        </div>
      </div>

      {/* Tempo de Inatividade */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              Tempo de Inatividade
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha quanto tempo de inatividade antes do sistema bloquear automaticamente
            </p>
          </div>
        </div>

        {/* Seletor de Tempo */}
        <div className="space-y-3">
          {idleTimeOptions.map((option) => (
            <label
              key={option.value}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                ${idleTimeout === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <input
                type="radio"
                name="idle-timeout"
                value={option.value}
                checked={idleTimeout === option.value}
                onChange={(e) => handleTimeoutChange(e.target.value)}
                className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                  {option.value === 3 * 60 * 1000 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      Padrão
                    </span>
                  )}
                  {option.value === 15 * 60 * 1000 && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                      Recomendado
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>

        {/* Tempo Atual Selecionado */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-700 dark:text-gray-300">
              Bloqueio configurado para: <strong className="text-gray-900 dark:text-white">{formatTime(idleTimeout)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" />
          Como Funciona
        </h4>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li className="flex gap-2">
            <span>•</span>
            <span>O sistema monitora atividade do mouse, teclado e tela</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Após o tempo configurado sem atividade, a sessão é bloqueada</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Formulários abertos são salvos automaticamente antes do bloqueio</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Você precisará digitar sua senha para desbloquear</span>
          </li>
          <li className="flex gap-2">
            <span>•</span>
            <span>Dados são restaurados após reautenticação bem-sucedida</span>
          </li>
        </ul>
      </div>

      {/* Aviso de Teste */}
      {idleTimeout <= 60 * 1000 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Atenção
          </h4>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Tempos muito curtos (menos de 2 minutos) são recomendados apenas para testes.
            Para uso em produção, utilize pelo menos 5 minutos.
          </p>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;
