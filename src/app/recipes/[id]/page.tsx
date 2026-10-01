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
  Play,
  Heart,
  DollarSign,
  TrendingUp,
  Coins
} from "lucide-react";
import React from "react";

export default function RecipeDetailScalerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Scaler State - target portions is restricted strictly to integers
  const [targetPortions, setTargetPortions] = useState<number>(1);

  // Financial Simulation State (React states)
  const [overheadPercent, setOverheadPercent] = useState<string>("0");
  const [salePricePerUnit, setSalePricePerUnit] = useState<string>("0");
  const [offeringPercent, setOfferingPercent] = useState<string>("10");

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
        setTargetPortions(Math.round(recipeData.portions || 1));
        // Set default selling price as unit cost * default markup (e.g. unitCost * 1.5) as a nice starting point
        const originalCost = recipeData.costSummary?.totalReplacementCost || 0;
        const defaultPortions = recipeData.portions || 1;
        const defaultUnitCost = defaultPortions > 0 ? originalCost / defaultPortions : 0;
        setSalePricePerUnit(Math.round(defaultUnitCost * 1.5).toString());
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
  const originalPortions = Math.round(recipe.portions || 1);
  const newPortions = targetPortions > 0 ? targetPortions : 1;
  const scaleFactor = newPortions / originalPortions;

  const originalReplacementCost = recipe.costSummary?.totalReplacementCost || 0;
  const costReposicionTotal = originalReplacementCost * scaleFactor;
  const unitCostOriginal = originalPortions > 0 ? originalReplacementCost / originalPortions : 0;

  // --- SIMULACIÓN FINANCIERA EN VIVO ---
  const overhead = Number(overheadPercent) >= 0 ? Number(overheadPercent) : 0;
  const costoConOverhead = costReposicionTotal * (1 + overhead / 100);

  const pricePerUnit = Number(salePricePerUnit) >= 0 ? Number(salePricePerUnit) : 0;
  const ingresoTotalProyectado = pricePerUnit * newPortions;
  const gananciaNetaTotal = ingresoTotalProyectado - costoConOverhead;
  const margenGananciaPercent = ingresoTotalProyectado > 0 ? (gananciaNetaTotal / ingresoTotalProyectado) * 100 : 0;

  // --- DIEZMO Y OFRENDA EN VIVO ---
  const diezmo = gananciaNetaTotal > 0 ? gananciaNetaTotal * 0.10 : 0;
  const offeringRate = Number(offeringPercent) >= 0 ? Number(offeringPercent) : 10;
  const ofrenda = gananciaNetaTotal > 0 ? gananciaNetaTotal * (offeringRate / 100) : 0;
  const gananciaDisponibleFinal = gananciaNetaTotal - (diezmo + ofrenda);

  const handlePortionsInputChange = (val: string) => {
    const num = parseInt(val, 10);
    setTargetPortions(isNaN(num) ? 1 : Math.max(1, num));
  };

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
                Reescalar Rendimiento (Números Enteros)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={targetPortions}
                  onChange={(e) => handlePortionsInputChange(e.target.value)}
                  className="w-32 px-4 py-3 text-2xl font-bold text-stone-800 border-2 border-amber-200 rounded-xl focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-center bg-white"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-stone-600">Nuevas unidades</span>
                  <span className="text-xs text-stone-400">Factor de multiplicación: <strong className="text-amber-600 font-bold">{scaleFactor.toFixed(3)}x</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Ingredientes Escalada */}
          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 bg-stone-50/50">
              <h3 className="text-base font-bold text-stone-800">Receta Reescalada en Vivo</h3>
              <p className="text-xs text-stone-500 mt-0.5">Cantidades exactas multiplicadas por el factor de escala.</p>
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

        {/* COLUMNA DERECHA: PANEL DE SIMULACIÓN FINANCIERA */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-stone-900 rounded-2xl p-6 shadow-xl relative overflow-hidden text-stone-100">
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl transform translate-x-12 -translate-y-12 pointer-events-none"></div>
            
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
              <Calculator size={20} className="text-amber-500" />
              Simulador Financiero en Vivo
            </h3>

            <div className="space-y-4 relative z-10">
              {/* Costo Reposición Total */}
              <div className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex justify-between">
                  <span>Costo Reposición Lote</span>
                  <span className="text-stone-500">Base</span>
                </p>
                <p className="text-2xl font-black text-white">{formatCurrency(costReposicionTotal)}</p>
                <p className="text-[10px] text-stone-500 mt-1">Costo Unit. original: {formatCurrency(unitCostOriginal)}</p>
              </div>

              {/* % Gastos Operativos (Overhead) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  % Gastos Operativos (Overhead)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={overheadPercent}
                    onChange={(e) => setOverheadPercent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-800/80 border border-stone-700 rounded-xl text-stone-100 font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none pr-10"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500">%</span>
                </div>
              </div>

              {/* Costo Total con Overhead */}
              <div className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Costo Total con Overhead</p>
                  <p className="text-lg font-bold text-stone-200 mt-0.5">{formatCurrency(costoConOverhead)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-stone-500 uppercase">Margen Overhead</p>
                  <p className="text-xs font-semibold text-stone-400">+{formatCurrency(costoConOverhead - costReposicionTotal)}</p>
                </div>
              </div>

              {/* Precio de Venta por Unidad */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-300 mb-1.5">
                  Precio de Venta Sugerido (Por Unidad)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={salePricePerUnit}
                    onChange={(e) => setSalePricePerUnit(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-stone-800/80 border border-stone-700 rounded-xl text-stone-100 font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Resultados de la Simulación */}
              <div className="bg-stone-800/30 border border-stone-700/30 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Ingreso Proyectado:</span>
                  <span className="font-semibold text-stone-200">{formatCurrency(ingresoTotalProyectado)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-stone-400">Ganancia Neta Lote:</span>
                  <span className={`font-bold ${gananciaNetaTotal >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {formatCurrency(gananciaNetaTotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-stone-800 pt-2">
                  <span className="text-stone-400 flex items-center gap-1"><TrendingUp size={12}/> Margen Comercial:</span>
                  <span className={`font-black ${margenGananciaPercent >= 30 ? "text-emerald-400" : margenGananciaPercent >= 0 ? "text-amber-400" : "text-rose-400"}`}>
                    {margenGananciaPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* MÓDULO DE DIEZMO Y OFRENDAS */}
            {gananciaNetaTotal > 0 && (
              <div className="mt-6 pt-6 border-t border-stone-800 relative z-10 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Coins size={16} className="text-amber-500" />
                  Aportes y Distribución
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  {/* Diezmo Fijo */}
                  <div className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-3.5">
                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-0.5 flex justify-between">
                      <span>Diezmo</span>
                      <span className="text-amber-500 font-bold">10%</span>
                    </p>
                    <p className="text-base font-bold text-stone-200">{formatCurrency(diezmo)}</p>
                  </div>

                  {/* Ofrenda Variable */}
                  <div className="bg-stone-800/60 border border-stone-700/50 rounded-xl p-3">
                    <label className="block text-[9px] font-bold text-stone-400 uppercase tracking-wider mb-1.5">
                      % Ofrenda Deseada
                    </label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={offeringPercent}
                        onChange={(e) => setOfferingPercent(e.target.value)}
                        className="w-12 px-1 py-0.5 text-xs bg-stone-900 border border-stone-700 rounded text-center font-bold text-white"
                      />
                      <span className="text-stone-300 font-bold text-xs">{formatCurrency(ofrenda)}</span>
                    </div>
                  </div>
                </div>

                {/* Ganancia Disponible Final */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Ganancia Disponible Final</p>
                    <p className="text-xl font-black text-amber-400 mt-0.5">{formatCurrency(gananciaDisponibleFinal)}</p>
                  </div>
                  <Heart size={20} className="text-amber-500 shrink-0" />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
