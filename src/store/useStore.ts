import { create } from 'zustand';
import { User, Notification, Payment, AuditLog, AppSettings } from '../types';
import { useOrderStore } from './useOrderStore';
import { useServiceStore } from './useServiceStore';
import { useMaterialStore } from './useMaterialStore';
import { useFinanceStore } from './useFinanceStore';
import i18n from '../i18n';
import { useSettingsStore } from './useSettingsStore';
import { useAuthStore } from './useAuthStore';
import { createDefaultSettings } from './settingsDefaults';
import { resilientDataProvider as dataProvider } from '../services/resilientDataProvider';
import { generateId } from '../utils/id';

const getPreferredTheme = (): 'light' | 'dark' => {
  // Prioridade: localStorage > preferência do sistema
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    // Persiste no localStorage
    localStorage.setItem('theme', theme);
  }
};

const initialTheme = getPreferredTheme();
applyTheme(initialTheme);

type AuditLogData = Omit<AuditLog, 'id' | 'timestamp' | 'userId'>;
type AppStatus = 'loading' | 'ready' | 'error';
type UpdateSettingFn = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;

const normalizePayment = (payment: Payment): Payment => ({
  ...payment,
  date: payment.date ? new Date(payment.date) : new Date(),
  createdAt: payment.createdAt ? new Date(payment.createdAt) : new Date(),
});

