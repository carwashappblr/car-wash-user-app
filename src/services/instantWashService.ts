import { apiClient } from '../api/client';

export type CarType = 'HATCHBACK' | 'SEDAN' | 'SUV';
export type WashType = 'EXTERIOR' | 'EXTERIOR_INTERIOR' | 'PREMIUM';
export type PaymentStatus = 'PAID' | 'UNPAID';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface InstantWash {
  id: string;
  machineId?: string | null;
  communityId: string;
  towerId?: string | null;
  plateNumber: string;
  carMake?: string | null;
  carModel?: string | null;
  carType: CarType;
  washType: WashType;
  price: number;
  paymentStatus: PaymentStatus;
  scheduledDate: string;
  status: TaskStatus;
  completedOn?: string | null;
  notes?: string | null;
  source: 'MACHINE' | 'USER';
  createdAt: string;
  updatedAt: string;
  machine?: { id: string; name: string } | null;
  community?: { id: string; name: string } | null;
  tower?: { id: string; name: string } | null;
}

export interface CreateInstantWashPayload {
  plateNumber: string;
  carType: CarType;
  washType: WashType;
  carMake?: string;
  carModel?: string;
  scheduledDate?: string;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface UpdateInstantWashPayload {
  status?: TaskStatus;
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface InstantWashPricing {
  id: string;
  communityId: string;
  carType: CarType;
  washType: WashType;
  price: number;
  isActive: boolean;
}

export const instantWashService = {
  getMyTowerWashes: (status?: TaskStatus): Promise<{ data: InstantWash[] }> => {
    return apiClient.get('/instant-washes/my-tower', {
      params: status ? { status } : undefined,
    });
  },

  createInstantWash: (payload: CreateInstantWashPayload): Promise<{ data: InstantWash }> => {
    return apiClient.post('/instant-washes', payload);
  },

  updateInstantWash: (id: string, payload: UpdateInstantWashPayload): Promise<{ data: InstantWash }> => {
    return apiClient.patch(`/instant-washes/${id}`, payload);
  },

  getPricingOptions: (): Promise<{ data: InstantWashPricing[] }> => {
    return apiClient.get('/instant-wash-pricing');
  },
};
