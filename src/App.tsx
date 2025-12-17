import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { useOrderStore } from './store/useOrderStore';
import Layout from './components/Layout/Layout';
import './i18n';
import { registerSW } from 'virtual:pwa-register';
import PwaUpdateNotification from './components/Common/PwaUpdateNotification';
import PendingServicesPopup from './components/Notifications/PendingServicesPopup';
import InitialLoadingScreen from './components/Layout/InitialLoadingScreen';
import LoadingErrorScreen from './components/Layout/LoadingErrorScreen';
import { usePWAInstall } from './hooks/usePWAInstall';
import { useUserStore } from './store/useUserStore';
import SecurityWrapper from './components/Security/SecurityWrapper';
import { useAuthStore } from './store/useAuthStore';

function App() {
  const {
    appStatus,
    setAppStatus,
    showPendingServicesPopup,
    setShowPendingServicesPopup,
    pendingServicesPopupDisabled,
    disablePendingServicesPopup,
    settings,
    login,
    currentUser,
  } = useStore();
  const { orders } = useOrderStore();
  const { canInstall, promptInstall } = usePWAInstall();
  const { users } = useUserStore();
  const { signOut } = useAuthStore();

  // --- Security: Logout automático ao fechar aplicativo/aba ---
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Faz logout silencioso ao fechar
      try {
        await signOut();
        console.log('[Security] Session cleared on window close');
      } catch (error) {
        console.error('[Security] Error during logout on close:', error);
      }
    };

    const handleUnload = async () => {
      // Fallback para garantir logout
      try {
        await signOut();
      } catch (error) {
        console.error('[Security] Error during logout on unload:', error);
      }
    };

    // Listeners para fechar janela/aba
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [signOut]);

  // --- Security: Idle Timeout State ---
  const [idleTimeout, setIdleTimeout] = useState<number>(() => {
    const saved = localStorage.getItem('security_idle_timeout');
    return saved ? parseInt(saved, 10) : 3 * 60 * 1000; // Default: 3 minutes
  });

  // Listen for timeout changes from localStorage (cross-tab sync) and custom events (same-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'security_idle_timeout' && e.newValue) {
        setIdleTimeout(parseInt(e.newValue, 10));
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail) {
        setIdleTimeout(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('idle-timeout-changed', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('idle-timeout-changed', handleCustomEvent);
    };
  }, []);

  // --- PWA Update Flow ---
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<(reloadPage?: boolean) => Promise<void>>(() => () => Promise.resolve());

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const updateServiceWorker = registerSW({
        onNeedRefresh() {
          setNeedRefresh(true);
        },
        onOfflineReady() {
          console.log("App is ready to work offline.");
        },
      });
      setUpdateSW(() => updateServiceWorker);
    }
  }, []);

  // --- REMOVED: Auto-login removed for security (Issue P0-3) ---
  // Authentication now requires valid Supabase session via LoginPage
  // useEffect(() => {
  //   if (!currentUser && users.length > 0) {
  //     const adminUser = users.find(u => u.role === 'admin');
  //     if (adminUser) {
  //       login(adminUser);
  //     }
  //   }
  // }, [currentUser, users, login, setAppStatus]);

  const handlePwaUpdate = async () => {
    await updateSW(true);
  };
  // --- End PWA Update Flow ---

  // --- App Loading Failsafe ---
  useEffect(() => {
    if (appStatus === 'loading') {
      const timer = setTimeout(() => {
        // If after 15 seconds we are still loading, something is wrong.
        setAppStatus('error');
      }, 15000); // 15-second timeout

      return () => clearTimeout(timer);
    }
  }, [appStatus, setAppStatus]);

  // Intelligent Pending Services Popup
  useEffect(() => {
    if (appStatus !== 'ready') return;

    const checkPendingOrders = () => {
      if (pendingServicesPopupDisabled) return;

      const hasPending = orders.some(o => ['pending', 'in_production', 'in_design'].includes(o.status));
      if (hasPending) {
        setShowPendingServicesPopup(true);
      }
    };

    checkPendingOrders();

    const frequencyInMs = (settings.popupFrequency || 15) * 60 * 1000;
    const intervalId = setInterval(checkPendingOrders, frequencyInMs);

    return () => clearInterval(intervalId);
  }, [appStatus, orders, pendingServicesPopupDisabled, setShowPendingServicesPopup, settings.popupFrequency]);

  if (appStatus === 'loading' || !currentUser) {
    return <InitialLoadingScreen />;
  }

  if (appStatus === 'error') {
    return <LoadingErrorScreen />;
  }

  return (
    <SecurityWrapper enabled={true} idleTimeout={idleTimeout}>
      <div className="min-h-screen bg-transparent">
        <Layout canInstallPWA={canInstall} onInstallPWA={promptInstall} />
        {needRefresh && (
          <PwaUpdateNotification
            onUpdate={handlePwaUpdate}
            onClose={() => setNeedRefresh(false)}
          />
        )}
        {showPendingServicesPopup && (
          <PendingServicesPopup
            onClose={() => setShowPendingServicesPopup(false)}
            onDisable={disablePendingServicesPopup}
          />
        )}
      </div>
    </SecurityWrapper>
  );
}

export default App;
