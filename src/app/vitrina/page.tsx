"use client";

import React, { useEffect, useState } from "react";
import { vitrinaService, FinishedProduct, ProductLocationStatus } from "@/services/vitrina";
import { 
  AlertCircle, CheckCircle2, X, Home, Store, ShoppingBag, 
  TrendingDown, Edit2, PackageSearch, Save, Trash2, Clock
} from "lucide-react";

export default function VitrinaPage() {
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Side Panel State
  const [selectedProduct, setSelectedProduct] = useState<FinishedProduct | null>(null);
  const [editStatus, setEditStatus] = useState<ProductLocationStatus>('CASA');
  const [editPrice, setEditPrice] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editAmountPaid, setEditAmountPaid] = useState<string>('');
  const [editAmountPending, setEditAmountPending] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await vitrinaService.getFinishedProducts();
      setProducts(data);
    } catch (error: any) {
      showError(error.message || "Error al cargar la vitrina");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateAge = (product: FinishedProduct) => {
    const now = new Date();
    
    if (product.location === 'CASA') {
      const created = new Date(product.createdAt);
      const diffTime = Math.abs(now.getTime() - created.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 5) {
        return (
          <div className="flex flex-col">
            <span className="text-amber-600 font-bold text-xs">{diffDays} días (Lento)</span>
            <span className="text-[9px] text-amber-500/80 font-semibold uppercase">Rotación recomendada</span>
          </div>
        );
      }
      return <span className="text-stone-500 font-semibold text-xs">{diffDays} días</span>;
      
    } else if (product.location === 'LOCAL') {
      const moved = product.movedToLocalAt ? new Date(product.movedToLocalAt) : new Date();
      const diffTime = Math.abs(now.getTime() - moved.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 7) {
        return (
          <div className="flex flex-col">
            <span className="text-red-600 font-bold text-xs">{diffDays} días en consigna</span>
            <span className="text-[9px] text-red-500 font-black uppercase flex items-center gap-1">
              <AlertCircle size={10} /> Toca revisar/retirar
            </span>
          </div>
        );
      }
      return <span className="text-stone-500 font-semibold text-xs">{diffDays} días en consigna</span>;
      
    } else {
      const soldDate = product.soldAt || product.updatedAt;
      return (
        <div className="flex flex-col">
          <span className="text-stone-400 font-bold text-xs uppercase text-[10px]">Cerrado el</span>
          <span className="text-stone-600 font-bold text-xs">{formatDate(soldDate)}</span>
        </div>
      );
    }
  };

  const openPanel = (product: FinishedProduct) => {
    setSelectedProduct(product);
    setEditStatus(product.location || 'CASA');
    setEditPrice(product.price?.toString() || '0');
    setEditQuantity(product.quantity?.toString() || '0');
    setEditAmountPaid(product.amountPaid?.toString() || '0');
    setEditAmountPending(product.amountPending?.toString() || '0');
  };

  const closePanel = () => {
    setSelectedProduct(null);
  };

  const handleStatusChange = (newStatus: ProductLocationStatus) => {
    setEditStatus(newStatus);
    if (newStatus === 'VENDIDO' && selectedProduct) {
      // Autocomplete total charge using manual price
      const qty = editQuantity ? Number(editQuantity) : Number(selectedProduct.quantity);
      const totalCost = qty * Number(editPrice || 0);
      setEditAmountPaid(totalCost.toFixed(2));
      setEditAmountPending('0');
    }
  };

  const handleSave = async () => {
    if (!selectedProduct) return;
    
    // Validation
    if (editStatus === 'LOCAL') {
      if (editAmountPaid === '' || editAmountPending === '') {
        showError("Para enviar a LOCAL debes registrar Monto Abonado y Monto Pendiente.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await vitrinaService.updateProduct(selectedProduct.id, {
        location: editStatus,
        price: Number(editPrice),
        quantity: Number(editQuantity),
        amountPaid: Number(editAmountPaid),
        amountPending: Number(editAmountPending)
      });
      showSuccess("Producto actualizado con éxito");
      closePanel();
      fetchData();
    } catch (error: any) {
      showError(error.message || "Error al actualizar producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    if (!confirm("¿Estás seguro de eliminar este lote de la vitrina? El inventario de ingredientes NO se devolverá automáticamente.")) return;
    
    setIsSubmitting(true);
    try {
      await vitrinaService.deleteProduct(selectedProduct.id);
      showSuccess("Lote eliminado con éxito");
      closePanel();
      fetchData();
    } catch (error: any) {
      showError(error.message || "Error al eliminar lote");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (location: string) => {
    switch (location) {
      case 'CASA':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-stone-100 text-stone-600 rounded-full border border-stone-200"><Home size={12}/> Casa</span>;
      case 'LOCAL':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200"><Store size={12}/> Local</span>;
      case 'VENDIDO':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200"><ShoppingBag size={12}/> Vendido</span>;
      case 'MERMA':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-red-100 text-red-800 rounded-full border border-red-200"><TrendingDown size={12}/> Merma</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold bg-stone-100 text-stone-600 rounded-full">{location}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20 relative font-sans">
      {/* TOASTS */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 fade-in pointer-events-auto">
            <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
            <span className="font-bold text-sm tracking-tight">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 fade-in pointer-events-auto">
            <AlertCircle size={20} className="shrink-0 text-red-600" />
            <span className="font-bold text-sm tracking-tight">{errorMsg}</span>
          </div>
        )}
      </div>

      {/* HEADER */}
      <header className="bg-white border-b border-stone-200/60 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
            <Store className="text-amber-700" size={28} />
            Vitrina & Consignación
          </h1>
          <p className="text-sm text-stone-500 font-medium mt-1 ml-10">Control de productos terminados, puntos de venta y mermas.</p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-200/70">
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Producto Terminado</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Cant. Restante</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Precio Ref.</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Ubicación / Estado</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Antigüedad</th>
                  <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400">
                      <PackageSearch size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="font-medium text-sm">No hay productos terminados en vitrina.</p>
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr 
                      key={p.id} 
                      onClick={() => openPanel(p)}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 align-middle">
                        <p className="font-bold text-stone-800 text-sm group-hover:text-amber-800 transition-colors">
                          {p.recipe?.name || p.productionBatch?.recipe?.name || 'Producto'}
                        </p>
                        <p className="text-xs text-stone-400 font-medium mt-0.5">ID #{p.id || '-'}</p>
                      </td>
                      <td className="py-4 px-6 align-middle text-right">
                        <span className="text-base font-black text-stone-700">{p.quantity}</span>
                        <span className="text-xs text-stone-400 font-bold ml-1">uds</span>
                      </td>
                      <td className="py-4 px-6 align-middle text-right">
                        <span className="font-semibold text-stone-600 text-sm">{formatCurrency(Number(p.price || 0))}</span>
                      </td>
                      <td className="py-4 px-6 align-middle">
                        {getStatusBadge(p.location || 'CASA')}
                      </td>
                      <td className="py-4 px-6 align-middle">
                        <div className="flex items-center gap-2">
                          {p.location !== 'VENDIDO' && p.location !== 'MERMA' && <Clock size={14} className="text-stone-300" />}
                          {calculateAge(p)}
                        </div>
                      </td>
                      <td className="py-4 px-6 align-middle text-right">
                        <button className="p-2 text-stone-400 group-hover:text-amber-600 group-hover:bg-amber-100/50 rounded-xl transition-all">
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* OVERLAY PANEL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-sm transition-opacity" onClick={closePanel} />
          <div className="relative w-full max-w-md bg-[#FDFBF7] shadow-2xl h-full flex flex-col border-l border-stone-200/60 animate-in slide-in-from-right">
            
            {/* PANEL HEADER */}
            <div className="px-6 py-5 border-b border-stone-200/60 bg-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-stone-800 tracking-tight">Editar Producto</h3>
                <p className="text-xs text-stone-500 font-medium">Lote #{selectedProduct.productionBatch?.id} • Creado: {formatDate(selectedProduct.createdAt)}</p>
              </div>
              <button onClick={closePanel} className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* PANEL BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Resumen Lote */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Datos del Lote</h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-stone-600">Receta:</span>
                  <span className="text-sm font-bold text-stone-900">{selectedProduct.recipe?.name || selectedProduct.productionBatch?.recipe?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-stone-600">Producido:</span>
                  <span className="text-sm font-bold text-stone-900">{selectedProduct.productionBatch?.quantityProduced || selectedProduct.quantity} uds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-stone-600">Restante actual:</span>
                  <span className="text-sm font-bold text-amber-700">{selectedProduct.quantity} uds</span>
                </div>
              </div>

              {/* Controles */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Cantidad a Mover</label>
                    <input 
                      type="number" step="any" min="0" max={selectedProduct.quantity}
                      value={editQuantity}
                      onChange={(e) => {
                        setEditQuantity(e.target.value);
                        if (editStatus === 'VENDIDO') {
                          const totalCost = Number(e.target.value) * Number(editPrice || 0);
                          setEditAmountPaid(totalCost.toFixed(2));
                          setEditAmountPending('0');
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1.5">Precio de Venta ($)</label>
                    <input 
                      type="number" step="any"
                      value={editPrice}
                      onChange={(e) => {
                        setEditPrice(e.target.value);
                        if (editStatus === 'VENDIDO') {
                          const qty = editQuantity ? Number(editQuantity) : Number(selectedProduct.quantity);
                          const totalCost = qty * Number(e.target.value || 0);
                          setEditAmountPaid(totalCost.toFixed(2));
                          setEditAmountPending('0');
                        }
                      }}
                      className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-3">Ubicación / Estado</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['CASA', 'LOCAL', 'VENDIDO', 'MERMA'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status as ProductLocationStatus)}
                        className={`py-3 px-4 rounded-xl font-bold text-xs transition-all border ${
                          editStatus === status 
                            ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20' 
                            : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dinámicos basados en estado */}
                <div className={`transition-all duration-300 overflow-hidden ${editStatus === 'LOCAL' || editStatus === 'VENDIDO' ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'}`}>
                  <div className="bg-white p-5 rounded-2xl border border-stone-200/60 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Control Financiero</h4>
                    
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1.5">Monto Abonado ($)</label>
                      <input 
                        type="number" step="any"
                        value={editAmountPaid}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditAmountPaid(val);
                          const qty = editQuantity ? Number(editQuantity) : Number(selectedProduct.quantity);
                          const totalCost = qty * Number(editPrice || 0);
                          const pending = totalCost - Number(val || 0);
                          setEditAmountPending(pending > 0 ? pending.toFixed(2) : '0');
                        }}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1.5">Monto Pendiente ($)</label>
                      <input 
                        type="number" step="any"
                        value={editAmountPending}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditAmountPending(val);
                          const qty = editQuantity ? Number(editQuantity) : Number(selectedProduct.quantity);
                          const totalCost = qty * Number(editPrice || 0);
                          const paid = totalCost - Number(val || 0);
                          setEditAmountPaid(paid > 0 ? paid.toFixed(2) : '0');
                        }}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    {editStatus === 'VENDIDO' && (
                      <p className="text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-lg text-center mt-2">
                        Se ha autocompletado el cobro total según el precio de referencia.
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* PANEL FOOTER */}
            <div className="p-6 border-t border-stone-200/60 bg-white space-y-3">
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-stone-900 hover:bg-stone-800 text-white font-black rounded-xl shadow-lg shadow-stone-900/20 disabled:opacity-70 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Guardar Cambios
                  </>
                )}
              </button>
              <button 
                onClick={handleDelete}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-all"
              >
                <Trash2 size={18} />
                Eliminar Lote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
