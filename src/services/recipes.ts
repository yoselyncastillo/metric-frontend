import { apiFetch } from './api';
import { Supply } from './inventory';

export interface RecipeIngredient {
  id?: number | string;
  supplyId: number | string;
  quantity: number | string;
  unit: string;
  supply?: Supply;
}

export interface RecipeCostSummary {
  totalFifoCost: number;
  totalReplacementCost: number;
  totalAverageCost: number;
  suggestedPrice: number;
}

export interface Recipe {
  id: number | string;
  name: string;
  description: string;
  portions: number;
  profitMargin: number | string;
  ingredients: RecipeIngredient[];
  costSummary?: RecipeCostSummary; // Returned by backend if modified
}

export interface CreateRecipeIngredientDto {
  supplyId: number;
  quantity: number;
  unit: string;
}

export interface CreateRecipeDto {
  name: string;
  description: string;
  portions: number;
  profitMargin?: number;
  ingredients: CreateRecipeIngredientDto[];
}

export interface PreviewIngredientCost extends CreateRecipeIngredientDto {
  fifoCost: number;
  replacementCost: number;
  averageCost: number;
  stockWarning: boolean;
}

export interface PreviewCostsResult {
  items: PreviewIngredientCost[];
  totals: {
    totalFifoCost: number;
    totalReplacementCost: number;
    totalAverageCost: number;
  };
}

export const recipesService = {
  getRecipes: async (): Promise<Recipe[]> => {
    return apiFetch<Recipe[]>('/recipes');
  },
  
  createRecipe: async (payload: CreateRecipeDto): Promise<Recipe> => {
    return apiFetch<Recipe>('/recipes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  estimateCost: async (ingredients: CreateRecipeIngredientDto[]): Promise<PreviewCostsResult> => {
    return apiFetch<PreviewCostsResult>('/recipes/preview-costs', {
      method: 'POST',
      body: JSON.stringify(ingredients),
    });
  }
};