interface AppState {
  currentUser: User | null;
  appStatus: AppStatus;
  impersonatingUser: User | null;
  originalUser: User | null;
  theme: 'light' | 'dark';
  language: string;
  sidebarCollapsed: boolean;
  showPendingServicesPopup: boolean;
  pendingServicesPopupDisabled: boolean;
  pendingOrderForClient: string | null;
  notifications: Notification[];
  auditLogs: AuditLog[];
  payments: Payment[];
  paymentsLoaded: boolean;
  paymentsError: string | null;
  settings: AppSettings;
  loading: {
    payments: boolean;
  };
  login: (user: User) => void;
  logout: () => void;
  updateCurrentUser: (userData: Partial<User>) => void;
  startImpersonation: (userToImpersonate: User) => void;
  stopImpersonation: () => void;
  setAppStatus: (status: AppStatus) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setShowPendingServicesPopup: (show: boolean) => void;
  disablePendingServicesPopup: () => void;
  enablePendingServicesPopup: () => void;
  setPendingOrderForClient: (clientId: string | null) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  addAuditLog: (data: AuditLogData) => void;
  clearAuditLogs: () => void;
  setPayments: (payments: Payment[]) => void;
  loadPayments: (force?: boolean) => Promise<void>;
  addPayment: (paymentData: Omit<Payment, 'id' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  setSettings: (settings: AppSettings) => void;
  updateSetting: UpdateSettingFn;
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
}

export const useStore = create<AppState>((set, get) => {
  const updateSetting: UpdateSettingFn = async (key, value) => {
    try {
      const settings = await useSettingsStore.getState().updateSetting(key, value);
      set({ settings });
      get().addAuditLog({ action: 'update', resourceType: 'Setting', resourceId: String(key) });
    } catch (error) {
      console.error('Failed to update setting', error);
      get().addNotification({
        id: generateId(),
        type: 'error',
        title: 'Erro ao salvar configurações',
        message: (error as Error).message,
        read: false,
        createdAt: new Date(),
      });
      throw error;
    }
  };

  // Carrega configurações do Supabase na inicialização
  void useSettingsStore
    .getState()
    .loadSettings(true)
    .then((settings) => {
      set({ settings, auditLogs: settings.auditLogs ?? [] });
      if (settings.theme) {
        applyTheme(settings.theme);
        set({ theme: settings.theme });
      }
      if (settings.language) {
        i18n.changeLanguage(settings.language);
        set({ language: settings.language });
      }
    })
    .catch((error) => console.error('Failed to load settings', error));

  return {
    currentUser: null,
    appStatus: 'loading',
    impersonatingUser: null,
    originalUser: null,
    theme: initialTheme,
    language: 'pt',
    sidebarCollapsed: false,
    showPendingServicesPopup: false,
    pendingServicesPopupDisabled: false,
    pendingOrderForClient: null,
    notifications: [],
    auditLogs: [],
    payments: [],
    paymentsLoaded: false,
    paymentsError: null,
    settings: createDefaultSettings(),
    loading: {
      payments: false,
    },
    login: (user) => set({ currentUser: user, appStatus: 'ready' }),
    logout: async () => {
      if (get().impersonatingUser) {
        get().stopImpersonation();
        return;
      }

      try {
        await useAuthStore.getState().signOut();
      } catch (error) {
        console.error('Erro ao sair da sessão', error);
      }

      // Clear all state
      set({
        currentUser: null,
        originalUser: null,
        impersonatingUser: null,
        appStatus: 'loading',
        notifications: [],
        pendingOrderForClient: null,
        auditLogs: [],
        payments: [],
        paymentsLoaded: false,
      });
    },
    updateCurrentUser: (userData) =>
      set((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, ...userData } : null,
      })),
    startImpersonation: (userToImpersonate) => {
      const { currentUser, addNotification, addAuditLog } = get();
      if (userToImpersonate.isBlocked) {
        addNotification({
          id: generateId(),
          type: 'error',
          title: 'Acesso Negado',
          message: 'Nao e possivel acessar como um usuario bloqueado.',
          read: false,
          createdAt: new Date(),
        });
        return;
      }
      if (currentUser && currentUser.role === 'admin') {
        addAuditLog({ action: 'impersonate_start', resourceType: 'User', resourceId: userToImpersonate.id });
        set({
          originalUser: currentUser,
          currentUser: userToImpersonate,
          impersonatingUser: userToImpersonate,
          appStatus: 'ready',
        });
      }
    },
    stopImpersonation: () => {
      const { originalUser, addAuditLog } = get();
      if (originalUser) {
        addAuditLog({ action: 'impersonate_stop', resourceType: 'User', resourceId: originalUser.id });
        set({
          currentUser: originalUser,
          impersonatingUser: null,
          originalUser: null,
          appStatus: 'ready',
        });
      }
    },
    setAppStatus: (status) => set({ appStatus: status }),
    setTheme: async (theme) => {
      applyTheme(theme);
      set({ theme });
      await updateSetting('theme', theme);
    },
    setLanguage: async (language) => {
      i18n.changeLanguage(language);
      set({ language });
      await updateSetting('language', language);
    },
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setShowPendingServicesPopup: (show) => set({ showPendingServicesPopup: show }),
    disablePendingServicesPopup: () => set({ pendingServicesPopupDisabled: true }),
    enablePendingServicesPopup: () => set({ pendingServicesPopupDisabled: false }),
    setPendingOrderForClient: (clientId) => set({ pendingOrderForClient: clientId }),
    setNotifications: (notifications) => set({ notifications }),
    addNotification: (notification) =>
      set((state) => ({
        notifications: [notification, ...state.notifications],
      })),
    markNotificationAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        ),
      })),
    clearNotifications: () => set({ notifications: [] }),
    addAuditLog: async (data) => {
      const { currentUser } = get();
      if (!currentUser) return;
      const newLog: AuditLog = {
        id: generateId(),
        userId: currentUser.id,
        ...data,
        timestamp: new Date(),
      };
      set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      // persiste no settings (auditLogs) sem criar registros novos
      const newList = get().auditLogs;
      try {
        await useSettingsStore.getState().updateSetting('auditLogs', newList);
        set((state) => ({ settings: { ...state.settings, auditLogs: newList } }));
      } catch (error) {
        console.error('Failed to persist audit log', error);
      }
    },
    clearAuditLogs: () => {
      void get()
        .addAuditLog({ action: 'clear_all', resourceType: 'AuditLog', resourceId: 'all' })
        .then(() => {
          set({ auditLogs: [] });
          void useSettingsStore
            .getState()
            .updateSetting('auditLogs', [])
            .then(() => set((state) => ({ settings: { ...state.settings, auditLogs: [] } })));
        });
    },
    setPayments: (payments) =>
      set({
        payments: payments.map(normalizePayment),
        paymentsLoaded: true,
        paymentsError: null,
      }),
    loadPayments: async (force = false) => {
      const { loading, paymentsLoaded } = get();
      if (!force && (loading.payments || paymentsLoaded)) {
        return;
      }
      set((state) => ({
        loading: { ...state.loading, payments: true },
        paymentsError: null,
        paymentsLoaded: force ? false : state.paymentsLoaded,
      }));
      try {
        const payments = await dataProvider.list<Payment>('payments');
        const normalized = payments.map(normalizePayment);
        set((state) => ({
          payments: normalized,
          paymentsLoaded: true,
          paymentsError: null,
          loading: { ...state.loading, payments: false },
        }));
      } catch (error) {
        set((state) => ({
          paymentsError: (error as Error).message,
          paymentsLoaded: false,
          loading: { ...state.loading, payments: false },
        }));
        throw error;
      }
    },
    addPayment: async (paymentData) => {
      try {
        const { orders } = useOrderStore.getState();
        const { services } = useServiceStore.getState();
        const materialStore = useMaterialStore.getState();
        // Garante materiais carregados para cálculo correto de estoque
        if (!materialStore.materials || materialStore.materials.length === 0) {
          await materialStore.loadMaterials?.();
        }
        const { materials, deductStock } = useMaterialStore.getState();
        const { addNotification, addAuditLog, currentUser } = get();
        const { t } = i18n;

        const order = orders.find((o) => o.id === paymentData.orderId);
        if (!order) {
          return { success: false, message: 'Pedido nao encontrado.' };
        }

        const requiredStock = new Map<string, { quantity: number; name: string; unit: string }>();
        order.items.forEach((item) => {
          const service = services.find((s) => s.id === item.serviceId);
          if (!service?.materialsUsed) return;

          service.materialsUsed.forEach((consumption) => {
            const material = materials.find((m) => m.id === consumption.materialId);
            if (!material) return;

            let deductionAmount = 0;
            if (material.unit === 'meter' && consumption.length) {
              deductionAmount = consumption.length * item.quantity;
            } else if (material.unit !== 'meter' && consumption.quantity) {
              deductionAmount = consumption.quantity * item.quantity;
            }

            if (deductionAmount > 0) {
              const currentRequired = requiredStock.get(material.id)?.quantity || 0;
              requiredStock.set(material.id, {
                quantity: currentRequired + deductionAmount,
                name: material.name,
                unit: material.unit,
              });
            }
          });
        });

        const insufficientMaterials: string[] = [];
        for (const [materialId, req] of requiredStock.entries()) {
          const material = materials.find((m) => m.id === materialId);
          if (!material || material.currentStock < req.quantity) {
            insufficientMaterials.push(
              `${req.name} (necessario: ${req.quantity.toFixed(2)}${t(`materials.units.${req.unit}`)}, disponivel: ${
                (material?.currentStock ?? 0).toFixed(2)
              }${t(`materials.units.${req.unit}`)})`
            );
          }
        }

        if (insufficientMaterials.length > 0) {
          const errorMessage = `Estoque insuficiente: ${insufficientMaterials.join(', ')}`;
          addNotification({
            id: generateId(),
            type: 'error',
            title: 'Pagamento Bloqueado',
            message: errorMessage,
            read: false,
            createdAt: new Date(),
          });
          return { success: false, message: errorMessage };
        }

        for (const [materialId, req] of requiredStock.entries()) {
          await deductStock(materialId, req.quantity, order.id, `Pagamento para Pedido ${order.orderNumber}`);
        }

        const payload: Payment = {
          id: generateId(),
          ...paymentData,
          createdAt: new Date(),
        };

        const created = await dataProvider.create<Payment>('payments', payload);
        const normalized = normalizePayment(created);
        set((state) => ({ payments: [normalized, ...state.payments], paymentsLoaded: true }));
        addAuditLog({ action: 'create', resourceType: 'Payment', resourceId: normalized.id });

        return { success: true };
      } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        return { success: false, message: (error as Error).message };
      }
    },
    updatePayment: (id, paymentUpdate) => {
      set((state) => ({
        payments: state.payments.map((payment) =>
          payment.id === id ? normalizePayment({ ...payment, ...paymentUpdate }) : payment
        ),
      }));
      void dataProvider.update('payments', id, paymentUpdate);
    },
    deletePayment: (id) => {
      set((state) => ({
        payments: state.payments.filter((payment) => payment.id !== id),
      }));
      void dataProvider.delete('payments', id);
    },
    setSettings: (settings) => set({ settings }),
    updateSetting,
    setLoading: (key, loading) =>
      set((state) => ({
        loading: { ...state.loading, [key]: loading },
      })),
  };
});
