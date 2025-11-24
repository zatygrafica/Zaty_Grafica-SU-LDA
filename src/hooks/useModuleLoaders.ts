import { useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useClientStore } from '../store/useClientStore';
import { useServiceStore } from '../store/useServiceStore';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useMaterialStore } from '../store/useMaterialStore';
import { useOrderStore } from '../store/useOrderStore';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { useTaskStore } from '../store/useTaskStore';
import { usePurchaseStore } from '../store/usePurchaseStore';
import { useStore } from '../store/useStore';

type LoaderState = {
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const useAutoLoadEffect = (loadFn: () => Promise<void>, hasLoaded: boolean, loading: boolean) => {
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    if (hasLoaded) {
      hasRequestedRef.current = false;
      return;
    }

    if (!loading && !hasRequestedRef.current) {
      hasRequestedRef.current = true;
      void loadFn();
    }
  }, [hasLoaded, loading, loadFn]);
};

const useLoaderHook = <T extends () => Promise<void>>(
  loadFn: T,
  loading: boolean,
  hasLoaded: boolean,
  error: string | null,
  reloadFn?: () => Promise<void>,
): LoaderState => {
  useAutoLoadEffect(loadFn, hasLoaded, loading);

  return {
    loading,
    hasLoaded,
    error,
    reload: reloadFn ?? loadFn,
  };
};

export const useLoadClientsOnMount = (): LoaderState => {
  const { loadClients, loading, hasLoaded, error } = useClientStore(
    (state) => ({
      loadClients: state.loadClients,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  return useLoaderHook(loadClients, loading, hasLoaded, error);
};

export const useLoadServicesOnMount = (): LoaderState => {
  const { loadServices, loading, hasLoaded, error } = useServiceStore(
    (state) => ({
      loadServices: state.loadServices,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  const load = () => loadServices(false);
  const reload = () => loadServices(true);
  return useLoaderHook(load, loading, hasLoaded, error, reload);
};

export const useLoadMaterialsOnMount = (): LoaderState => {
  const { loadMaterials, loading, hasLoaded, error } = useMaterialStore(
    (state) => ({
      loadMaterials: state.loadMaterials,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  return useLoaderHook(loadMaterials, loading, hasLoaded, error);
};

export const useLoadOrdersOnMount = (): LoaderState => {
  const { loadOrders, loading, hasLoaded, error } = useOrderStore(
    (state) => ({
      loadOrders: state.loadOrders,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  return useLoaderHook(loadOrders, loading, hasLoaded, error);
};

export const useLoadInvoicesOnMount = (): LoaderState => {
  const { loadInvoices, loading, hasLoaded, error } = useInvoiceStore(
    (state) => ({
      loadInvoices: state.loadInvoices,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  return useLoaderHook(loadInvoices, loading, hasLoaded, error);
};

export const useLoadTasksOnMount = (): LoaderState => {
  const { loadTasks, loading, hasLoaded, error } = useTaskStore(
    (state) => ({
      loadTasks: state.loadTasks,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  return useLoaderHook(loadTasks, loading, hasLoaded, error);
};

export const useLoadPurchasesOnMount = (): LoaderState => {
  const { loadPurchases, loading, hasLoaded, error } = usePurchaseStore(
    (state) => ({
      loadPurchases: state.loadPurchases,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow
  );
  return useLoaderHook(loadPurchases, loading, hasLoaded, error);
};

export const useLoadPaymentsOnMount = (): LoaderState => {
  const { loadPayments, loading, hasLoaded, error } = useStore(
    (state) => ({
      loadPayments: state.loadPayments,
      loading: state.loading.payments,
      hasLoaded: state.paymentsLoaded,
      error: state.paymentsError,
    }),
    shallow,
  );
  const load = () => loadPayments(false);
  const reload = () => loadPayments(true);
  return useLoaderHook(load, loading, hasLoaded, error, reload);
};

export const useLoadEmployeesOnMount = (): LoaderState => {
  const { loadEmployees, loading, hasLoaded, error } = useEmployeeStore(
    (state) => ({
      loadEmployees: state.loadEmployees,
      loading: state.loading,
      hasLoaded: state.hasLoaded,
      error: state.error,
    }),
    shallow,
  );
  return useLoaderHook(loadEmployees, loading, hasLoaded, error);
};
