import { create } from 'zustand';
import type { Service } from '../types';
import { supabaseDataProvider as dataProvider } from '../services/supabaseDataProvider';

type ServiceInput = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;

const normalizeService = (service: Service): Service => ({
  ...service,
  variations: service.variations?.map((variation) => ({ ...variation })) ?? [],
  createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
  updatedAt: service.updatedAt ? new Date(service.updatedAt) : new Date(),
});

interface ServiceState {
  services: Service[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  setServices: (services: Service[]) => void;
  listServices: (force?: boolean) => Promise<Service[]>;
  loadServices: (force?: boolean) => Promise<void>;
  getServiceById: (id: string) => Service | undefined;
  createService: (service: ServiceInput) => Promise<Service>;
  addService: (service: ServiceInput) => Promise<Service>;
  updateServiceById: (id: string, service: Partial<Omit<Service, 'id'>>) => Promise<Service | undefined>;
  updateService: (id: string, service: Partial<Omit<Service, 'id'>>) => Promise<Service | undefined>;
  deleteServiceById: (id: string) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

export const useServiceStore = create<ServiceState>((set, get) => ({
  services: [],
  loading: false,
  error: null,
  hasLoaded: false,

  setServices: (services) => set({ services }),

  listServices: async (force = false) => {
    if (!force && get().hasLoaded) {
      return get().services;
    }
    set({ loading: true, error: null });
    try {
      const services = await dataProvider.list<Service>('services');
      const normalized = services.map(normalizeService);
      set({ services: normalized, loading: false, hasLoaded: true });
      return normalized;
    } catch (error) {
      set({ loading: false, hasLoaded: false, error: (error as Error).message });
      throw error;
    }
  },

  loadServices: async (force = false) => {
    if (get().loading) return;
    if (!force && get().hasLoaded) return;
    await get().listServices(force);
  },

  getServiceById: (id) => get().services.find((service) => service.id === id),

  createService: async (serviceData) => {
    const payload: Service = {
      id: crypto.randomUUID(),
      ...serviceData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    try {
      const created = await dataProvider.create<Service>('services', payload);
      const normalized = normalizeService(created);
      set((state) => ({ services: [...state.services, normalized] }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  addService: async (serviceData) => get().createService(serviceData),

  updateServiceById: async (id, serviceUpdate) => {
    const payload = { ...serviceUpdate, updatedAt: new Date() };
    try {
      const updated = await dataProvider.update<Service>('services', id, payload);
      if (!updated) return undefined;
      const normalized = normalizeService(updated);
      set((state) => ({
        services: state.services.map((service) => (service.id === id ? normalized : service)),
      }));
      return normalized;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  updateService: async (id, serviceUpdate) => get().updateServiceById(id, serviceUpdate),

  deleteServiceById: async (id) => {
    try {
      await dataProvider.delete('services', id);
      set((state) => ({
        services: state.services.filter((service) => service.id !== id),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  deleteService: async (id) => get().deleteServiceById(id),
}));
