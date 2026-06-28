import { apiFetch } from './api';

export interface Batch {
  id: string | number;
  initialQuantity: string | number;
  remainingQuantity: string | number;
  costPerUnit: string | number;
  createdAt: string;
  store?: Store | null;
  supply?: Supply | null;
}

export interface Store {
  id: string | number;
  name: string;
  address?: string;
  phone?: string;
  instagramUrl?: string;
  mapsUrl?: string;
  batches?: Batch[];
}

export interface Supply {
  id: string | number;
  name: string;
  unit: string;
  totalAvailable?: number;
  batches?: Batch[];
}

export interface CreateBatchPayload {
  supplyId: string | number;
  storeId: string | number;
  quantity: number;
  unitCost: number;
  expirationDate?: string | null;
}

export interface CreateStorePayload {
  name: string;
  address?: string;
  phone?: string;
  instagramUrl?: string;
  mapsUrl?: string;
}

export const inventoryService = {
  getStores: async (): Promise<Store[]> => {
    return apiFetch<Store[]>('/stores');
  },
  
  createStore: async (payload: CreateStorePayload): Promise<Store> => {
    return apiFetch<Store>('/stores', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  
  getSupplies: async (): Promise<Supply[]> => {
    return apiFetch<Supply[]>('/supplies');
  },
  
  createSupply: async (name: string, unit: string): Promise<Supply> => {
    return apiFetch<Supply>('/supplies', {
      method: 'POST',
      body: JSON.stringify({ name, unit }),
    });
  },
  
  createBatch: async (payload: CreateBatchPayload): Promise<any> => {
    // Si la fecha está vacía, se elimina del payload
    const body = { ...payload };
    if (!body.expirationDate) {
      delete body.expirationDate;
    }
    return apiFetch<any>('/batches', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
