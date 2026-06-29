import { apiFetch } from './api';

export interface ExecuteProductionDto {
  recipeId: number;
  quantity: number;
  realQuantity?: number; // Opcional, para cuando la merma/rendimiento real difiere del teórico
}

export const productionService = {
  executeProduction: async (payload: ExecuteProductionDto): Promise<any> => {
    return apiFetch<any>('/production/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
};
