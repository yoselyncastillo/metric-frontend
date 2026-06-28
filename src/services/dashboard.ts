import { apiFetch } from './api';

export interface Recipe {
  id: string | number;
  name: string;
}

export interface FinishedProduct {
  id: string | number;
  name?: string;
  recipe?: Recipe;
  quantity: number;
  fifoCost: number;
  replacementCost: number;
  averageCost: number;
}

export interface ExtraExpense {
  id: string | number;
  description: string;
  amount: number;
  date: string;
}

export const dashboardService = {
  getFinishedProducts: async (): Promise<FinishedProduct[]> => {
    return apiFetch<FinishedProduct[]>('/production/finished-products');
  },

  getAccountingExpenses: async (): Promise<ExtraExpense[]> => {
    return apiFetch<ExtraExpense[]>('/accounting');
  },
};
