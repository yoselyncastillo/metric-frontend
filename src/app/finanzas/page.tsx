"use client";

import React, { useEffect, useState } from "react";
import { finanzasService, CashClosure, ClosurePreview } from "@/services/finanzas";
import { 
  Calendar, DollarSign, Wallet, TrendingUp, TrendingDown, 
  CheckCircle2, AlertCircle, RefreshCw, HandHeart, Lock, Check,
  PiggyBank
} from "lucide-react";

export default function FinanzasPage() {
  const [closures, setClosures] = useState<CashClosure[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Preview State
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [preview, setPreview] = useState<ClosurePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Offering State
  const [offeringPercentage, setOfferingPercentage] = useState<number>(10);
  const [isExecuting, setIsExecuting] = useState(false);

  // Global feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await finanzasService.getClosures();
      setClosures(data);
    } catch (error: any) {
      showError(error.message || "Error al cargar el historial de cierres");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
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

  const formatDateShort = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      showError("Debes seleccionar una fecha de inicio y fin.");
      return;
    }
    try {
      setLoadingPreview(true);
      const data = await finanzasService.getPreview(startDate, endDate);
      setPreview(data);
      setOfferingPercentage(10); // Reset to default
    } catch (error: any) {
      showError(error.message || "Error al generar previsualización");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteClosure = async () => {
    if (!preview || preview.netProfit <= 0) return;
    try {
      setIsExecuting(true);
      await finanzasService.createClosure({
        startDate,
        endDate,
        offeringPercentage
      });
      showSuccess("Cierre de caja ejecutado y sellado exitosamente.");
      setPreview(null);
      fetchHistory();
    } catch (error: any) {
      showError(error.message || "Error al ejecutar el cierre");
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleTithe = async (id: number, currentStatus: boolean) => {
    try {
      await finanzasService.updateTitheStatus(id, !currentStatus);
      setClosures(closures.map(c => c.id === id ? { ...c, isTithed: !currentStatus } : c));
      showSuccess(!currentStatus ? "Diezmo marcado como entregado" : "Diezmo marcado como pendiente");
    } catch (error: any) {
      showError(error.message || "Error al actualizar diezmo");
    }
  };

  const toggleOffering = async (id: number, currentStatus: boolean) => {
    try {
      await finanzasService.updateOfferingStatus(id, !currentStatus);
      setClosures(closures.map(c => c.id === id ? { ...c, isOffered: !currentStatus } : c));
      showSuccess(!currentStatus ? "Ofrenda marcada como entregada" : "Ofrenda marcada como pendiente");
    } catch (error: any) {
      showError(error.message || "Error al actualizar ofrenda");
    }
  };

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
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center gap-3">
              <Wallet className="text-amber-700" size={28} />
              Cierre de Caja & Reportes
            </h1>
            <p className="text-sm text-stone-500 font-medium mt-1 ml-10">Auditoría financiera, cálculo de diezmos y sellado de transacciones.</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-10">
        
        {/* SECCIÓN A: FILTRO Y PREVISUALIZACIÓN */}
        <section className="bg-white rounded-3xl border border-stone-200/70 shadow-sm p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Controles de Fecha */}
            <div className="w-full lg:w-1/3 space-y-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-stone-800 flex items-center gap-2">
                <Calendar size={16} className="text-amber-600"/> 
                Periodo a Auditar
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Desde</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase mb-1">Hasta</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={handlePreview}
                disabled={loadingPreview}
                className="w-full flex items-center justify-center gap-2 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-bold rounded-xl transition-all"
              >
                {loadingPreview ? <RefreshCw className="animate-spin" size={18} /> : 'Previsualizar Flujo de Caja'}
              </button>
              <p className="text-[10px] text-stone-400 font-medium text-center leading-tight">
                El flujo calculado mostrará únicamente las transacciones ejecutadas 
                dentro de este rango estricto de fechas.
              </p>
            </div>

            {/* Tarjetas de Previsualización */}
            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-stone-50/50 rounded-2xl border border-stone-200 p-5 flex flex-col justify-between h-full">
                <div className="flex items-center gap-2 text-stone-500 mb-4">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><TrendingUp size={16}/></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Ingreso Líquido Real</h3>
                </div>
                <div>
                  <p className="text-3xl font-black text-stone-800 tracking-tight">{preview ? formatCurrency(preview.liquidIncome) : '---'}</p>
                </div>
              </div>

              <div className="bg-stone-50/50 rounded-2xl border border-stone-200 p-5 flex flex-col justify-between h-full">
                <div className="flex items-center gap-2 text-stone-500 mb-4">
                  <div className="p-2 bg-red-100 text-red-700 rounded-lg"><TrendingDown size={16}/></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Gastos e Insumos</h3>
                </div>
                <div>
                  <p className="text-3xl font-black text-stone-800 tracking-tight">{preview ? formatCurrency(preview.realExpenses) : '---'}</p>
                </div>
              </div>

              <div className={`rounded-2xl border p-5 flex flex-col justify-between h-full transition-colors ${preview && preview.netProfit > 0 ? 'bg-amber-50/50 border-amber-200 shadow-inner' : 'bg-stone-50/50 border-stone-200'}`}>
                <div className="flex items-center gap-2 text-stone-500 mb-4">
                  <div className={`p-2 rounded-lg ${preview && preview.netProfit > 0 ? 'bg-amber-100 text-amber-700' : 'bg-stone-200 text-stone-600'}`}><DollarSign size={16}/></div>
                  <h3 className="text-xs font-bold uppercase tracking-wider">Ganancia Neta Real</h3>
                </div>
                <div>
                  <p className={`text-3xl font-black tracking-tight ${preview && preview.netProfit > 0 ? 'text-amber-700' : 'text-stone-800'}`}>
                    {preview ? formatCurrency(preview.netProfit) : '---'}
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* SECCIÓN B: CÁLCULO DE APORTES EN VIVO Y EJECUCIÓN */}
        {preview && preview.netProfit > 0 && (
          <section className="bg-amber-900 rounded-3xl p-8 lg:p-10 shadow-xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <HandHeart size={200} />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row gap-10 items-center justify-between">
              
              <div className="w-full lg:w-1/2 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white mb-2">Cálculo de Aportes</h2>
                  <p className="text-amber-200/80 text-sm font-medium">Dios bendice el fruto de tu trabajo. Los cálculos se basan en la ganancia neta.</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-amber-300 uppercase mb-2">Diezmo (10%)</label>
                    <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-4 backdrop-blur-md">
                      <p className="text-2xl font-black text-white">{formatCurrency(preview.netProfit * 0.10)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-300 uppercase mb-2">Ofrenda ({offeringPercentage}%)</label>
                    <div className="bg-white/10 border border-white/20 rounded-xl px-5 py-4 backdrop-blur-md flex flex-col">
                      <p className="text-2xl font-black text-white">{formatCurrency(preview.netProfit * (offeringPercentage / 100))}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="flex items-center justify-between text-xs font-bold text-amber-300 uppercase mb-3">
                    Ajustar Porcentaje de Ofrenda
                    <span className="bg-white/20 px-2 py-1 rounded text-white">{offeringPercentage}%</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" max="50" step="1"
                    value={offeringPercentage}
                    onChange={(e) => setOfferingPercentage(Number(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="w-full lg:w-1/3 flex flex-col justify-center">
                <button 
                  onClick={handleExecuteClosure}
                  disabled={isExecuting}
                  className="w-full py-5 bg-white text-amber-900 hover:bg-amber-50 font-black rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all flex flex-col items-center justify-center gap-1 group"
                >
                  {isExecuting ? (
                    <RefreshCw className="animate-spin text-amber-600 mb-1" size={28} />
                  ) : (
                    <Lock className="text-amber-600 group-hover:scale-110 transition-transform mb-1" size={28} />
                  )}
                  <span className="text-lg">Ejecutar Cierre de Caja</span>
                  <span className="text-xs text-amber-900/60 font-semibold uppercase tracking-widest mt-1">Y Sellar Transacciones</span>
                </button>
              </div>
              
            </div>
          </section>
        )}

        {/* SECCIÓN C: HISTORIAL DE CIERRES REALIZADOS */}
        <section className="space-y-5">
          <h2 className="text-xl font-black text-stone-800 flex items-center gap-2">
            <PiggyBank size={24} className="text-stone-400" />
            Historial de Cierres
          </h2>
          
          <div className="bg-white rounded-3xl border border-stone-200/70 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50 border-b border-stone-200/70">
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">ID Lote Cierre</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Fecha de Cierre</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Periodo Auditado</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Ganancia Neta</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Diezmo</th>
                    <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Ofrenda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                         <div className="w-6 h-6 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                         <p className="text-sm font-medium">Cargando historial...</p>
                      </td>
                    </tr>
                  ) : closures.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-sm">No hay cierres de caja registrados.</p>
                      </td>
                    </tr>
                  ) : (
                    closures.map((c) => (
                      <tr key={c.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-4 px-6 align-middle">
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded font-black text-xs border border-amber-200">
                            #{c.id}
                          </span>
                        </td>
                        <td className="py-4 px-6 align-middle">
                          <p className="text-xs text-stone-600 font-bold">{formatDateShort(c.createdAt)}</p>
                        </td>
                        <td className="py-4 px-6 align-middle">
                          <div className="inline-flex items-center gap-2 bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200/80">
                            <span className="text-xs font-bold text-stone-600">{formatDateShort(c.startDate)}</span>
                            <span className="text-stone-300">-</span>
                            <span className="text-xs font-bold text-stone-600">{formatDateShort(c.endDate)}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 align-middle text-right">
                          <span className="font-black text-stone-700">{formatCurrency(c.netProfit)}</span>
                        </td>
                        <td className="py-4 px-6 align-middle text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-amber-700 text-sm">{formatCurrency(c.titheAmount)}</span>
                            <button 
                              onClick={() => toggleTithe(c.id, c.isTithed)}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                c.isTithed 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                                  : 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {c.isTithed ? <><Check size={10} strokeWidth={3}/> Entregado</> : 'Pendiente'}
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6 align-middle text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className="font-bold text-amber-700 text-sm">{formatCurrency(c.offeringAmount)}</span>
                            <button 
                              onClick={() => toggleOffering(c.id, c.isOffered)}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
                                c.isOffered 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200' 
                                  : 'bg-stone-100 text-stone-400 border border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {c.isOffered ? <><Check size={10} strokeWidth={3}/> Entregado</> : 'Pendiente'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
