"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recipesService, Recipe } from "@/services/recipes";
import { 
  ArrowLeft,
  Calculator,
  Scale,
  ChefHat,
  AlertCircle,
  Play
} from "lucide-react";
import React from "react";

export default function RecipeDetailScalerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scaler State
  const [targetPortions, setTargetPortions] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("metric_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const loadData = async () => {
      try {
        const { id } = await params;
        const recipeData = await recipesService.getRecipeById(id);
        setRecipe(recipeData);
        setTargetPortions(recipeData.portions.toString());
      } catch (err) {
        console.error(err);
        setError("Error al cargar la receta.");
      } finally {
        setLoadingInit(false);
      }
    };

    loadData();
  }, [router, params]);

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

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-stone-50 p-8 flex flex-col items-center justify-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error || "Receta no encontrada."}</span>
        </div>
        <Link href="/recipes" className="mt-4 text-stone-500 hover:text-stone-800 underline">Volver al catálogo</Link>
      </div>
    );
  }

  // --- MOTOR DE REESCALADO MATEMÁTICO ---
  const originalPortions = recipe.portions || 1;
  const newPortionsNum = Number(targetPortions) > 0 ? Number(targetPortions) : 1;
  const scaleFactor = newPortionsNum / originalPortions;

  const originalReplacementCost = recipe.costSummary?.totalReplacementCost || 0;
  const newReplacementCost = originalReplacementCost * scaleFactor;
  const unitCost = originalPortions > 0 ? originalReplacementCost / originalPortions : 0;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      {/* Header Estético */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/recipes" className="text-stone-400 hover:text-stone-700 transition-colors p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-stone-800 tracking-tight">{recipe.name}</h1>
                {recipe.isIntermediate ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    Intermedia 🔄
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    Final 🏪
                  </span>
                )}
              </div>
              <p className="text-sm text-stone-500">{recipe.category || "Sin Categoría"}</p>
            </div>
          </div>
          <Link
            href={`/recipes/edit/${recipe.id}`}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors shadow-sm"
          >
            Editar Fórmula Original
          </Link>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* COLUMNA IZQUIERDA: MOTOR DE ESCALA Y LISTA */}
        <div className="w-full lg:w-2/3 space-y-6">
          
          {/* Card de Escala */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="bg-stone-100 p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col justify-center">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <ChefHat size={14} /> Rendimiento Original
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-stone-800">{originalPortions}</span>
                <span className="text-stone-500 font-medium">unidades</span>
              </div>
            </div>
            
            <div className="p-6 md:w-2/3 flex flex-col justify-center bg-amber-50/30">
              <label className="text-xs font-bold text-amber-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Scale size={14} className="text-amber-600" />
                Cambiar Rendimiento / Reescalar
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={targetPortions}
                  onChange={(e) => setTargetPortions(e.target.value)}
                  className="w-32 px-4 py-3 text-2xl font-bold text-stone-800 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-center bg-white"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-stone-600">Nuevas unidades</span>
                  <span className="text-xs text-stone-400">Factor de multiplicación: <strong className="text-amber-600 font-bold">{scaleFactor.toFixed(2)}x</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Ingredientes Escalada */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 bg-stone-50/50">
              <h3 className="text-base font-bold text-stone-800">Receta Reescalada en Vivo</h3>
              <p className="text-xs text-stone-500 mt-0.5">Sigue estas cantidades exactas en la cocina para tu nuevo rendimiento.</p>
            </div>
            
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400">
                  <th className="p-4 pl-6 font-semibold">Ingrediente</th>
                  <th className="p-4 font-semibold text-right">Cant. Original</th>
                  <th className="p-4 pr-6 font-bold text-amber-700 bg-amber-50/50 text-right">Cant. Reescalada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {(!recipe.ingredients || recipe.ingredients.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-stone-500 text-sm">Esta receta no tiene ingredientes registrados.</td>
                  </tr>
                ) : (
                  recipe.ingredients.map((ing: any, idx) => {
                    const originalQty = Number(ing.quantity);
                    const scaledQty = originalQty * scaleFactor;
                    const supplyName = ing.supply?.name || "Insumo Desconocido";

                    return (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="p-4 pl-6">
                          <p className="font-semibold text-stone-800 text-sm">{supplyName}</p>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-stone-500 font-medium">{originalQty.toFixed(2)}</span>
                          <span className="text-xs text-stone-400 ml-1">{ing.unit}</span>
                        </td>
                        <td className="p-4 pr-6 text-right bg-amber-50/10 group-hover:bg-amber-50/30 transition-colors">
                          <span className="text-lg font-black text-amber-700">{scaledQty.toFixed(2)}</span>
                          <span className="text-xs font-bold text-amber-600/70 ml-1">{ing.unit}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUMNA DERECHA: COSTOS EN VIVO */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-28">
            <div className="bg-stone-900 rounded-2xl p-6 shadow-xl relative overflow-hidden text-stone-100">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl transform translate-x-12 -translate-y-12 pointer-events-none"></div>
              
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                <Calculator size={20} className="text-amber-500" />
                Costos del Lote
              </h3>

              <div className="space-y-4 relative z-10">
                <div className="bg-stone-800/50 border border-stone-700/50 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex justify-between">
                    <span>Costo Unitario</span>
                    <span className="text-stone-500">Invariable</span>
                  </p>
                  <p className="text-xl font-bold text-stone-300">{formatCurrency(unitCost)}</p>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 flex justify-between">
                    <span>Costo Lote Escalado</span>
                    <span className="text-amber-500/60">Para {newPortionsNum} uds</span>
                  </p>
                  <p className="text-3xl font-black text-amber-400">{formatCurrency(newReplacementCost)}</p>
                  <p className="text-xs text-amber-500/70 mt-2 font-medium">
                    Esto es lo que te cuesta (a precio de reposición) producir este nuevo lote hoy.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-stone-800 relative z-10">
                <button
                  onClick={() => {
                    // Open the global production panel via state if needed, or route back to recipes
                    // But since we are isolated, routing back to recipes is easiest for production trigger.
                    router.push('/recipes');
                  }}
                  className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-white text-stone-900 hover:bg-stone-100 rounded-xl text-sm font-bold transition-all shadow-sm group"
                >
                  <Play size={16} className="group-hover:scale-110 transition-transform text-amber-600" />
                  Ir al Catálogo a Producir
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
