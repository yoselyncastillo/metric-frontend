import { apiFetch } from './api';

export interface UnitConversion {
  id: string | number;
  name: string;
  factor: string | number;
}

export interface SupplyFormat {
  id: string | number;
  name: string;
  quantity: string | number;
}

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
  category?: string;
  totalAvailable?: number;
  batches?: Batch[];
  unitConversions?: UnitConversion[];
  formats?: SupplyFormat[];
}

export interface CreateBatchPayload {
  supplyId: string | number;
  storeId: string | number;
  quantity: number;
  unitCost: number;
  supplyFormatId?: number;
  expirationDate?: string | null;
  createdAt?: string;
}

export interface CreateStorePayload {
  name: string;
  address?: string;
  phone?: string;
  instagramUrl?: string;
  mapsUrl?: string;
}

export interface CreateSupplyPayload {
  name: string;
  unit: string;
  category?: string;
  initialQuantity?: number;
  totalPaid?: number;
  storeId?: number;
  createdAt?: string;
}

export interface CreateUnitConversionPayload {
  name: string;
  factor: number;
}

export interface CreateSupplyFormatPayload {
  name: string;
  quantity: number;
  supplyId: number | string;
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

  deleteStore: async (id: string | number): Promise<void> => {
    return apiFetch(`/stores/${id}`, {
      method: 'DELETE',
    });
  },
  
  getSupplies: async (): Promise<Supply[]> => {
    return apiFetch<Supply[]>('/supplies');
  },
  
  createSupply: async (payload: CreateSupplyPayload): Promise<Supply> => {
    return apiFetch<Supply>('/supplies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateSupply: async (id: string | number, payload: { name?: string; category?: string; unit?: string }): Promise<Supply> => {
    return apiFetch<Supply>(`/supplies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  
  createBatch: async (payload: CreateBatchPayload): Promise<Batch> => {
    return apiFetch<Batch>(`/supplies/${payload.supplyId}/batches`, {
      method: 'POST',
      body: JSON.stringify({ 
        storeId: payload.storeId,
        initialQuantity: payload.quantity, 
        totalPaid: payload.unitCost * payload.quantity,
        ...(payload.supplyFormatId ? { supplyFormatId: payload.supplyFormatId } : {}),
        ...(payload.createdAt ? { createdAt: payload.createdAt } : {})
      }),
    });
  },

  updateBatch: async (batchId: string | number, payload: { quantity?: number; remainingQuantity?: number; price?: number }): Promise<Batch> => {
    return apiFetch<Batch>(`/batches/${batchId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  deleteBatch: async (batchId: string | number): Promise<void> => {
    return apiFetch(`/batches/${batchId}`, {
      method: 'DELETE',
    });
  },

  addConversion: async (supplyId: string | number, payload: CreateUnitConversionPayload): Promise<UnitConversion> => {
    return apiFetch<UnitConversion>(`/supplies/${supplyId}/conversions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  removeConversion: async (conversionId: string | number): Promise<void> => {
    return apiFetch(`/supplies/conversions/${conversionId}`, {
      method: 'DELETE',
    });
  },

  addFormat: async (payload: CreateSupplyFormatPayload): Promise<SupplyFormat> => {
    return apiFetch<SupplyFormat>('/supplies/formats', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteSupply: async (id: string | number): Promise<void> => {
    return apiFetch(`/supplies/${id}`, {
      method: 'DELETE',
    });
  }
};
