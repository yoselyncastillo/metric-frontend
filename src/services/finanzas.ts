import { apiFetch } from "./api";

export interface ClosurePreview {
  liquidIncome: number;
  realExpenses: number;
  netProfit: number;
}

export interface CashClosure {
  id: number;
  startDate: string;
  endDate: string;
  liquidIncome: number;
  realExpenses: number;
  netProfit: number;
  titheAmount: number;
  offeringPercentage: number;
  offeringAmount: number;
  isTithed: boolean;
  isOffered: boolean;
  createdAt: string;
  closedAt: string;
}

export const finanzasService = {
  getPreview: (startDate: string, endDate: string) => {
    return apiFetch<ClosurePreview>(`/closures/preview?startDate=${startDate}&endDate=${endDate}`);
  },

  createClosure: (data: { startDate: string; endDate: string; offeringPercentage: number }) => {
    return apiFetch<CashClosure>('/closures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getClosures: () => {
    return apiFetch<CashClosure[]>('/closures');
  },

  updateTitheStatus: (id: number, isTithed: boolean) => {
    return apiFetch<CashClosure>(`/closures/${id}/tithe`, {
      method: 'PATCH',
      body: JSON.stringify({ isTithed }),
    });
  },

  updateOfferingStatus: (id: number, isOffered: boolean) => {
    return apiFetch<CashClosure>(`/closures/${id}/offering`, {
      method: 'PATCH',
      body: JSON.stringify({ isOffered }),
    });
  }
};
