"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardService, FinishedProduct, ExtraExpense } from "@/services/dashboard";
import { Package, TrendingDown, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [expenses, setExpenses] = useState<ExtraExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("metric_token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [productsData, expensesData] = await Promise.all([
          dashboardService.getFinishedProducts().catch(() => []),
          dashboardService.getAccountingExpenses().catch(() => [])
        ]);
        setProducts(productsData);
        setExpenses(expensesData);
      } catch (err: unknown) {
        setError("Error al cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Cálculos de KPIs
  const totalProducts = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  
  const totalReplacementValue = products.reduce(
    (acc, p) => acc + (Number(p.replacementCost) || 0), 
    0
  );
  
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center p-8 bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full min-h-screen flex flex-col bg-stone-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Dashboard</h1>
        <p className="text-stone-500">Resumen general de La Vitrina y finanzas.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/60 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 bg-stone-100 text-stone-600 rounded-xl flex items-center justify-center shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Total en Vitrina</p>
            <p className="text-2xl font-bold text-stone-800">{totalProducts.toLocaleString()} unid.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/60 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Valor a Reposición</p>
            <p className="text-2xl font-bold text-stone-800">{formatCurrency(totalReplacementValue)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200/60 flex items-center gap-4 transition-shadow hover:shadow-md">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-500 mb-1">Gastos Operativos</p>
            <p className="text-2xl font-bold text-stone-800">{formatCurrency(totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Tabla La Vitrina Real */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex-1 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-stone-100 bg-white">
          <h2 className="text-lg font-semibold text-stone-800">La Vitrina Real</h2>
          <p className="text-sm text-stone-500 mt-1">Inventario de productos terminados listos para la venta.</p>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-stone-50/50 text-stone-500 text-xs uppercase tracking-wider border-b border-stone-100">
                <th className="p-4 pl-6 font-medium">Producto / Receta</th>
                <th className="p-4 font-medium text-right">Unidades</th>
                <th className="p-4 font-medium text-right">Costo FIFO Total</th>
                <th className="p-4 font-medium text-right">Costo Rep. Total</th>
                <th className="p-4 pr-6 font-medium text-right">Costo Promedio Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-stone-500">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-stone-300 mb-4" />
                      <p>No hay productos en la vitrina.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => {
                  const productName = product.recipe?.name || product.name || 'Producto Sin Nombre';
                  
                  const qty = Number(product.quantity) || 0;
                  const totalFifo = Number(product.fifoCost) || 0;
                  const totalRep = Number(product.replacementCost) || 0;
                  const totalAvg = Number(product.averageCost) || 0;
                  
                  const unitFifo = qty > 0 ? totalFifo / qty : 0;
                  const unitRep = qty > 0 ? totalRep / qty : 0;
                  const unitAvg = qty > 0 ? totalAvg / qty : 0;

                  return (
                    <tr key={product.id || idx} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-4 pl-6 font-medium text-stone-800">{productName}</td>
                      <td className="p-4 text-right text-stone-600 font-medium">{qty}</td>
                      <td className="p-4 text-right text-stone-600">
                        <div className="text-sm font-medium text-stone-900">{formatCurrency(totalFifo)}</div>
                        <div className="text-xs text-stone-500">{formatCurrency(unitFifo)} c/u</div>
                      </td>
                      <td className="p-4 text-right text-stone-600">
                        <div className="text-sm font-medium text-stone-900">{formatCurrency(totalRep)}</div>
                        <div className="text-xs text-stone-500">{formatCurrency(unitRep)} c/u</div>
                      </td>
                      <td className="p-4 pr-6 text-right text-stone-600">
                        <div className="text-sm font-medium text-stone-900">{formatCurrency(totalAvg)}</div>
                        <div className="text-xs text-stone-500">{formatCurrency(unitAvg)} c/u</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
