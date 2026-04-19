import { apiClient } from '../api/client';
import { Car } from './carService';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  washCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  carId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  washesUsed: number;
  nextWashOn: string | null;
  lastWashAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: Partial<SubscriptionPlan>;
  car?: Partial<Car>;
}

export interface CreateSubscriptionPayload {
  planId: string;
  carId: string;
}

export const subscriptionService = {
  getPlans: (): Promise<{ data: SubscriptionPlan[] }> =>
    apiClient.get('/subscription-plans'),

  createSubscription: (payload: CreateSubscriptionPayload): Promise<{ data: Subscription }> =>
    apiClient.post('/subscriptions', payload),

  getMySubscriptions: (): Promise<{ data: Subscription[] }> =>
    apiClient.get('/subscriptions/me'),
};
