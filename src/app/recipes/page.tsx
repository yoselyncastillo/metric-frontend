"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recipesService, Recipe } from "@/services/recipes";
import { 
  ChefHat, 
  Plus
} from "lucide-react";

export default function RecipesPage() {
  const router = useRouter();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  const fetchData = async () => {
    try {
      const recipesData = await recipesService.getRecipes().catch(() => []);
      setRecipes(recipesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInit(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("metric_token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  if (loadingInit) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-8 bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full min-h-screen flex flex-col bg-stone-50">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Recetas & Costos</h1>
          <p className="text-stone-500">Diseña tus recetas, estandariza porciones y controla márgenes.</p>
        </div>
        <Link
          href="/recipes/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-900 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          Nueva Receta
        </Link>
      </div>

      {/* Grid de Recetas */}
      {recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl bg-white/50 py-20">
          <ChefHat size={48} className="text-stone-300 mb-4" />
          <h3 className="text-lg font-medium text-stone-700 mb-1">Sin recetas</h3>
          <p className="text-stone-500 text-sm mb-6">Aún no has estandarizado ninguna receta en Metric.</p>
          <Link
            href="/recipes/new"
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
          >
            Crear primera receta
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recipes.map((recipe) => {
            const costRep = recipe.costSummary?.totalReplacementCost || 0;
            const costUnit = recipe.portions > 0 ? costRep / recipe.portions : 0;

            return (
              <div key={recipe.id} className="bg-white rounded-2xl p-5 border border-stone-200/60 shadow-sm hover:shadow-md transition-shadow flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ChefHat size={64} className="text-amber-600 transform translate-x-4 -translate-y-4" />
                </div>
                
                <h3 className="text-lg font-bold text-stone-800 mb-1 relative z-10">{recipe.name}</h3>
                <p className="text-sm text-stone-500 mb-6 relative z-10">Rinde {recipe.portions} porciones</p>
                
                <div className="mt-auto space-y-3 relative z-10">
                  <div className="flex justify-between items-end pb-3 border-b border-stone-100">
                    <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Costo Lote</span>
                    <span className="font-semibold text-stone-700">{formatCurrency(costRep)}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">Costo x Porción</span>
                    <span className="text-lg font-bold text-amber-600">{formatCurrency(costUnit)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
