import { apiClient } from '../api/client';

export interface Car {
  id: string;
  make?: string;
  plateNumber: string;
  licensePlate: string;
  model: string;
  color: string;
  towerId?: string;
  defaultSlotNumber?: string;
  userId?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Tower {
  id: string;
  name: string;
}

export interface Community {
  id: string;
  name: string;
  towers: Tower[];
}

export interface CreateCarPayload {
  towerId: string;
  make: string;
  plateNumber: string;
  model: string;
  color?: string;
  defaultSlotNumber?: string;
}

interface RawCar {
  id: string;
  make?: string;
  model?: string;
  color?: string;
  towerId?: string;
  plateNumber?: string;
  licensePlate?: string;
  defaultSlotNumber?: string;
  userId?: string;
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const normalizeCar = (car: RawCar): Car => ({
  id: car.id,
  make: car.make,
  plateNumber: car.plateNumber ?? car.licensePlate ?? '',
  licensePlate: car.licensePlate ?? car.plateNumber ?? '',
  model: car.model ?? '',
  color: car.color ?? '',
  towerId: car.towerId,
  defaultSlotNumber: car.defaultSlotNumber,
  userId: car.userId,
  ownerId: car.ownerId,
  createdAt: car.createdAt ?? '',
  updatedAt: car.updatedAt,
});

export const carService = {
  getCommunities: (): Promise<{ data: Community[] }> =>
    apiClient.get('/communities'),

  getCars: async (): Promise<{ data: Car[] }> => {
    const response = await apiClient.get<RawCar[]>('/cars');
    return {
      ...response,
      data: response.data.map(normalizeCar),
    };
  },

  addCar: async (payload: CreateCarPayload): Promise<{ data: Car }> => {
    const response = await apiClient.post<RawCar>('/cars', payload);
    return {
      ...response,
      data: normalizeCar(response.data),
    };
  },

  updateCar: async (id: string, payload: CreateCarPayload): Promise<{ data: Car }> => {
    const response = await apiClient.patch<RawCar>(`/cars/${id}`, payload);
    return {
      ...response,
      data: normalizeCar(response.data),
    };
  },
};
