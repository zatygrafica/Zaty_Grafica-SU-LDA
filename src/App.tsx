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
  );
}

export default App;
