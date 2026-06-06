import { apiClient } from '../api/client';
import { Car, CarType } from './carService';

export type WashType = 'EXTERIOR' | 'EXTERIOR_INTERIOR' | 'PREMIUM';

export interface PlanPricingTier {
  id: string;
  planId: string;
  carType: CarType;
  washType: WashType;
  priceMultiplier: number;
  surcharge: number;
}

export interface SubscriptionPlan {
  id: string;
  communityId: string;
  name: string;
  description: string;
  basePrice: number;
  baseWashCount: number;
  extraWashPrice: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pricingTiers?: PlanPricingTier[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  carId: string;
  carType: CarType;
  washType: WashType;
  washCount: number;
  computedPrice: number;
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
  washType: WashType;
  washCount: number;
}

export interface PricePreviewResponse {
  breakdown: {
    basePrice: number;
    carTypeMultiplier: number;
    adjustedBasePrice: number;
    washTypeSurcharge: number;
    baseWashCount: number;
    requestedWashCount: number;
    extraWashes: number;
    extraWashCharge: number;
    totalPrice: number;
  };
}

export const subscriptionService = {
  getPlans: (communityId?: string): Promise<{ data: SubscriptionPlan[] }> =>
    apiClient.get('/subscription-plans', { params: { communityId } }),

  createSubscription: (payload: CreateSubscriptionPayload): Promise<{ data: Subscription }> =>
    apiClient.post('/subscriptions', payload),

  getMySubscriptions: (): Promise<{ data: Subscription[] }> =>
    apiClient.get('/subscriptions/me'),

  previewPrice: (
    planId: string,
    carType: CarType,
    washType: WashType,
    washCount: number
  ): Promise<{ data: PricePreviewResponse }> =>
    apiClient.get(`/subscription-plans/${planId}/price-preview`, {
      params: { carType, washType, washCount },
    }),
};
