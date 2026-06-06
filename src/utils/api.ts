import type { ApiResponse, LoginRequest, LoginResponse, Field, SensorData, WorkOrder, CompleteWorkOrderRequest, CreateFieldRequest, UpdateFieldRequest } from '../../shared/types';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await response.json() as ApiResponse<T>;
  } catch {
    throw new Error(response.ok ? '响应解析失败' : `请求失败 (${response.status})`);
  }

  if (!response.ok || !data.success) {
    const errData = data as ApiResponse<T> & { error?: string };
    throw new Error(errData.message || errData.error || `请求失败 (${response.status})`);
  }

  return data.data as T;
}

export const api = {
  auth: {
    login(data: LoginRequest): Promise<LoginResponse> {
      return request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    me() {
      return request('/auth/me', { method: 'GET' });
    },
  },

  fields: {
    getAll(): Promise<Field[]> {
      return request<Field[]>('/fields', { method: 'GET' });
    },
    getById(id: number): Promise<Field> {
      return request<Field>(`/fields/${id}`, { method: 'GET' });
    },
    create(data: CreateFieldRequest): Promise<Field> {
      return request<Field>('/fields', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update(id: number, data: UpdateFieldRequest): Promise<Field> {
      return request<Field>(`/fields/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete(id: number): Promise<void> {
      return request<void>(`/fields/${id}`, { method: 'DELETE' });
    },
  },

  sensorData: {
    getByFieldId(fieldId: number, hours = 2): Promise<SensorData[]> {
      return request<SensorData[]>(`/sensor-data?fieldId=${fieldId}&hours=${hours}`, {
        method: 'GET',
      });
    },
  },

  workOrders: {
    getAll(status?: string, startDate?: string, endDate?: string): Promise<WorkOrder[]> {
      let url = '/work-orders';
      const params: string[] = [];
      if (status) params.push(`status=${status}`);
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      return request<WorkOrder[]>(url, { method: 'GET' });
    },
    getById(id: number): Promise<WorkOrder> {
      return request<WorkOrder>(`/work-orders/${id}`, { method: 'GET' });
    },
    complete(id: number, data: CompleteWorkOrderRequest): Promise<WorkOrder> {
      return request<WorkOrder>(`/work-orders/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },
};
