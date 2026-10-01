import { apiFetch } from "./api";

export type ProductLocationStatus = 'CASA' | 'LOCAL' | 'VENDIDO' | 'MERMA';

export interface ProductionBatch {
  id: number;
  recipe: {
    id: number;
    name: string;
  };
  quantityProduced: number;
  costPerUnit: number;
  createdAt: string;
}

export interface FinishedProduct {
  id: number;
  productionBatch: ProductionBatch;
  recipe: { name: string; id: number }; // Added this based on backend returning 'recipe' relation
  quantity: number;
  price: number;
  location: ProductLocationStatus;
  amountPaid: number;
  amountPending: number;
  createdAt: string;
  updatedAt: string;
  movedToLocalAt?: string;
  soldAt?: string;
}

export const vitrinaService = {
  getFinishedProducts: () => {
    return apiFetch<FinishedProduct[]>('/production/finished-products');
  },

  updateProduct: (id: number, data: { location?: ProductLocationStatus; price?: number; quantity?: number; amountPaid?: number; amountPending?: number }) => {
    return apiFetch<FinishedProduct>(`/production/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteProduct: (id: number) => {
    return apiFetch<{ message: string }>(`/production/${id}`, {
      method: 'DELETE',
    });
  }
};
