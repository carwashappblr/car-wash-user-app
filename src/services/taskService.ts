import { apiClient } from '../api/client';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ServiceType = 'BASIC' | 'PREMIUM' | 'DELUXE';

// ── Operator-facing Task (existing shape) ──────────────────────────────────────
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

// ── User-facing Task (GET /tasks/my paginated) ─────────────────────────────────
export interface UserTask {
  id: string;
  status: TaskStatus;
  slotId: string;
  scheduledDate: string;
  isSubscriptionTask: boolean;
  notes?: string | null;
  createdAt: string;
  car: {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
    color: string;
  };
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedTasksResponse {
  data: UserTask[];
  pagination: PaginationMeta;
}

export interface PendingTowerTask {
  id: string;
  status: TaskStatus;
  machineId?: string | null;
  slotId: string;
  scheduledDate: string;
  isSubscriptionTask: boolean;
  notes?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    phone?: string | null;
  };
  car: {
    id: string;
    make: string;
    model: string;
    plateNumber: string;
    color?: string | null;
    towerId: string;
    defaultSlotNumber?: string | null;
  };
  machine?: {
    id: string;
    name: string;
    email?: string | null;
  } | null;
}

export interface CreateTaskPayload {
  carId: string;
  serviceType: ServiceType;
}

export const taskService = {
  /** Paginated list of the current user's washes */
  getMyTasksPaginated: (page: number): Promise<{ data: PaginatedTasksResponse }> =>
    apiClient.get('/tasks/my', { params: { page } }),

  /** Legacy (non-paginated) – kept for operator/machine screens and User HomeScreen */
  getMyTasks: (): Promise<{ data: Task[] }> =>
    apiClient.get('/tasks'),

  getMyTowerTasks: async (statuses?: TaskStatus[]): Promise<{ data: PendingTowerTask[] }> => {
    const statusParam = statuses?.join(',');
    console.log('[taskService] GET my tower tasks', { status: statusParam });
    try {
      const response = await apiClient.get<PendingTowerTask[]>('/tasks/my-tower/pending', {
        params: statusParam ? { status: statusParam } : undefined,
      });
      console.log('[taskService] GET my tower tasks success', { count: response.data.length });
      return response;
    } catch (error: any) {
      console.log('[taskService] GET my tower tasks failed', {
        status: error.response?.status,
        message: error.response?.data?.message ?? error.message,
      });
      throw error;
    }
  },

  createTask: (payload: CreateTaskPayload): Promise<{ data: Task }> =>
    apiClient.post('/tasks', payload),

  updateTaskStatus: <T = Task>(id: string, status: TaskStatus): Promise<{ data: T }> =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
};
