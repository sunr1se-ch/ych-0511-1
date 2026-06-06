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
  selectedFieldIds: number[];
  hiddenLineFieldIds: number[];
  fetchFields: () => Promise<void>;
  fetchWorkOrders: (status?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchSensorData: (fieldId: number, hours?: number) => Promise<void>;
  fetchSensorDataByTimeRange: (fieldId: number, startTime: string, endTime: string) => Promise<SensorData[]>;
  refreshAll: () => Promise<void>;
  toggleFieldSelection: (fieldId: number) => void;
  clearFieldSelection: () => void;
  toggleLineVisibility: (fieldId: number) => void;
  getPendingCountByFieldId: (fieldId: number) => number;
  getTotalPendingCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  fields: [],
  workOrders: [],
  sensorData: {},
  loading: false,
  error: null,
  lastUpdated: null,
  selectedFieldIds: [],
  hiddenLineFieldIds: [],

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

  fetchSensorData: async (fieldId: number, hours = 2) => {
    try {
      const data = await api.sensorData.getByFieldId(fieldId, hours);
      set(state => ({
        sensorData: { ...state.sensorData, [fieldId]: data },
      }));
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
    }
  },

  fetchSensorDataByTimeRange: async (fieldId: number, startTime: string, endTime: string) => {
    try {
      return await api.sensorData.getByTimeRange(fieldId, startTime, endTime);
    } catch (error) {
      console.error('Failed to fetch sensor data by time range:', error);
      return [];
    }
  },

  refreshAll: async () => {
    const { selectedFieldIds, fetchSensorData } = get();
    await Promise.all([
      get().fetchFields(),
      get().fetchWorkOrders(),
      ...selectedFieldIds.map(id => fetchSensorData(id, 2)),
    ]);
  },

  toggleFieldSelection: (fieldId: number) => {
    set(state => {
      const isSelected = state.selectedFieldIds.includes(fieldId);
      if (isSelected) {
        const newSelected = state.selectedFieldIds.filter(id => id !== fieldId);
        const newHidden = state.hiddenLineFieldIds.filter(id => id !== fieldId);
        return { selectedFieldIds: newSelected, hiddenLineFieldIds: newHidden };
      } else {
        if (state.selectedFieldIds.length >= 3) {
          return state;
        }
        return { selectedFieldIds: [...state.selectedFieldIds, fieldId] };
      }
    });
  },

  clearFieldSelection: () => {
    set({ selectedFieldIds: [], hiddenLineFieldIds: [] });
  },

  toggleLineVisibility: (fieldId: number) => {
    set(state => {
      const isHidden = state.hiddenLineFieldIds.includes(fieldId);
      if (isHidden) {
        return { hiddenLineFieldIds: state.hiddenLineFieldIds.filter(id => id !== fieldId) };
      } else {
        return { hiddenLineFieldIds: [...state.hiddenLineFieldIds, fieldId] };
      }
    });
  },

  getPendingCountByFieldId: (fieldId: number) => {
    return get().workOrders.filter(o => o.fieldId === fieldId && o.status === 'pending').length;
  },

  getTotalPendingCount: () => {
    return get().workOrders.filter(o => o.status === 'pending').length;
  },
}));
