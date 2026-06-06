import { create } from 'zustand';
import type { Field, WorkOrder, SensorData } from '../../shared/types';
import { api } from '../utils/api';

interface AppState {
  fields: Field[];
  workOrders: WorkOrder[];
  sensorData: Record<number, SensorData[]>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchFields: () => Promise<void>;
  fetchWorkOrders: (status?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchSensorData: (fieldId: number) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  fields: [],
  workOrders: [],
  sensorData: {},
  loading: false,
  error: null,
  lastUpdated: null,

  fetchFields: async () => {
    try {
      set({ loading: true });
      const fields = await api.fields.getAll();
      set({ fields, loading: false, lastUpdated: new Date() });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchWorkOrders: async (status?: string, startDate?: string, endDate?: string) => {
    try {
      set({ loading: true });
      const workOrders = await api.workOrders.getAll(status, startDate, endDate);
      set({ workOrders, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchSensorData: async (fieldId: number) => {
    try {
      const data = await api.sensorData.getByFieldId(fieldId, 2);
      set(state => ({
        sensorData: { ...state.sensorData, [fieldId]: data },
      }));
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
    }
  },

  refreshAll: async () => {
    await Promise.all([
      get().fetchFields(),
      get().fetchWorkOrders(),
    ]);
  },
}));
