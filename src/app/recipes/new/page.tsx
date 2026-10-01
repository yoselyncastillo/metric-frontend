"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { recipesService, CreateRecipeIngredientDto, PreviewCostsResult } from "@/services/recipes";
import { inventoryService, Supply } from "@/services/inventory";
import { 
  ArrowLeft,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Save,
  Info
} from "lucide-react";

export default function NewRecipePage() {
  const router = useRouter();
  
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [portions, setPortions] = useState("1");
  const [category, setCategory] = useState("");
  const [isIntermediate, setIsIntermediate] = useState(false);
  const [associatedSupplyId, setAssociatedSupplyId] = useState("");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isNewCatCustom, setIsNewCatCustom] = useState(false);
  
  // Extract unique categories from recipes
  const existingCategories = Array.from(new Set(recipes.map(r => r.category).filter(Boolean)));
  
  const [ingredients, setIngredients] = useState<CreateRecipeIngredientDto[]>([
    { supplyId: 0, quantity: 1, unit: "" }
  ]);
  
  // Cost Simulation State
  const [previewCosts, setPreviewCosts] = useState<PreviewCostsResult | null>(null);
  const [isDirty, setIsDirty] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("metric_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    const loadData = async () => {
      try {
        const [suppliesData, recipesData] = await Promise.all([
          inventoryService.getSupplies(),
          recipesService.getRecipes().catch(() => [])
        ]);
        setSupplies(suppliesData);
        setRecipes(recipesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingInit(false);
      }
    };
    loadData();
  }, [router]);

  // Extract unique existing categories from existing recipes to suggest them? 
  // (Optional nice to have, but for now just text input)

  // Ingredient interactions
  const addIngredient = () => {
    setIngredients([...ingredients, { supplyId: 0, quantity: 1, unit: "" }]);
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
    const validIngredients = ingredients.filter(i => i.supplyId > 0 && i.quantity > 0 && i.unit !== "");
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

    const validIngredients = ingredients.filter(i => i.supplyId > 0 && i.quantity > 0 && i.unit !== "");
    if (validIngredients.length === 0) {
      setError("Agrega al menos un ingrediente válido.");
      return;
    }

    if (isIntermediate && !associatedSupplyId) {
      setError("Debes seleccionar a qué insumo alimentará esta receta intermedia.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await recipesService.createRecipe({
        name,
        description: "Sin descripción", 
        portions: Number(portions),
        ingredients: validIngredients,
        category: category.trim() || "Sin Categoría",
        isIntermediate,
        ...(isIntermediate && associatedSupplyId ? { associatedSupplyId: Number(associatedSupplyId) } : {})
      });
      router.push("/recipes");
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

  const validPortions = Number(portions) > 0 ? Number(portions) : 1;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/recipes" className="text-stone-400 hover:text-stone-700 transition-colors p-2 -ml-2 rounded-lg hover:bg-stone-100">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-stone-800">Diseñador de Recetas</h1>
              <p className="text-xs text-stone-500">Crea tu fórmula y analiza la viabilidad financiera.</p>
            </div>
          </div>
          <button
            type="submit"
            form="recipe-form"
            disabled={saving || isDirty}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Guardar Receta
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 shadow-sm">
            <AlertCircle size={20} />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* LEFT COLUMN: Recipe Structure */}
          <div className="w-full lg:w-3/5 xl:w-2/3 space-y-6">
            <form id="recipe-form" onSubmit={handleSaveRecipe} className="space-y-6">
              
              {/* Basic Info */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
                <h3 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-xs text-stone-500">1</span>
                  Configuración General
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Nombre de la Receta</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); setIsDirty(true); }}
                      placeholder="Ej. Masa Quebrada"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800 bg-stone-50/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Rendimiento (Porciones/Cant)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      value={portions}
                      onChange={(e) => { setPortions(e.target.value); setIsDirty(true); }}
                      placeholder="Ej. 1"
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800 bg-stone-50/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Categoría de Agrupación</label>
                    <select 
                      value={isNewCatCustom ? "custom" : category} 
                      onChange={e => {
                        if (e.target.value === "custom") {
                          setIsNewCatCustom(true);
                          setCategory("");
                        } else {
                          setIsNewCatCustom(false);
                          setCategory(e.target.value);
                          setIsDirty(true);
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800 bg-stone-50/50 transition-colors"
                    >
                      <option value="">Seleccionar categoría...</option>
                      {existingCategories.map((c: any) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                      <option value="custom">+ Agregar Nueva Categoría</option>
                    </select>
                    {isNewCatCustom && (
                      <input 
                        type="text" required
                        value={category} 
                        onChange={e => { setCategory(e.target.value); setIsDirty(true); }}
                        placeholder="Escribe la nueva categoría..."
                        className="w-full mt-2 px-4 py-2.5 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-stone-800 bg-stone-50/50 transition-colors"
                      />
                    )}
                  </div>
                  
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={isIntermediate}
                          onChange={(e) => { setIsIntermediate(e.target.checked); setIsDirty(true); }}
                        />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${isIntermediate ? 'bg-amber-500' : 'bg-stone-300'}`}></div>
                        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isIntermediate ? 'translate-x-4' : ''}`}></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-800">¿Es receta intermedia?</p>
                        <p className="text-[10px] text-stone-500 leading-tight">Activa si se usa en otras recetas.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {isIntermediate && (
                  <div className="mt-5 p-4 bg-amber-50/50 border border-amber-200/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-amber-900 mb-1.5">
                      ¿Qué insumo alimenta esta receta?
                    </label>
                    <p className="text-xs text-amber-700/80 mb-3">
                      Cuando produzcas esta receta, su rendimiento se inyectará como stock al insumo seleccionado.
                    </p>
                    <select
                      required
                      value={associatedSupplyId}
                      onChange={(e) => { setAssociatedSupplyId(e.target.value); setIsDirty(true); }}
                      className="w-full px-4 py-2.5 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-stone-800 bg-white shadow-sm"
                    >
                      <option value="" disabled>Seleccionar insumo destino...</option>
                      {supplies.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Ingredients List */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-xs text-stone-500">2</span>
                    Fórmula Dinámica
                  </h3>
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                  >
                    <Plus size={14} />
                    Añadir Insumo
                  </button>
                </div>
                
                <div className="space-y-3">
                  {ingredients.map((ing, idx) => {
                    const supply = supplies.find(s => Number(s.id) === ing.supplyId);
                    const availableUnits = supply ? [
                      supply.unit,
                      ...(supply.unitConversions?.map(c => c.name) || [])
                    ] : [];

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 rounded-xl hover:bg-stone-50 transition-colors border border-transparent hover:border-stone-100">
                        <div className="flex-1 w-full">
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 sm:hidden">Insumo</label>
                          <select
                            required
                            value={ing.supplyId || ""}
                            onChange={(e) => handleSupplyChange(idx, e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-800"
                          >
                            <option value="" disabled>Seleccionar...</option>
                            {supplies.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="w-full sm:w-28">
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 sm:hidden">Cantidad</label>
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={ing.quantity || ""}
                            onChange={(e) => updateIngredient(idx, 'quantity', Number(e.target.value))}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-800"
                            placeholder="0.0"
                          />
                        </div>

                        <div className="w-full sm:w-32">
                          <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1 sm:hidden">Unidad</label>
                          <select
                            required
                            disabled={!supply}
                            value={ing.unit}
                            onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 bg-white text-stone-800 disabled:bg-stone-50 disabled:text-stone-400"
                          >
                            <option value="" disabled>Unidad</option>
                            {availableUnits.map(u => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </div>

                        <div className="self-end sm:self-auto pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => removeIngredient(idx)}
                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar fila"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {ingredients.length === 0 && (
                  <div className="py-12 text-center text-stone-500 bg-stone-50 rounded-xl border-2 border-dashed border-stone-200">
                    <p className="text-sm">La fórmula está vacía.</p>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Financial Analysis */}
          <div className="w-full lg:w-2/5 xl:w-1/3">
            <div className="sticky top-[88px] space-y-6">
              
              {/* Cost Action Panel */}
              <div className="bg-stone-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
                
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 relative z-10">
                  <Calculator size={20} className="text-amber-500" />
                  Análisis Financiero
                </h3>
                <p className="text-sm text-stone-400 mb-6 relative z-10">
                  Calcula el impacto económico de tu fórmula.
                </p>

                <button
                  type="button"
                  onClick={calculateCosts}
                  disabled={calculating || (!isDirty && previewCosts !== null)}
                  className={`w-full flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all shadow-sm relative z-10 ${
                    !isDirty && previewCosts !== null
                      ? "bg-stone-800 text-emerald-400 cursor-not-allowed border border-emerald-900/50"
                      : isDirty && previewCosts !== null
                        ? "bg-amber-600 hover:bg-amber-500 text-white animate-pulse"
                        : "bg-white text-stone-900 hover:bg-stone-200"
                  }`}
                >
                  {calculating ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : !isDirty && previewCosts !== null ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Calculator size={20} />
                  )}
                  
                  {!isDirty && previewCosts !== null 
                    ? "Costos Calculados" 
                    : isDirty && previewCosts !== null 
                      ? "Actualizar Costos" 
                      : "Calcular Costos"}
                </button>

                {previewCosts && (
                  <div className={`mt-6 pt-6 border-t border-stone-800 transition-opacity duration-300 ${isDirty ? 'opacity-40 grayscale' : 'opacity-100'} relative z-10`}>
                    <div className="bg-stone-800/50 rounded-xl p-4 mb-4 border border-stone-700/50">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Costo Total Reposición</p>
                      <p className="text-3xl font-black text-white">{formatCurrency(previewCosts.totals.totalReplacementCost)}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-stone-800/30 rounded-xl p-4">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Costo FIFO</p>
                        <p className="text-lg font-bold text-stone-200">{formatCurrency(previewCosts.totals.totalFifoCost)}</p>
                      </div>
                      <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-900/30">
                        <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-1">Unitario (Reposición)</p>
                        <p className="text-lg font-bold text-amber-400">
                          {formatCurrency(previewCosts.totals.totalReplacementCost / validPortions)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Table Breakdown */}
              {previewCosts && (
                <div className={`bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden transition-opacity duration-300 ${isDirty ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                  <div className="p-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-2">
                    <Info size={16} className="text-stone-400" />
                    <h4 className="text-sm font-semibold text-stone-700">Desglose por Ingrediente</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-white border-b border-stone-100 text-[10px] uppercase tracking-wider text-stone-400">
                          <th className="p-3 pl-4 font-medium">Insumo</th>
                          <th className="p-3 font-medium text-right">Cant.</th>
                          <th className="p-3 pr-4 font-medium text-right">Aporte al Costo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 bg-stone-50/20">
                        {previewCosts.items.map((item, idx) => {
                          const supplyName = supplies.find(s => s.id === item.supplyId)?.name || 'Desconocido';
                          const impactPercent = previewCosts.totals.totalReplacementCost > 0 
                            ? (item.replacementCost / previewCosts.totals.totalReplacementCost) * 100 
                            : 0;
                            
                          return (
                            <tr key={idx} className="hover:bg-white transition-colors">
                              <td className="p-3 pl-4">
                                <p className="font-medium text-stone-800">{supplyName}</p>
                                {item.stockWarning && (
                                  <span className="text-[10px] text-amber-600 font-medium">⚠️ Bajo Stock</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <span className="text-stone-600">{item.quantity}</span>
                                <span className="text-stone-400 text-xs ml-1">{item.unit}</span>
                              </td>
                              <td className="p-3 pr-4 text-right">
                                <p className="font-semibold text-stone-800">{formatCurrency(item.replacementCost)}</p>
                                <p className="text-[10px] text-stone-500">{impactPercent.toFixed(1)}%</p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
