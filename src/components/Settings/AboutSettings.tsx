import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../Common/Button';
import { Download, Info } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      getAppVersion: () => Promise<string>;
      checkForUpdates: () => Promise<{ available: boolean; message?: string; error?: string }>;
      platform: string;
      isElectron: boolean;
    };
  }
}

const AboutSettings: React.FC = () => {
  const { t } = useTranslation();
  const [version, setVersion] = useState<string>('1.0.0');
  const [isElectron, setIsElectron] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');

  useEffect(() => {
    // Detectar se está no Electron
    if (window.electronAPI?.isElectron) {
      setIsElectron(true);

      // Obter versão do app
      window.electronAPI.getAppVersion().then(setVersion).catch(() => {
        setVersion('1.0.0');
      });
    } else {
      // Versão web (do package.json)
      setVersion('1.0.0 (Web)');
    }
  }, []);

  const handleCheckUpdates = async () => {
    if (!window.electronAPI) {
      setUpdateMessage('Verificação de atualizações disponível apenas no aplicativo desktop');
      return;
    }

    setCheckingUpdate(true);
    setUpdateMessage('Verificando atualizações...');

    try {
      const result = await window.electronAPI.checkForUpdates();

      if (result.available) {
        setUpdateMessage('Nova atualização disponível! O download será iniciado automaticamente.');
      } else if (result.error) {
        setUpdateMessage(`Erro ao verificar atualizações: ${result.error}`);
      } else {
        setUpdateMessage('Você está usando a versão mais recente!');
      }
    } catch (error) {
      setUpdateMessage('Erro ao verificar atualizações. Tente novamente mais tarde.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Sobre o Sistema
      </h3>

      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6 space-y-4">
        {/* Logo e Nome */}
        <div className="flex items-center space-x-4">
          <img
            src="/logo.png"
            alt="Zaty Gráfica"
            className="h-16 w-16 object-contain"
          />
          <div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              Zaty Gráfica
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sistema de Gestão Empresarial
            </p>
          </div>
        </div>

        <div className="border-t dark:border-neutral-800 pt-4 space-y-3">
          {/* Versão */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Versão:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {version}
            </span>
          </div>

          {/* Plataforma */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Plataforma:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isElectron ? `Desktop (${window.electronAPI?.platform || 'unknown'})` : 'Web'}
            </span>
          </div>

          {/* Empresa */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Desenvolvido por:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Zaty Gráfica, SU, LDA
            </span>
          </div>

          {/* Localização */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Localização:
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Nampula, Moçambique
            </span>
          </div>
        </div>

        {/* Verificar Atualizações (apenas Electron) */}
        {isElectron && (
          <div className="border-t dark:border-neutral-800 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCheckUpdates}
              loading={checkingUpdate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Verificar Atualizações
            </Button>

            {updateMessage && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {updateMessage}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informações adicionais */}
        <div className="border-t dark:border-neutral-800 pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            © {new Date().getFullYear()} Zaty Gráfica, SU, LDA. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Tecnologias */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 p-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Tecnologias Utilizadas
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Frontend:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">React + TypeScript</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Backend:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">Supabase</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">UI:</span>
            <span className="ml-2 text-gray-900 dark:text-white font-medium">Tailwind CSS</span>
          </div>
          {isElectron && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Desktop:</span>
              <span className="ml-2 text-gray-900 dark:text-white font-medium">Electron</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutSettings;
