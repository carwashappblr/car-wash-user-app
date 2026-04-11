import { apiClient } from '../api/client';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServiceType = 'BASIC' | 'PREMIUM' | 'DELUXE';

export interface Task {
  id: string;
  status: TaskStatus;
  serviceType: ServiceType;
  carId: string;
  userId: string;
  machineId?: string | null;
  car?: {
    id: string;
    licensePlate: string;
    model: string;
    color: string;
  };
  machine?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  carId: string;
  serviceType: ServiceType;
}

export const taskService = {
  getMyTasks: (): Promise<{ data: Task[] }> =>
    apiClient.get('/tasks/my'),

  createTask: (payload: CreateTaskPayload): Promise<{ data: Task }> =>
    apiClient.post('/tasks', payload),

  updateTaskStatus: (id: string, status: TaskStatus): Promise<{ data: Task }> =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
};
