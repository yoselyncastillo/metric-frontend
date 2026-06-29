"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inventoryService, Store, Supply, UnitConversion, SupplyFormat } from "@/services/inventory";
import { 
  Package, 
  Store as StoreIcon, 
  Plus, 
  Receipt,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Camera,
  Map,
  Edit2,
  Trash2,
  Save
} from "lucide-react";
import React from "react";

export default function InventoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"supplies" | "stores">("supplies");
  
  const [stores, setStores] = useState<Store[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);

  // Accordion state
  const [expandedSupplyId, setExpandedSupplyId] = useState<string | number | null>(null);

  // Side Panel State
  const [sidePanelMode, setSidePanelMode] = useState<"NEW" | Supply | null>(null);
  const [panelTab, setPanelTab] = useState<"DETAILS" | "CONVERSIONS" | "FORMATS">("DETAILS");

  // New Supply State
  const [supplyName, setSupplyName] = useState("");
  const [supplyUnit, setSupplyUnit] = useState("g");
  const [supplyInitQty, setSupplyInitQty] = useState("");
  const [supplyTotalPaid, setSupplyTotalPaid] = useState("");

  // Edit Supply State
  const [editSupplyName, setEditSupplyName] = useState("");
  
  // Conversions State
  const [convName, setConvName] = useState("");
  const [convFactor, setConvFactor] = useState("");

  // Formats State
  const [formatName, setFormatName] = useState("");
  const [formatQty, setFormatQty] = useState("");

  // Modals state
  const [selectedSupplyForBatch, setSelectedSupplyForBatch] = useState<Supply | null>(null);

  // Store Form states
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeInsta, setStoreInsta] = useState("");
  const [storeMaps, setStoreMaps] = useState("");
  
  // Batch Form states
  const [batchQuantity, setBatchQuantity] = useState("");
  const [batchUnitCost, setBatchUnitCost] = useState("");
  const [batchStoreId, setBatchStoreId] = useState("");
  const [batchExpiration, setBatchExpiration] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [storesData, suppliesData] = await Promise.all([
        inventoryService.getStores().catch(() => []),
        inventoryService.getSupplies().catch(() => [])
      ]);
      setStores(storesData);
      setSupplies(suppliesData);
      
      // Update selected supply in edit mode if needed
      if (sidePanelMode && sidePanelMode !== "NEW") {
        const updated = suppliesData.find(s => s.id === (sidePanelMode as Supply).id);
        if (updated) setSidePanelMode(updated);
      }
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

  // --- STORE ACTIONS ---
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await inventoryService.createStore({
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        instagramUrl: storeInsta,
        mapsUrl: storeMaps
      });
      setStoreName("");
      setStoreAddress("");
      setStorePhone("");
      setStoreInsta("");
      setStoreMaps("");
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al crear la tienda");
    } finally {
      setSaving(false);
    }
  };

  // --- BATCH ACTIONS ---
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplyForBatch || !batchStoreId) {
      setError("Por favor selecciona una tienda válida.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await inventoryService.createBatch({
        supplyId: selectedSupplyForBatch.id,
        storeId: batchStoreId,
        quantity: Number(batchQuantity),
        unitCost: Number(batchUnitCost),
        expirationDate: batchExpiration || null
      });
      setBatchQuantity("");
      setBatchUnitCost("");
      setBatchStoreId("");
      setBatchExpiration("");
      setSelectedSupplyForBatch(null);
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al registrar el lote");
    } finally {
      setSaving(false);
    }
  };

  // --- PANEL ACTIONS ---
  const openNewSupplyPanel = () => {
    setSupplyName("");
    setSupplyUnit("g");
    setSupplyInitQty("");
    setSupplyTotalPaid("");
    setSidePanelMode("NEW");
  };

  const openEditSupplyPanel = (supply: Supply) => {
    setEditSupplyName(supply.name);
    setPanelTab("DETAILS");
    setSidePanelMode(supply);
  };

  const closePanel = () => {
    setSidePanelMode(null);
    setError(null);
  };

  const handleCreateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await inventoryService.createSupply({
        name: supplyName,
        unit: supplyUnit,
        initialQuantity: supplyInitQty ? Number(supplyInitQty) : undefined,
        totalPaid: supplyTotalPaid ? Number(supplyTotalPaid) : undefined
      });
      closePanel();
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al crear el insumo");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSupplyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sidePanelMode === "NEW" || !sidePanelMode) return;
    setSaving(true);
    setError(null);
    try {
      await inventoryService.updateSupply(sidePanelMode.id, { name: editSupplyName });
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al actualizar el insumo");
    } finally {
      setSaving(false);
    }
  };

  const handleAddConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sidePanelMode === "NEW" || !sidePanelMode) return;
    setSaving(true);
    setError(null);
    try {
      await inventoryService.addConversion(sidePanelMode.id, {
        name: convName,
        factor: Number(convFactor)
      });
      setConvName("");
      setConvFactor("");
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al agregar conversión");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveConversion = async (id: string | number) => {
    if (!confirm("¿Eliminar esta conversión? Si está siendo usada en recetas, podría fallar.")) return;
    setSaving(true);
    setError(null);
    try {
      await inventoryService.removeConversion(id);
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al eliminar conversión. Verifica que no esté en uso.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFormat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sidePanelMode === "NEW" || !sidePanelMode) return;
    setSaving(true);
    setError(null);
    try {
      await inventoryService.addFormat({
        name: formatName,
        quantity: Number(formatQty),
        supplyId: sidePanelMode.id
      });
      setFormatName("");
      setFormatQty("");
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error al agregar formato");
    } finally {
      setSaving(false);
    }
  };

  const toggleAccordion = (id: string | number) => {
    if (expandedSupplyId === id) setExpandedSupplyId(null);
    else setExpandedSupplyId(id);
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
    <div className="p-8 max-w-7xl mx-auto h-full min-h-screen flex flex-col bg-stone-50 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Inventario & Lotes</h1>
        <p className="text-stone-500">Gestiona tu materia prima, registra facturas y proveedores.</p>
      </div>

      {error && !sidePanelMode && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tabs Nav */}
      <div className="flex space-x-1 bg-stone-200/50 p-1 rounded-xl w-fit mb-8 border border-stone-200">
        <button
          onClick={() => setActiveTab("supplies")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "supplies"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
          }`}
        >
          <Package size={18} />
          Materia Prima e Ingresos
        </button>
        <button
          onClick={() => setActiveTab("stores")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "stores"
              ? "bg-white text-stone-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
          }`}
        >
          <StoreIcon size={18} />
          Proveedores / Tiendas
        </button>
      </div>

      {/* Tab 1: Supplies */}
      {activeTab === "supplies" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex-1 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-stone-100 bg-white flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-stone-800">Catálogo de Insumos</h2>
              <p className="text-sm text-stone-500 mt-1">Registra nuevos ingredientes o ingresa lotes a inventario.</p>
            </div>
            <button
              onClick={openNewSupplyPanel}
              className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-50 rounded-lg hover:bg-stone-900 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Nuevo Insumo
            </button>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-stone-50/50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-100">
                  <th className="p-4 pl-6 font-medium">Insumo</th>
                  <th className="p-4 font-medium text-center">Unidad de Medida</th>
                  <th className="p-4 font-medium text-right">Stock Disponible Total</th>
                  <th className="p-4 pr-6 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {supplies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-stone-500">
                      No hay insumos registrados.
                    </td>
                  </tr>
                ) : (
                  supplies.map((supply) => (
                    <React.Fragment key={supply.id}>
                      <tr className="hover:bg-stone-50/50 transition-colors group">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleAccordion(supply.id)}
                              className="text-stone-400 hover:text-stone-700 transition-colors bg-stone-100 hover:bg-stone-200 p-1 rounded-md"
                              title="Ver Lotes"
                            >
                              {expandedSupplyId === supply.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <span className="font-medium text-stone-800">{supply.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center text-stone-600">
                          <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-medium uppercase">
                            {supply.unit}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="font-semibold text-stone-800 text-lg">
                            {Number(supply.totalAvailable || 0).toLocaleString()}
                          </span>
                          <span className="text-sm text-stone-500 ml-1">{supply.unit}</span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditSupplyPanel(supply)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                            >
                              <Edit2 size={14} />
                              Ajustes
                            </button>
                            <button
                              onClick={() => setSelectedSupplyForBatch(supply)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors"
                            >
                              <Receipt size={14} />
                              Ingresar Lote
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* Lotes Accordion */}
                      {expandedSupplyId === supply.id && (
                        <tr>
                          <td colSpan={4} className="p-0 border-b border-stone-100 bg-stone-50/80">
                            <div className="px-10 py-4 shadow-inner">
                              <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Lotes Activos (FIFO)</h4>
                              {supply.batches && supply.batches.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  {supply.batches.map(batch => (
                                    <div key={batch.id} className="bg-white border border-stone-200 rounded-lg p-3 text-sm flex flex-col gap-2 shadow-sm">
                                      <div className="flex justify-between items-center border-b border-stone-100 pb-2">
                                        <span className="font-medium text-stone-800">Quedan {Number(batch.remainingQuantity).toLocaleString()} {supply.unit}</span>
                                        <span className="text-xs text-stone-400">{new Date(batch.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-stone-600">
                                        <span>Costo Unitario:</span>
                                        <span className="font-medium text-stone-900">{formatCurrency(Number(batch.costPerUnit))}</span>
                                      </div>
                                      {batch.store && (
                                        <div className="flex items-center gap-1.5 text-stone-500 mt-1">
                                          <StoreIcon size={14} />
                                          <span className="truncate">{batch.store.name}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-stone-500 italic">No hay lotes con stock disponible para este insumo.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Stores */}
      {activeTab === "stores" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {stores.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-12 text-center text-stone-500">
                <StoreIcon size={48} className="mx-auto mb-4 text-stone-300" />
                No hay proveedores registrados.
              </div>
            ) : (
              stores.map((store) => {
                const uniqueProducts = Array.from(new Set(
                  (store.batches || []).map(b => b.supply?.name).filter(Boolean)
                ));

                return (
                  <div key={store.id} className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6 hover:border-stone-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                          <StoreIcon size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-stone-800">{store.name}</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mt-4 text-sm text-stone-600">
                        {store.address && (
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-stone-400" />
                            <span>{store.address}</span>
                          </div>
                        )}
                        {store.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-stone-400" />
                            <span>{store.phone}</span>
                          </div>
                        )}
                        {store.instagramUrl && (
                          <div className="flex items-center gap-2">
                            <Camera size={16} className="text-stone-400" />
                            <a href={store.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline truncate">
                              Instagram
                            </a>
                          </div>
                        )}
                        {store.mapsUrl && (
                          <div className="flex items-center gap-2">
                            <Map size={16} className="text-stone-400" />
                            <a href={store.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline truncate">
                              Ver en Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="sm:w-1/3 bg-stone-50 rounded-xl p-4 border border-stone-100">
                      <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Insumos Adquiridos</h4>
                      {uniqueProducts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {uniqueProducts.map((p, i) => (
                            <span key={i} className="px-2 py-1 bg-white border border-stone-200 text-stone-600 rounded text-xs">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400 italic">No hay lotes asociados aún.</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 h-fit sticky top-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-amber-600" />
              Nueva Tienda
            </h3>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej. Distribuidora Táchira"
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Dirección <span className="text-stone-400 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Calle principal #123"
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Teléfono <span className="text-stone-400 font-normal">(opcional)</span></label>
                <input
                  type="text"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">URL Instagram <span className="text-stone-400 font-normal">(opcional)</span></label>
                <input
                  type="url"
                  value={storeInsta}
                  onChange={(e) => setStoreInsta(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">URL Google Maps <span className="text-stone-400 font-normal">(opcional)</span></label>
                <input
                  type="url"
                  value={storeMaps}
                  onChange={(e) => setStoreMaps(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 mt-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-stone-50 bg-stone-800 hover:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? <div className="w-4 h-4 border-2 border-stone-50 border-t-transparent rounded-full animate-spin" /> : null}
                Guardar Proveedor
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Side Panel for Supplies (New/Edit) */}
      {sidePanelMode !== null && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={closePanel}></div>
          <div className="relative w-full max-w-md h-full bg-stone-50 shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="p-6 border-b border-stone-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h3 className="text-xl font-bold text-stone-800">
                  {sidePanelMode === "NEW" ? "Nuevo Insumo" : "Ajustes de Insumo"}
                </h3>
                {sidePanelMode !== "NEW" && (
                  <p className="text-sm text-stone-500">{(sidePanelMode as Supply).name} ({(sidePanelMode as Supply).unit})</p>
                )}
              </div>
              <button onClick={closePanel} className="p-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {error && (
                <div className="m-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
                  <span>{error}</span>
                </div>
              )}

              {sidePanelMode === "NEW" ? (
                // CREATE MODE
                <form onSubmit={handleCreateSupply} className="p-6 space-y-6">
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
                    <h4 className="font-semibold text-stone-800 border-b border-stone-100 pb-2">Datos Básicos</h4>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        value={supplyName}
                        onChange={(e) => setSupplyName(e.target.value)}
                        placeholder="Ej. Harina de Trigo"
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Unidad base (para recetas)</label>
                      <select
                        value={supplyUnit}
                        onChange={(e) => setSupplyUnit(e.target.value)}
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                      >
                        <option value="g">Gramos (g)</option>
                        <option value="kg">Kilogramos (kg)</option>
                        <option value="ml">Mililitros (ml)</option>
                        <option value="l">Litros (l)</option>
                        <option value="un">Unidades (un)</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
                    <h4 className="font-semibold text-stone-800 border-b border-stone-100 pb-2">Inventario Inicial <span className="text-xs font-normal text-stone-400 ml-1">(Opcional)</span></h4>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">Puedes registrar el primer lote de una vez o dejarlo en 0 y registrar facturas más tarde.</p>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Cantidad Inicial ({supplyUnit})</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={supplyInitQty}
                        onChange={(e) => setSupplyInitQty(e.target.value)}
                        placeholder="Ej. 1000"
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">Costo Total Pagado ($)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={supplyTotalPaid}
                        onChange={(e) => setSupplyTotalPaid(e.target.value)}
                        placeholder="Ej. 15.00"
                        className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex justify-center items-center gap-2 px-4 py-3 text-sm font-medium text-stone-50 bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors disabled:opacity-70 shadow-sm"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-stone-50 border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    Crear Insumo
                  </button>
                </form>
              ) : (
                // EDIT MODE
                <div className="flex flex-col h-full">
                  <div className="flex px-6 pt-4 bg-white border-b border-stone-200">
                    <button
                      onClick={() => setPanelTab("DETAILS")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${panelTab === "DETAILS" ? "border-amber-500 text-amber-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
                    >
                      Básico
                    </button>
                    <button
                      onClick={() => setPanelTab("CONVERSIONS")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${panelTab === "CONVERSIONS" ? "border-amber-500 text-amber-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
                    >
                      Conversiones
                    </button>
                    <button
                      onClick={() => setPanelTab("FORMATS")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${panelTab === "FORMATS" ? "border-amber-500 text-amber-600" : "border-transparent text-stone-500 hover:text-stone-700"}`}
                    >
                      Formatos
                    </button>
                  </div>

                  <div className="p-6">
                    {panelTab === "DETAILS" && (
                      <form onSubmit={handleUpdateSupplyName} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
                        <h4 className="font-semibold text-stone-800 border-b border-stone-100 pb-2">Actualizar Nombre</h4>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">Nombre</label>
                          <input
                            type="text"
                            required
                            value={editSupplyName}
                            onChange={(e) => setEditSupplyName(e.target.value)}
                            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={saving || editSupplyName === (sidePanelMode as Supply).name}
                          className="w-full flex justify-center items-center gap-2 px-4 py-2.5 text-sm font-medium text-stone-50 bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {saving ? <div className="w-4 h-4 border-2 border-stone-50 border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                          Guardar Cambios
                        </button>
                      </form>
                    )}

                    {panelTab === "CONVERSIONS" && (
                      <div className="space-y-6">
                        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                          <h4 className="font-semibold text-stone-800 border-b border-stone-100 pb-2 mb-4">Nueva Conversión</h4>
                          <form onSubmit={handleAddConversion} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Unidad/Nombre</label>
                                <input
                                  type="text"
                                  required
                                  value={convName}
                                  onChange={(e) => setConvName(e.target.value)}
                                  placeholder="Ej. Cucharada"
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-amber-500 outline-none text-stone-800 bg-stone-50 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Factor a {(sidePanelMode as Supply).unit}</label>
                                <input
                                  type="number"
                                  required
                                  min="0.001"
                                  step="0.001"
                                  value={convFactor}
                                  onChange={(e) => setConvFactor(e.target.value)}
                                  placeholder="Ej. 15"
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-amber-500 outline-none text-stone-800 bg-stone-50 text-sm"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={saving}
                              className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Plus size={16} /> Agregar
                            </button>
                          </form>
                        </div>

                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 border-b border-stone-100">
                              <tr>
                                <th className="p-3 font-medium text-stone-600">Unidad</th>
                                <th className="p-3 font-medium text-stone-600">Equivale a</th>
                                <th className="p-3"></th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {((sidePanelMode as Supply).unitConversions || []).length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="p-4 text-center text-stone-500 italic">No hay conversiones</td>
                                </tr>
                              ) : (
                                ((sidePanelMode as Supply).unitConversions || []).map(conv => (
                                  <tr key={conv.id} className="hover:bg-stone-50/50">
                                    <td className="p-3 font-medium text-stone-800">{conv.name}</td>
                                    <td className="p-3 text-stone-600">{conv.factor} {(sidePanelMode as Supply).unit}</td>
                                    <td className="p-3 text-right">
                                      <button
                                        onClick={() => handleRemoveConversion(conv.id)}
                                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {panelTab === "FORMATS" && (
                      <div className="space-y-6">
                        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                          <h4 className="font-semibold text-stone-800 border-b border-stone-100 pb-2 mb-4">Nuevo Formato de Compra</h4>
                          <form onSubmit={handleAddFormat} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Nombre del Formato</label>
                                <input
                                  type="text"
                                  required
                                  value={formatName}
                                  onChange={(e) => setFormatName(e.target.value)}
                                  placeholder="Ej. Saco 50Kg"
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-amber-500 outline-none text-stone-800 bg-stone-50 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-stone-500 mb-1 uppercase tracking-wider">Cant Total ({(sidePanelMode as Supply).unit})</label>
                                <input
                                  type="number"
                                  required
                                  min="0.01"
                                  step="0.01"
                                  value={formatQty}
                                  onChange={(e) => setFormatQty(e.target.value)}
                                  placeholder="Ej. 50000"
                                  className="w-full px-3 py-2 border border-stone-200 rounded-md focus:ring-1 focus:ring-amber-500 outline-none text-stone-800 bg-stone-50 text-sm"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              disabled={saving}
                              className="w-full flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Plus size={16} /> Guardar Formato
                            </button>
                          </form>
                        </div>

                        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-stone-50 border-b border-stone-100">
                              <tr>
                                <th className="p-3 font-medium text-stone-600">Formato</th>
                                <th className="p-3 font-medium text-stone-600">Rinde</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {((sidePanelMode as Supply).formats || []).length === 0 ? (
                                <tr>
                                  <td colSpan={2} className="p-4 text-center text-stone-500 italic">No hay formatos de compra guardados</td>
                                </tr>
                              ) : (
                                ((sidePanelMode as Supply).formats || []).map(format => (
                                  <tr key={format.id} className="hover:bg-stone-50/50">
                                    <td className="p-3 font-medium text-stone-800">{format.name}</td>
                                    <td className="p-3 text-stone-600">{format.quantity} {(sidePanelMode as Supply).unit}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Batch */}
      {selectedSupplyForBatch && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-stone-200">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div>
                <h3 className="text-lg font-semibold text-stone-800">Ingresar Nuevo Lote</h3>
                <p className="text-sm text-stone-500">{selectedSupplyForBatch.name}</p>
              </div>
              <button onClick={() => setSelectedSupplyForBatch(null)} className="text-stone-400 hover:text-stone-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateBatch} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Cantidad ({selectedSupplyForBatch.unit})
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(e.target.value)}
                    placeholder="Ej. 1000"
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Costo unitario ($)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={batchUnitCost}
                    onChange={(e) => setBatchUnitCost(e.target.value)}
                    placeholder="Ej. 0.15"
                    className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">Costo por 1 {selectedSupplyForBatch.unit}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Proveedor / Tienda</label>
                <select
                  required
                  value={batchStoreId}
                  onChange={(e) => setBatchStoreId(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                >
                  <option value="" disabled>Selecciona una tienda</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Fecha de vencimiento <span className="text-stone-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="date"
                  value={batchExpiration}
                  onChange={(e) => setBatchExpiration(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors text-stone-800 bg-stone-50"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-stone-100 mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedSupplyForBatch(null)}
                  className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-stone-50 bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors disabled:opacity-70"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-stone-50 border-t-transparent rounded-full animate-spin" /> : null}
                  Registrar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
