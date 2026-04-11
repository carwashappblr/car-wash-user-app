import { apiClient } from '../api/client';

export interface Car {
  id: string;
  licensePlate: string;
  model: string;
  color: string;
  ownerId: string;
  createdAt: string;
}

export interface CreateCarPayload {
  licensePlate: string;
  model: string;
  color: string;
}

export const carService = {
  getCars: (): Promise<{ data: Car[] }> =>
    apiClient.get('/cars'),

  addCar: (payload: CreateCarPayload): Promise<{ data: Car }> =>
    apiClient.post('/cars', payload),
};
