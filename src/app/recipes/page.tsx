"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recipesService, Recipe } from "@/services/recipes";
import { inventoryService, Supply } from "@/services/inventory";
import { productionService } from "@/services/production";
import { 
  ChefHat, 
  Plus,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Play,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Store,
  Edit2,
  Trash2,
  Copy
} from "lucide-react";
import React from "react";

export default function RecipesPage() {
  const router = useRouter();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // Accordion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Production Side Panel State
  const [productionRecipe, setProductionRecipe] = useState<Recipe | null>(null);
  const [quantity, setQuantity] = useState<string>("");
  const [realQuantity, setRealQuantity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [recipesData, suppliesData] = await Promise.all([
        recipesService.getRecipes().catch(() => []),
        inventoryService.getSupplies().catch(() => [])
      ]);
      setRecipes(recipesData);
      setSupplies(suppliesData);
      
      const categories = new Set(recipesData.map(r => r.category || "Sin Categoría"));
      setExpandedCategories(categories);
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

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const openProductionPanel = (recipe: Recipe) => {
    setProductionRecipe(recipe);
    setQuantity(recipe.portions.toString());
    setRealQuantity(""); // Default to empty, meaning it equals theoretical
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const closeProductionPanel = () => {
    setProductionRecipe(null);
    if (successMsg) {
      // If we had a successful production, optionally refresh data or inventory state elsewhere
      // In this case, recipes don't strictly need a refresh, but it's good hygiene
    }
  };

  const handleProductionExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productionRecipe || !quantity || Number(quantity) <= 0) {
      setErrorMsg("Debes ingresar una cantidad teórica válida para escalar la receta.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await productionService.executeProduction({
        recipeId: Number(productionRecipe.id),
        quantity: Number(quantity),
        ...(realQuantity && Number(realQuantity) > 0 ? { realQuantity: Number(realQuantity) } : {})
      });
      
      setSuccessMsg(`¡Éxito! Produjiste ${realQuantity || quantity} unidades de ${productionRecipe.name}. El inventario se ha actualizado.`);
      
      // Auto close after 2 seconds
      setTimeout(() => {
        closeProductionPanel();
      }, 2500);

    } catch (err: unknown) {
      let msg = "Ocurrió un error al procesar la producción en cocina.";
      if (err instanceof Error) {
        msg = err.message;
        
        // INTERCEPT INSUFFICIENT STOCK ERROR
        const stockMatch = msg.match(/Stock insuficiente para el insumo ID (\d+)/i);
        if (stockMatch && stockMatch[1]) {
          const supplyId = Number(stockMatch[1]);
          const foundSupply = supplies.find(s => Number(s.id) === supplyId);
          const supplyName = foundSupply ? foundSupply.name : `Insumo Desconocido (ID ${supplyId})`;
          msg = `❌ Producción Detenida: No hay suficiente stock de ${supplyName} (Necesitas revisar tus lotes o registrar una nueva compra).`;
        }
      }
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (id: string | number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta receta? Esta acción no se puede deshacer.')) return;
    try {
      await recipesService.deleteRecipe(id);
      fetchData(); // refresh list
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la receta.");
    }
  };

  const handleDuplicateRecipe = async (recipe: Recipe) => {
    const newName = prompt("Ingresa el nombre para la receta duplicada:", `${recipe.name} (Copia)`);
    if (!newName || !newName.trim()) return;

    try {
      // Map existing ingredients to the DTO payload format
      const validIngredients = recipe.ingredients.map(ing => ({
        supplyId: Number(ing.supply?.id || ing.supplyId),
        quantity: Number(ing.quantity),
        unit: ing.unit
      }));

      await recipesService.createRecipe({
        name: newName.trim(),
        description: recipe.description || "Copia duplicada",
        portions: Number(recipe.portions),
        ingredients: validIngredients,
        category: recipe.category || "Sin Categoría",
        isIntermediate: recipe.isIntermediate,
        ...(recipe.isIntermediate && recipe.associatedSupplyId ? { associatedSupplyId: Number(recipe.associatedSupplyId) } : {})
      });

      alert("Receta duplicada con éxito.");
      fetchData(); // refresh list
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al duplicar la receta.");
    }
  };

  if (loadingInit) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-8 bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const groupedRecipes = recipes.reduce((acc, recipe) => {
    const cat = recipe.category || "Sin Categoría";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(recipe);
    return acc;
  }, {} as Record<string, Recipe[]>);

  const categoryKeys = Object.keys(groupedRecipes).sort((a, b) => {
    if (a === "Sin Categoría") return 1;
    if (b === "Sin Categoría") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20 relative">
      {/* HEADER */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-800 tracking-tight">Recetas & Costos</h1>
            <p className="text-sm text-stone-500">Diseña tus fórmulas, categoriza y controla márgenes.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/recipes/new"
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm shadow-amber-600/20"
            >
              <Plus size={16} />
              Nueva Receta
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-8">

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
        <div className="space-y-6">
          {categoryKeys.map(category => {
            const isExpanded = expandedCategories.has(category);
            const items = groupedRecipes[category];

            // Calculate valuation/costs summary for this category
            const totalReplacementCostCategory = items.reduce((sum, r) => sum + (r.costSummary?.totalReplacementCost || 0), 0);

            return (
              <div key={category} className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-5 bg-stone-50/50 hover:bg-stone-100/50 transition-colors border-b border-stone-100 outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400 shadow-sm">
                      <FolderOpen size={16} />
                    </div>
                    <h2 className="text-lg font-bold text-stone-800">{category}</h2>
                    <span className="bg-stone-200 text-stone-600 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] uppercase font-bold text-stone-400">Costo Repuesto Cat.</p>
                      <p className="text-sm font-bold text-amber-800">{formatCurrency(totalReplacementCostCategory)}</p>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-stone-400" /> : <ChevronDown size={20} className="text-stone-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400 bg-white">
                          <th className="p-4 pl-6 font-semibold">Receta</th>
                          <th className="p-4 font-semibold">Tipo</th>
                          <th className="p-4 font-semibold text-right">Rendimiento</th>
                          <th className="p-4 font-semibold text-right">Costo Repuesto Lote</th>
                          <th className="p-4 font-semibold text-right">Costo x Porción</th>
                          <th className="p-4 pr-6 font-semibold text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {items.map(recipe => {
                          const costRep = recipe.costSummary?.totalReplacementCost || 0;
                          const costUnit = recipe.portions > 0 ? costRep / recipe.portions : 0;
                          const isIntermediate = Boolean(recipe.isIntermediate);

                          return (
                            <tr key={recipe.id} className="hover:bg-amber-50/30 transition-colors group">
                              <td className="p-4 pl-6">
                                <Link 
                                  href={`/recipes/${recipe.id}`} 
                                  className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors"
                                >
                                  {recipe.name}
                                </Link>
                              </td>
                              <td className="p-4">
                                {isIntermediate ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                                    Intermedia 🔄
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                    Final 🏪
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-right text-stone-600 font-semibold text-sm">
                                {recipe.portions} porciones
                              </td>
                              <td className="p-4 text-right text-stone-600 font-semibold text-sm">
                                {formatCurrency(costRep)}
                              </td>
                              <td className="p-4 text-right font-black text-amber-750 text-base">
                                {formatCurrency(costUnit)}
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => openProductionPanel(recipe)} 
                                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                  >
                                    <Play size={12} /> Producir
                                  </button>
                                  <button 
                                    onClick={() => handleDuplicateRecipe(recipe)} 
                                    title="Duplicar receta"
                                    className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-block"
                                  >
                                    <Copy size={16} />
                                  </button>
                                  <Link 
                                    href={`/recipes/edit/${recipe.id}`} 
                                    className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-block"
                                  >
                                    <Edit2 size={16} />
                                  </Link>
                                  <button 
                                    onClick={() => handleDeleteRecipe(recipe.id)} 
                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over Production Panel */}
      {productionRecipe && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeProductionPanel}
          ></div>
          
          {/* Side Panel */}
          <div className="relative w-full max-w-md bg-stone-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <ChefHat className="text-amber-600" size={24} />
                Cocinar Receta
              </h2>
              <button 
                onClick={closeProductionPanel}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Recipe Context Card */}
              <div className="bg-stone-900 text-stone-100 rounded-xl p-5 shadow-lg relative overflow-hidden mb-8">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8 pointer-events-none"></div>
                <h3 className="text-lg font-bold text-white mb-4 relative z-10">{productionRecipe.name}</h3>
                
                <div className="grid grid-cols-2 gap-4 border-b border-stone-800 pb-4 mb-4 relative z-10">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1 font-bold">Rendimiento Base</p>
                    <p className="font-medium text-stone-300">{productionRecipe.portions} uds</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-stone-500 mb-1 font-bold">Destino</p>
                    {productionRecipe.isIntermediate ? (
                      <p className="font-medium text-blue-400 flex items-center gap-1"><RefreshCw size={12}/> Inventario</p>
                    ) : (
                      <p className="font-medium text-emerald-400 flex items-center gap-1"><Store size={12}/> Vitrina</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-stone-400 relative z-10 leading-relaxed">
                  Al producir, Metric descontará del inventario todos los insumos usando el método FIFO.
                </p>
              </div>

              {successMsg && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <span className="font-medium text-sm">{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className={`mb-6 p-4 border rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 ${
                  errorMsg.startsWith('❌') 
                    ? 'bg-gradient-to-r from-red-50 to-amber-50 border-red-300 text-red-800 shadow-red-100' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  <AlertCircle size={20} className="shrink-0 mt-0.5" />
                  <span className="font-medium text-sm leading-relaxed">{errorMsg}</span>
                </div>
              )}

              <form id="production-form" onSubmit={handleProductionExecute} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-1">
                    Escalar Receta (Base teórica a procesar)
                  </label>
                  <p className="text-xs text-stone-500 mb-3">
                    Modifica este valor si vas a preparar el doble o la mitad de la receta original. Los insumos se descontarán proporcionalmente.
                  </p>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="0.1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-stone-800 bg-white font-medium"
                  />
                </div>

                <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-4">
                  <label className="block text-sm font-semibold text-amber-900 mb-1">
                    Rendimiento Real Obtenido (Merma)
                  </label>
                  <p className="text-xs text-amber-700/80 mb-3 leading-relaxed">
                    A veces cocinas para sacar {quantity || productionRecipe.portions} pero la realidad te da otro número. Ingresa cuánto obtuviste <span className="font-bold">realmente</span>. Si lo dejas vacío, asumiremos que lograste {quantity || productionRecipe.portions} exactos.
                  </p>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={realQuantity}
                    onChange={(e) => setRealQuantity(e.target.value)}
                    placeholder={`Ej. ${Number(quantity) * 0.95}`}
                    className="w-full px-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-stone-800 bg-white placeholder:text-stone-300 font-medium"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 bg-white border-t border-stone-200">
              <button
                type="submit"
                form="production-form"
                disabled={isSubmitting || !!successMsg}
                className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all shadow-md group disabled:opacity-50 disabled:cursor-not-allowed bg-stone-900 hover:bg-stone-800 focus:ring-4 focus:ring-stone-200"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Ejecutando en cocina...
                  </>
                ) : successMsg ? (
                  <>
                    <CheckCircle2 size={20} />
                    ¡Producción Completada!
                  </>
                ) : (
                  <>
                    <Play size={20} className="group-hover:scale-110 transition-transform" />
                    Ejecutar Producción
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
      </div>
  );
}
