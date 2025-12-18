import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      windowMinimize: () => void;
      windowMaximize: () => void;
      windowClose: () => void;
      windowIsMaximized: () => Promise<boolean>;
      isElectron: boolean;
    };
  }
}

const ElectronTitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    if (window.electronAPI) {
      window.electronAPI.windowIsMaximized().then(setIsMaximized).catch(console.error);
    }

    // Listener para mudanças de estado (double-click, etc)
    const interval = setInterval(() => {
      if (window.electronAPI) {
        window.electronAPI.windowIsMaximized().then(setIsMaximized).catch(console.error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Só renderizar se estiver no Electron
  if (!window.electronAPI?.isElectron) {
    return null;
  }

  const handleMinimize = () => {
    window.electronAPI?.windowMinimize();
  };

  const handleMaximize = () => {
    window.electronAPI?.windowMaximize();
    // Atualizar estado imediatamente para feedback visual
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.windowClose();
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 h-8 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-3 select-none z-[10000]"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Área esquerda: Ícone e Título */}
      <div className="flex items-center gap-2">
        <img
          src="/icon-512x512.png"
          alt="Zaty Gráfica"
          className="w-4 h-4"
        />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Zaty Gráfica
        </span>
      </div>

      {/* Área direita: Botões de controle */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimizar */}
        <button
          onClick={handleMinimize}
          className="w-12 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          title="Minimizar"
        >
          <Minus className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>

        {/* Maximizar/Restaurar */}
        <button
          onClick={handleMaximize}
          className="w-12 h-8 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          {isMaximized ? (
            <Square className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Fechar */}
        <button
          onClick={handleClose}
          className="w-12 h-8 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ElectronTitleBar;
