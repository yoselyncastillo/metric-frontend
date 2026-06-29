"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { recipesService, Recipe, CreateRecipeIngredientDto, PreviewCostsResult } from "@/services/recipes";
import { inventoryService, Supply } from "@/services/inventory";
import { 
  ChefHat, 
  Plus, 
  X,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Trash2
} from "lucide-react";

export default function RecipesPage() {
  const router = useRouter();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [portions, setPortions] = useState("1");
  const [ingredients, setIngredients] = useState<CreateRecipeIngredientDto[]>([]);
  
  // Cost Simulation State
  const [previewCosts, setPreviewCosts] = useState<PreviewCostsResult | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const fetchData = async () => {
    try {
      const [recipesData, suppliesData] = await Promise.all([
        recipesService.getRecipes().catch(() => []),
        inventoryService.getSupplies().catch(() => [])
      ]);
      setRecipes(recipesData);
      setSupplies(suppliesData);
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

  // Modal functions
  const openModal = () => {
    setName("");
    setPortions("1");
    setIngredients([{ supplyId: 0, quantity: 1, unit: "g" }]); // Start with 1 empty ingredient row
    setPreviewCosts(null);
    setIsDirty(true);
    setError(null);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Ingredient interactions
  const addIngredient = () => {
    setIngredients([...ingredients, { supplyId: 0, quantity: 1, unit: "g" }]);
    setIsDirty(true);
  };

  const removeIngredient = (index: number) => {
    const newIngs = [...ingredients];
    newIngs.splice(index, 1);
    setIngredients(newIngs);
    setIsDirty(true);
  };

  const updateIngredient = (index: number, field: keyof CreateRecipeIngredientDto, value: any) => {
    const newIngs = [...ingredients];
    newIngs[index] = { ...newIngs[index], [field]: value };
    setIngredients(newIngs);
    setIsDirty(true);
  };

  // Supply selection change logic: auto-update the unit based on the selected supply
  const handleSupplyChange = (index: number, supplyIdStr: string) => {
    const supplyId = Number(supplyIdStr);
    const supply = supplies.find(s => Number(s.id) === supplyId);
    
    const newIngs = [...ingredients];
    newIngs[index] = { 
      ...newIngs[index], 
      supplyId,
      unit: supply ? supply.unit : newIngs[index].unit 
    };
    setIngredients(newIngs);
    setIsDirty(true);
  };

  const calculateCosts = async () => {
    // Validate
    const validIngredients = ingredients.filter(i => i.supplyId > 0 && i.quantity > 0);
    if (validIngredients.length === 0) {
      setError("Debes agregar al menos un ingrediente válido para calcular.");
      return;
    }

    setCalculating(true);
    setError(null);
    try {
      const result = await recipesService.estimateCost(validIngredients);
      setPreviewCosts(result);
      setIsDirty(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al calcular los costos.");
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDirty) {
      setError("Por favor, calcula o actualiza los costos antes de guardar.");
      return;
    }

    const validIngredients = ingredients.filter(i => i.supplyId > 0 && i.quantity > 0);
    if (validIngredients.length === 0) {
      setError("Agrega al menos un ingrediente válido.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await recipesService.createRecipe({
        name,
        description: "Sin descripción", // Podría ser dinámico luego
        portions: Number(portions),
        ingredients: validIngredients
      });
      await fetchData();
      closeModal();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al crear la receta.");
    } finally {
      setSaving(false);
    }
  };

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
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-900 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={18} />
          Nueva Receta
        </button>
      </div>

      {error && !showModal && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Grid de Recetas */}
      {recipes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-stone-200 rounded-2xl bg-white/50 py-20">
          <ChefHat size={48} className="text-stone-300 mb-4" />
          <h3 className="text-lg font-medium text-stone-700 mb-1">Sin recetas</h3>
          <p className="text-stone-500 text-sm mb-6">Aún no has estandarizado ninguna receta en Metric.</p>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
          >
            Crear primera receta
          </button>
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

      {/* Modal de Creación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-stone-200 flex flex-col">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <div>
                <h3 className="text-lg font-bold text-stone-800">Diseñador de Receta</h3>
                <p className="text-sm text-stone-500">Agrega ingredientes y calcula tus costos exactos.</p>
              </div>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 bg-white p-1.5 rounded-md shadow-sm border border-stone-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-stone-50/30">
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form id="recipe-form" onSubmit={handleSaveRecipe} className="space-y-8">
                {/* Info Básica */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-stone-200">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Nombre de la Receta</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                      placeholder="Ej. Pastel de Zanahoria Premium"
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800 bg-stone-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-1.5">Rendimiento (Porciones)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={portions}
                      onChange={(e) => { setPortions(e.target.value); setIsDirty(true); }}
                      placeholder="Ej. 12"
                      className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800 bg-stone-50"
                    />
                  </div>
                </div>

                {/* Ingredientes */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold text-stone-800 uppercase tracking-wider">Fórmula (Ingredientes)</h4>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors border border-amber-200/50"
                    >
                      <Plus size={14} />
                      Añadir Fila
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase tracking-wider text-stone-500">
                          <th className="p-3 pl-4 font-semibold w-[50%]">Insumo</th>
                          <th className="p-3 font-semibold w-[25%]">Cantidad</th>
                          <th className="p-3 font-semibold w-[15%] text-center">Unidad</th>
                          <th className="p-3 pr-4 font-semibold w-[10%] text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {ingredients.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-stone-50/50">
                            <td className="p-3 pl-4">
                              <select
                                required
                                value={ing.supplyId || ""}
                                onChange={(e) => handleSupplyChange(idx, e.target.value)}
                                className="w-full px-3 py-1.5 border border-stone-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-800"
                              >
                                <option value="" disabled>Selecciona un insumo...</option>
                                {supplies.map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                value={ing.quantity || ""}
                                onChange={(e) => updateIngredient(idx, 'quantity', Number(e.target.value))}
                                className="w-full px-3 py-1.5 border border-stone-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-800"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs font-medium uppercase border border-stone-200">
                                {ing.unit}
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-right">
                              <button
                                type="button"
                                onClick={() => removeIngredient(idx)}
                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {ingredients.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-stone-500 text-sm">
                              No hay ingredientes. Haz clic en "Añadir Fila" para comenzar.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Panel de Costos */}
                <div className="bg-stone-900 rounded-xl p-6 text-stone-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                        <Calculator size={20} className="text-amber-500" />
                        Simulador de Costos
                      </h4>
                      <p className="text-stone-400 text-sm">Calcula el costo real basado en tus lotes actuales (FIFO).</p>
                    </div>

                    <button
                      type="button"
                      onClick={calculateCosts}
                      disabled={calculating || (!isDirty && previewCosts !== null)}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all shadow-sm ${
                        !isDirty && previewCosts !== null
                          ? "bg-stone-800 text-emerald-400 cursor-not-allowed border border-emerald-900/50"
                          : isDirty && previewCosts !== null
                            ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                            : "bg-white text-stone-900 hover:bg-stone-200"
                      }`}
                    >
                      {calculating ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : !isDirty && previewCosts !== null ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <Calculator size={18} />
                      )}
                      
                      {!isDirty && previewCosts !== null 
                        ? "Costos al Día" 
                        : isDirty && previewCosts !== null 
                          ? "Actualizar Costos" 
                          : "Calcular Costos"}
                    </button>
                  </div>

                  {previewCosts && (
                    <div className={`mt-6 pt-6 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-6 transition-opacity duration-300 ${isDirty ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                      <div>
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Costo Reposición</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(previewCosts.totals.totalReplacementCost)}</p>
                        <p className="text-xs text-stone-400 mt-1">Precio actual del mercado</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Costo FIFO (Real)</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(previewCosts.totals.totalFifoCost)}</p>
                        <p className="text-xs text-stone-400 mt-1">Valor de tu inventario actual</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-500/70 uppercase tracking-wider mb-1">Costo Unitario (Reposición)</p>
                        <p className="text-2xl font-bold text-amber-500">
                          {formatCurrency(portions ? previewCosts.totals.totalReplacementCost / Number(portions) : 0)}
                        </p>
                        <p className="text-xs text-amber-500/60 mt-1">Por porción ({portions})</p>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-stone-100 bg-white flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="recipe-form"
                disabled={saving || isDirty}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-stone-50 bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving && <div className="w-4 h-4 border-2 border-stone-50 border-t-transparent rounded-full animate-spin" />}
                Guardar Receta Definitiva
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
