export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'operator';
}

export interface Field {
  id: number;
  code: string;
  area: number;
  humidityThreshold: number;
  currentHumidity?: number;
  status?: 'normal' | 'warning' | 'alarm';
  createdAt: string;
}

export interface SensorData {
  id: number;
  fieldId: number;
  humidity: number;
  timestamp: string;
}

export type WorkOrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface WorkOrder {
  id: number;
  fieldId: number;
  fieldCode: string;
  status: WorkOrderStatus;
  humidityAvg: number;
  triggeredAt: string;
  completedAt?: string;
  operatorId?: number;
  operatorName?: string;
  workDuration?: number;
  remark?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateFieldRequest {
  code: string;
  area: number;
  humidityThreshold: number;
}

export interface UpdateFieldRequest {
  code?: string;
  area?: number;
  humidityThreshold?: number;
}

export interface CompleteWorkOrderRequest {
  workDuration: number;
  remark: string;
  photoBase64?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
