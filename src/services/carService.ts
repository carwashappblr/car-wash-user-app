import { apiClient } from '../api/client';

export interface Car {
  id: string;
  make?: string;
  plateNumber: string;
  licensePlate: string;
  model: string;
  color: string;
  defaultSlotId?: string;
  ownerId?: string;
  createdAt: string;
}

export interface CreateCarPayload {
  make: string;
  plateNumber: string;
  model: string;
  color: string;
  defaultSlotId: string;
}

interface RawCar {
  id: string;
  make?: string;
  model?: string;
  color?: string;
  plateNumber?: string;
  licensePlate?: string;
  defaultSlotId?: string;
  ownerId?: string;
  createdAt?: string;
}

const normalizeCar = (car: RawCar): Car => ({
  id: car.id,
  make: car.make,
  plateNumber: car.plateNumber ?? car.licensePlate ?? '',
  licensePlate: car.licensePlate ?? car.plateNumber ?? '',
  model: car.model ?? '',
  color: car.color ?? '',
  defaultSlotId: car.defaultSlotId,
  ownerId: car.ownerId,
  createdAt: car.createdAt ?? '',
});

export const carService = {
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
};
