import { useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

export const usePWA = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  const updateServiceWorker = registerSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      setOfflineReady(true);
    },
  });

  const handleUpdate = async () => {
    await updateServiceWorker(true);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return { needRefresh, offlineReady, handleUpdate, close };
};
