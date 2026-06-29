"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { inventoryService, Supply, Store, Batch } from "@/services/inventory";
import {
  Package, Store as StoreIcon, Plus, ChevronDown, ChevronRight,
  Edit2, Trash2, Calendar, ShoppingCart, DollarSign,
  AlertCircle, CheckCircle2, X, RefreshCw, Layers
} from "lucide-react";
import React from "react";

const BASE_CATEGORIES = ["Materia Prima", "Semielaborados", "Empaque y Desechables"];

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"supplies" | "stores">("supplies");
  
  const [stores, setStores] = useState<Store[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [newStorePhone, setNewStorePhone] = useState("");
  const [newStoreIg, setNewStoreIg] = useState("");
  const [newStoreMaps, setNewStoreMaps] = useState("");

  // Categories Engine
  const allCategories = useMemo(() => {
    const cats = new Set(BASE_CATEGORIES);
    supplies.forEach(s => {
      if (s.category && s.category.trim() !== "") {
        cats.add(s.category.trim());
      }
    });
    return Array.from(cats);
  }, [supplies]);

  // Grouped Supplies
  const groupedSupplies = useMemo(() => {
    const groups: Record<string, Supply[]> = {};
    allCategories.forEach(c => groups[c] = []);
    groups["Sin Categoría"] = [];

    supplies.forEach(s => {
      const cat = (s.category && s.category.trim() !== "") ? s.category.trim() : "Sin Categoría";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(s);
    });
    return groups;
  }, [supplies, allCategories]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(BASE_CATEGORIES));

  // --- PANELS STATE ---
  const [invoicePanelOpen, setInvoicePanelOpen] = useState(false);
  const [editSupplyPanel, setEditSupplyPanel] = useState<Supply | null>(null);
  const [expandedSupplyId, setExpandedSupplyId] = useState<string | number | null>(null);
  const [newSupplyPanel, setNewSupplyPanel] = useState(false);

  const fetchData = async () => {
    try {
      const [storesData, suppliesData] = await Promise.all([
        inventoryService.getStores().catch(() => []),
        inventoryService.getSupplies().catch(() => [])
      ]);
      setStores(storesData);
      setSupplies(suppliesData);

      // Update panels if they are open using functional state to avoid closure race conditions
      setEditSupplyPanel(prev => {
        if (!prev) return null;
        return suppliesData.find(s => s.id === prev.id) || null;
      });
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

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const toggleCategory = (cat: string) => {
    const next = new Set(expandedCategories);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setExpandedCategories(next);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  // --- SUPPLY ACTIONS ---
  const [newSupplyName, setNewSupplyName] = useState("");
  const [newSupplyUnit, setNewSupplyUnit] = useState("g");
  const [newSupplyCat, setNewSupplyCat] = useState("");
  const [isNewCatCustom, setIsNewCatCustom] = useState(false);
  const [newSupplyStoreId, setNewSupplyStoreId] = useState("");
  const [newSupplyInitQty, setNewSupplyInitQty] = useState("");
  const [newSupplyTotalPaid, setNewSupplyTotalPaid] = useState("");

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setIsSubmitting(true);
    try {
      await inventoryService.createStore({ 
        name: newStoreName,
        address: newStoreAddress,
        phone: newStorePhone,
        instagramUrl: newStoreIg,
        mapsUrl: newStoreMaps
      });
      showSuccess("Tienda/Proveedor creado con éxito.");
      setNewStoreName("");
      setNewStoreAddress("");
      setNewStorePhone("");
      setNewStoreIg("");
      setNewStoreMaps("");
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al crear proveedor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStore = async (id: string | number) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await inventoryService.deleteStore(id);
      showSuccess("Proveedor eliminado.");
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al eliminar proveedor.");
    }
  };
  
  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplyName.trim()) return;
    setIsSubmitting(true);
    try {
      const supply = await inventoryService.createSupply({
        name: newSupplyName,
        unit: newSupplyUnit,
        category: newSupplyCat || undefined,
        initialQuantity: newSupplyInitQty ? Number(newSupplyInitQty) : undefined,
        totalPaid: newSupplyTotalPaid ? Number(newSupplyTotalPaid) : undefined,
        storeId: newSupplyStoreId ? Number(newSupplyStoreId) : undefined
      });
      showSuccess("Insumo creado con éxito.");
      setNewSupplyPanel(false);
      setNewSupplyName("");
      setNewSupplyCat("");
      setNewSupplyInitQty("");
      setNewSupplyTotalPaid("");
      setNewSupplyStoreId("");
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al crear insumo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupply = async (id: string | number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este insumo y TODO su historial? Esta acción no se puede deshacer.')) return;
    try {
      await inventoryService.deleteSupply(id);
      showSuccess("Insumo eliminado.");
      if (expandedSupplyId === id) setExpandedSupplyId(null);
      if (editSupplyPanel?.id === id) setEditSupplyPanel(null);
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al eliminar insumo.");
    }
  };

  // --- INVOICE REGISTRATION ---
  // Convert local date (YYYY-MM-DD) to an ISO string that corresponds to the same day in local time
  const getLocalDateISO = (dateStr: string) => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr + "T12:00:00");
    return date.toISOString();
  };

  const [invoiceStoreId, setInvoiceStoreId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD format based on local time
  const [invoiceRows, setInvoiceRows] = useState([{ supplyId: "", quantity: "", totalCost: "" }]);

  const addInvoiceRow = () => {
    setInvoiceRows([...invoiceRows, { supplyId: "", quantity: "", totalCost: "" }]);
  };

  const removeInvoiceRow = (index: number) => {
    const rows = [...invoiceRows];
    rows.splice(index, 1);
    setInvoiceRows(rows);
  };

  const updateInvoiceRow = (index: number, field: string, value: string) => {
    const rows = [...invoiceRows];
    (rows[index] as any)[field] = value;
    setInvoiceRows(rows);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceRows.length === 0 || !invoiceStoreId) {
      showError("Debes seleccionar una tienda y al menos un insumo.");
      return;
    }
    const validRows = invoiceRows.filter(r => r.supplyId && Number(r.quantity) > 0 && Number(r.totalCost) >= 0);
    if (validRows.length === 0) {
      showError("Las filas ingresadas no son válidas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = validRows.map(row => 
        inventoryService.createBatch({
          supplyId: row.supplyId,
          storeId: invoiceStoreId,
          quantity: Number(row.quantity),
          unitCost: Number(row.totalCost) / Number(row.quantity),
          createdAt: getLocalDateISO(invoiceDate)
        })
      );
      await Promise.all(promises);
      showSuccess("¡Factura registrada con éxito!");
      setInvoicePanelOpen(false);
      setInvoiceRows([{ supplyId: "", quantity: "", totalCost: "" }]);
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al registrar la factura.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EDIT BATCH INLINE ---
  const [editingBatchId, setEditingBatchId] = useState<string | number | null>(null);
  const [editBatchQty, setEditBatchQty] = useState("");
  const [editBatchRem, setEditBatchRem] = useState("");
  const [editBatchTotalPaid, setEditBatchTotalPaid] = useState("");

  const startEditingBatch = (batch: Batch) => {
    setEditingBatchId(batch.id);
    setEditBatchQty(batch.initialQuantity.toString());
    setEditBatchRem(batch.remainingQuantity.toString());
    setEditBatchTotalPaid((Number(batch.costPerUnit) * Number(batch.initialQuantity)).toString());
  };

  const cancelEditingBatch = () => {
    setEditingBatchId(null);
  };

  const handleSaveBatch = async (batchId: string | number) => {
    try {
      await inventoryService.updateBatch(batchId, {
        quantity: Number(editBatchQty),
        remainingQuantity: Number(editBatchRem),
        price: Number(editBatchTotalPaid) / Number(editBatchQty)
      });
      showSuccess("Lote actualizado.");
      setEditingBatchId(null);
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al actualizar lote.");
    }
  };

  const handleDeleteBatch = async (batchId: string | number) => {
    if (!confirm("¿Eliminar este lote permanentemente?")) return;
    try {
      await inventoryService.deleteBatch(batchId);
      showSuccess("Lote eliminado.");
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al eliminar lote.");
    }
  };

  // --- EDIT SUPPLY ---
  const [editSupplyCat, setEditSupplyCat] = useState("");
  const [editSupplyNameLocal, setEditSupplyNameLocal] = useState("");
  
  const openEditSupply = (s: Supply) => {
    setEditSupplyCat(s.category || "");
    setEditSupplyNameLocal(s.name);
    setEditSupplyPanel(s);
  };

  const handleSaveSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSupplyPanel) return;
    setIsSubmitting(true);
    try {
      await inventoryService.updateSupply(editSupplyPanel.id, {
        name: editSupplyNameLocal,
        category: editSupplyCat
      });
      showSuccess("Insumo actualizado.");
      setEditSupplyPanel(null);
      fetchData();
    } catch (err: any) {
      showError(err.message || "Error al actualizar insumo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInit) {
    return (
      <div className="flex h-screen items-center justify-center p-8 bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Global sorting for batch history is removed because it's now computed per expanded supply row

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20 relative">
      
      {/* GLOBAL TOASTS */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 shadow-xl animate-in slide-in-from-top-4 fade-in pointer-events-auto">
            <CheckCircle2 size={20} className="shrink-0" />
            <span className="font-medium text-sm">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 shadow-xl animate-in slide-in-from-top-4 fade-in pointer-events-auto">
            <AlertCircle size={20} className="shrink-0" />
            <span className="font-medium text-sm">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* HEADER */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-stone-800 tracking-tight">Inventario y Compras</h1>
            <p className="text-sm text-stone-500">Gestiona tus insumos, lotes y proveedores.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setNewSupplyPanel(true)}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors border border-stone-200 shadow-sm"
            >
              <Package size={16} />
              Nuevo Insumo
            </button>
            <button
              onClick={() => setInvoicePanelOpen(true)}
              className="flex-1 md:flex-none justify-center flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-all shadow-sm shadow-amber-600/20"
            >
              <ShoppingCart size={16} />
              + Registrar Compra
            </button>
          </div>
        </div>
        
        {/* TABS */}
        <div className="max-w-[1400px] mx-auto px-6 flex gap-6">
          <button
            className={`pb-4 pt-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "supplies" ? "border-amber-500 text-amber-700" : "border-transparent text-stone-400 hover:text-stone-600"}`}
            onClick={() => setActiveTab("supplies")}
          >
            Insumos & Lotes
          </button>
          <button
            className={`pb-4 pt-2 text-sm font-bold border-b-2 transition-colors ${activeTab === "stores" ? "border-amber-500 text-amber-700" : "border-transparent text-stone-400 hover:text-stone-600"}`}
            onClick={() => setActiveTab("stores")}
          >
            Proveedores
          </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 mt-8">
        
        {/* TAB 1: SUPPLIES */}
        {activeTab === "supplies" && (
          <div className="space-y-6">
            {Object.entries(groupedSupplies).map(([category, items]) => {
              const isExpanded = expandedCategories.has(category);
              if (items.length === 0) return null;

              return (
                <div key={category} className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
                  <button 
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-5 bg-stone-50/50 hover:bg-stone-100/50 transition-colors border-b border-stone-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-400 shadow-sm">
                        <Layers size={16} />
                      </div>
                      <h2 className="text-lg font-bold text-stone-800">{category}</h2>
                      <span className="bg-stone-200 text-stone-600 text-xs font-bold px-2 py-0.5 rounded-full">{items.length}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-stone-400" /> : <ChevronRight size={20} className="text-stone-400" />}
                  </button>

                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-stone-100 text-[10px] uppercase tracking-widest text-stone-400 bg-white">
                            <th className="p-4 pl-6 font-semibold">Insumo</th>
                            <th className="p-4 font-semibold text-right">Stock Total</th>
                            <th className="p-4 pr-6 font-semibold text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {items.map(supply => {
                            const isExpandedSupply = expandedSupplyId === supply.id;
                            const sortedBatches = supply.batches 
                              ? [...supply.batches].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                              : [];
                            return (
                            <React.Fragment key={supply.id}>
                              <tr 
                                className={`hover:bg-amber-50/30 transition-colors cursor-pointer group ${isExpandedSupply ? 'bg-amber-50/50' : ''}`}
                                onClick={() => { setExpandedSupplyId(isExpandedSupply ? null : supply.id); cancelEditingBatch(); }}
                              >
                                <td className="p-4 pl-6">
                                  <p className="font-bold text-stone-800 group-hover:text-amber-700 transition-colors flex items-center gap-2">
                                    {isExpandedSupply ? <ChevronDown size={16} className="text-amber-600" /> : <ChevronRight size={16} className="text-stone-300" />}
                                    {supply.name}
                                  </p>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="text-lg font-black text-stone-700 mr-1">{Number(supply.totalAvailable || 0).toFixed(2)}</span>
                                  <span className="text-xs font-bold text-stone-400">{supply.unit}</span>
                                </td>
                                <td className="p-4 pr-6 text-right">
                                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => openEditSupply(supply)} className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                                      <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDeleteSupply(supply.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              
                              {/* ACCORDION BATCH HISTORY */}
                              {isExpandedSupply && (
                                <tr>
                                  <td colSpan={3} className="p-0 border-b border-stone-200">
                                    <div className="bg-stone-50/80 px-8 py-6 shadow-inner border-t border-stone-200/50">
                                      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                                        <table className="w-full text-left">
                                          <thead>
                                            <tr className="bg-stone-100 border-b border-stone-200 text-[10px] uppercase tracking-widest text-stone-500">
                                              <th className="p-4 pl-6 font-bold">Fecha / Tienda</th>
                                              <th className="p-4 font-bold text-right">Cant. Actual / Inicial</th>
                                              <th className="p-4 font-bold text-right">Costo Unit.</th>
                                              <th className="p-4 font-bold text-right text-amber-700">Total Lote</th>
                                              <th className="p-4 pr-6 font-bold text-right">Acciones</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-stone-100">
                                            {sortedBatches.length === 0 ? (
                                              <tr><td colSpan={5} className="p-8 text-center text-stone-400">No hay lotes registrados para este insumo.</td></tr>
                                            ) : (
                                              sortedBatches.map(batch => {
                                                const isEditing = editingBatchId === batch.id;
                                                const originalTotal = Number(batch.initialQuantity) * Number(batch.costPerUnit);
                                                
                                                if (isEditing) {
                                                  return (
                                                    <tr key={batch.id} className="bg-amber-50/50">
                                                      <td className="p-4 pl-6 align-top">
                                                        <p className="font-bold text-sm">{formatDate(batch.createdAt)}</p>
                                                        <p className="text-xs text-stone-500">{batch.store?.name || "Sin tienda"}</p>
                                                      </td>
                                                      <td className="p-4 align-top">
                                                        <div className="flex flex-col gap-2 items-end">
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-[10px] uppercase text-stone-400 font-bold">Disp:</span>
                                                            <input type="number" step="any" value={editBatchRem} onChange={e => setEditBatchRem(e.target.value)} className="w-20 px-2 py-1 text-sm text-right border border-stone-300 rounded focus:border-amber-500 outline-none" />
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <span className="text-[10px] uppercase text-stone-400 font-bold">Inic:</span>
                                                            <input type="number" step="any" value={editBatchQty} onChange={e => setEditBatchQty(e.target.value)} className="w-20 px-2 py-1 text-sm text-right border border-stone-300 rounded focus:border-amber-500 outline-none" />
                                                          </div>
                                                        </div>
                                                      </td>
                                                      <td className="p-4 align-top text-right text-stone-400">
                                                        <span className="text-xs">Autocalculado</span>
                                                      </td>
                                                      <td className="p-4 align-top text-right pt-5">
                                                        <input type="number" step="any" value={editBatchTotalPaid} onChange={e => setEditBatchTotalPaid(e.target.value)} className="w-24 px-2 py-1 text-sm text-right border border-stone-300 rounded focus:border-amber-500 outline-none font-bold text-amber-700" />
                                                      </td>
                                                      <td className="p-4 pr-6 align-top text-right">
                                                        <div className="flex justify-end gap-1 pt-1">
                                                          <button onClick={() => handleSaveBatch(batch.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                                                            <CheckCircle2 size={16} />
                                                          </button>
                                                          <button onClick={cancelEditingBatch} className="p-1.5 bg-stone-200 text-stone-700 rounded hover:bg-stone-300">
                                                            <X size={16} />
                                                          </button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                }

                                                return (
                                                  <tr key={batch.id} className="hover:bg-stone-50 transition-colors">
                                                    <td className="p-4 pl-6">
                                                      <p className="font-bold text-stone-800 text-sm">{formatDate(batch.createdAt)}</p>
                                                      <p className="text-xs text-stone-500">{batch.store?.name || "Sin tienda registrada"}</p>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                      <span className={`text-sm font-black mr-1 ${Number(batch.remainingQuantity) <= 0 ? 'text-red-500' : 'text-stone-700'}`}>
                                                        {Number(batch.remainingQuantity).toFixed(2)}
                                                      </span>
                                                      <span className="text-xs text-stone-400">/ {Number(batch.initialQuantity).toFixed(2)} {supply.unit}</span>
                                                    </td>
                                                    <td className="p-4 text-right text-stone-600 font-medium text-sm">
                                                      {formatCurrency(Number(batch.costPerUnit))}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                      <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                                                        {formatCurrency(originalTotal)}
                                                      </span>
                                                    </td>
                                                    <td className="p-4 pr-6 text-right">
                                                      <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => startEditingBatch(batch)} className="p-1.5 text-stone-400 hover:text-amber-600 rounded transition-colors">
                                                          <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteBatch(batch.id)} className="p-1.5 text-stone-400 hover:text-red-600 rounded transition-colors">
                                                          <Trash2 size={16} />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
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

        {/* TAB 2: STORES */}
        {activeTab === "stores" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="bg-white p-6 rounded-2xl border border-stone-200/80 shadow-sm sticky top-24">
                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                  <StoreIcon className="text-amber-600" size={20} />
                  Nuevo Proveedor
                </h3>
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Nombre *</label>
                    <input 
                      type="text" required
                      value={newStoreName}
                      onChange={e => setNewStoreName(e.target.value)}
                      placeholder="Ej. Distribuidora XYZ"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Teléfono</label>
                    <input 
                      type="text"
                      value={newStorePhone}
                      onChange={e => setNewStorePhone(e.target.value)}
                      placeholder="Ej. +58 414 1234567"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Dirección</label>
                    <input 
                      type="text"
                      value={newStoreAddress}
                      onChange={e => setNewStoreAddress(e.target.value)}
                      placeholder="Ej. Calle 123, Local 4"
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Instagram URL</label>
                    <input 
                      type="url"
                      value={newStoreIg}
                      onChange={e => setNewStoreIg(e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Google Maps URL</label>
                    <input 
                      type="url"
                      value={newStoreMaps}
                      onChange={e => setNewStoreMaps(e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <button 
                    type="submit" disabled={isSubmitting}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-lg shadow-stone-900/20 disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? "Guardando..." : "Crear Proveedor"}
                  </button>
                </form>
              </div>
            </div>
            
            <div className="md:col-span-2 space-y-4">
              {stores.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-200/60 p-12 text-center text-stone-500">
                  <StoreIcon size={48} className="mx-auto mb-4 text-stone-300" />
                  <p className="text-sm">Aún no tienes proveedores registrados.</p>
                </div>
              ) : (
                stores.map(store => (
                  <div key={store.id} className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-start justify-between group hover:border-amber-200 transition-colors">
                    <div className="space-y-2 flex-1">
                      <h4 className="font-bold text-stone-800 text-lg">{store.name}</h4>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        {store.phone && (
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="font-semibold text-[10px] uppercase tracking-widest text-stone-400">Telf:</span>
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {store.address && (
                          <div className="flex items-center gap-1.5 text-stone-600">
                            <span className="font-semibold text-[10px] uppercase tracking-widest text-stone-400">Dir:</span>
                            <span>{store.address}</span>
                          </div>
                        )}
                        {(store.instagramUrl || store.mapsUrl) && (
                          <div className="flex items-center gap-3">
                            {store.instagramUrl && (
                              <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700 font-medium text-xs underline underline-offset-2">Instagram</a>
                            )}
                            {store.mapsUrl && (
                              <a href={store.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium text-xs underline underline-offset-2">Ver en Maps</a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteStore(store.id)} className="p-2 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-4 shrink-0">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* INVOICE REGISTRATION PANEL */}
      {invoicePanelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={() => setInvoicePanelOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-stone-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                <ShoppingCart className="text-amber-600" size={24} />
                Registrar Factura
              </h2>
              <button onClick={() => setInvoicePanelOpen(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-2">Datos del Comprobante</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Proveedor / Tienda</label>
                    <select 
                      value={invoiceStoreId} 
                      onChange={e => setInvoiceStoreId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">Seleccionar tienda...</option>
                      {stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Fecha de Compra</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                      <input 
                        type="date"
                        value={invoiceDate}
                        onChange={e => setInvoiceDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">Detalle de Insumos</h3>
                  <button onClick={addInvoiceRow} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus size={14} /> Añadir Fila
                  </button>
                </div>
                
                <div className="space-y-3">
                  {invoiceRows.map((row, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Insumo</label>
                          <select 
                            value={row.supplyId} 
                            onChange={e => updateInvoiceRow(idx, "supplyId", e.target.value)}
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:border-amber-500"
                          >
                            <option value="">Seleccionar...</option>
                            {Object.keys(groupedSupplies).map(cat => (
                              <optgroup key={cat} label={cat}>
                                {groupedSupplies[cat].map(s => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Cant. Comprada</label>
                          <input 
                            type="number" min="0" step="any"
                            value={row.quantity} 
                            onChange={e => updateInvoiceRow(idx, "quantity", e.target.value)}
                            placeholder="Ej. 1000"
                            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Costo Total ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                            <input 
                              type="number" min="0" step="any"
                              value={row.totalCost} 
                              onChange={e => updateInvoiceRow(idx, "totalCost", e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm font-medium focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeInvoiceRow(idx)} disabled={invoiceRows.length === 1} className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-5 disabled:opacity-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="p-6 bg-white border-t border-stone-200">
              <button 
                onClick={handleInvoiceSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-lg shadow-stone-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Procesando..." : "Guardar Factura"}
              </button>
            </div>

          </div>
        </div>
      )}



      {/* EDIT SUPPLY PANEL */}
      {editSupplyPanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={() => setEditSupplyPanel(null)}></div>
          <div className="relative w-full max-w-md bg-stone-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-800">Editar Insumo</h2>
              <button onClick={() => setEditSupplyPanel(null)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSupply} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Nombre del Insumo</label>
                <input 
                  type="text" required
                  value={editSupplyNameLocal} 
                  onChange={e => setEditSupplyNameLocal(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Unidad Base</label>
                <input 
                  type="text" disabled
                  value={editSupplyPanel.unit} 
                  className="w-full px-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-medium cursor-not-allowed"
                />
                <p className="text-[10px] text-stone-400 mt-1">La unidad base no se puede cambiar por integridad de inventario.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Categoría</label>
                <select 
                  value={isNewCatCustom ? "custom" : editSupplyCat} 
                  onChange={e => {
                    if (e.target.value === "custom") {
                      setIsNewCatCustom(true);
                      setEditSupplyCat("");
                    } else {
                      setIsNewCatCustom(false);
                      setEditSupplyCat(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="custom">+ Agregar Nueva Categoría</option>
                </select>
                {isNewCatCustom && (
                  <input 
                    type="text" required
                    value={editSupplyCat} 
                    onChange={e => setEditSupplyCat(e.target.value)}
                    placeholder="Escribe la nueva categoría..."
                    className="w-full mt-2 px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                )}
              </div>
            </form>
            
            <div className="p-6 bg-white border-t border-stone-200">
              <button 
                onClick={handleSaveSupply}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SUPPLY PANEL */}
      {newSupplyPanel && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm" onClick={() => setNewSupplyPanel(false)}></div>
          <div className="relative w-full max-w-md bg-stone-50 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-800">Nuevo Insumo</h2>
              <button onClick={() => setNewSupplyPanel(false)} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSupply} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Nombre del Insumo</label>
                <input 
                  type="text" required
                  value={newSupplyName} 
                  onChange={e => setNewSupplyName(e.target.value)}
                  placeholder="Ej. Harina de Trigo"
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Categoría</label>
                <select 
                  value={isNewCatCustom ? "custom" : newSupplyCat} 
                  onChange={e => {
                    if (e.target.value === "custom") {
                      setIsNewCatCustom(true);
                      setNewSupplyCat("");
                    } else {
                      setIsNewCatCustom(false);
                      setNewSupplyCat(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="custom">+ Agregar Nueva Categoría</option>
                </select>
                {isNewCatCustom && (
                  <input 
                    type="text" required
                    value={newSupplyCat} 
                    onChange={e => setNewSupplyCat(e.target.value)}
                    placeholder="Escribe la nueva categoría..."
                    className="w-full mt-2 px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1 uppercase tracking-wider">Unidad Base</label>
                <select 
                  value={newSupplyUnit} 
                  onChange={e => setNewSupplyUnit(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-stone-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="g">Gramos (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="unidades">Unidades</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">Elige la unidad más pequeña en la que se usarán tus recetas.</p>
              </div>

              <div className="pt-4 border-t border-stone-100">
                <h4 className="font-semibold text-stone-800 mb-1">Inventario Inicial <span className="text-xs font-normal text-stone-400">(Opcional)</span></h4>
                <p className="text-xs text-stone-500 leading-relaxed mb-4">Puedes registrar el primer lote ahora o dejarlo vacío.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1">Proveedor / Tienda</label>
                    <select 
                      value={newSupplyStoreId} 
                      onChange={e => setNewSupplyStoreId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    >
                      <option value="">Sin tienda...</option>
                      {stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 mb-1">Cant. Inicial</label>
                      <input 
                        type="number" min="0" step="any"
                        value={newSupplyInitQty} 
                        onChange={e => setNewSupplyInitQty(e.target.value)}
                        placeholder="Ej. 1000"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-500 mb-1">Costo Total ($)</label>
                      <input 
                        type="number" min="0" step="any"
                        value={newSupplyTotalPaid} 
                        onChange={e => setNewSupplyTotalPaid(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
            
            <div className="p-6 bg-white border-t border-stone-200">
              <button 
                onClick={handleCreateSupply}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl shadow-lg shadow-stone-900/20 disabled:opacity-50"
              >
                {isSubmitting ? "Creando..." : "Crear Insumo"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
