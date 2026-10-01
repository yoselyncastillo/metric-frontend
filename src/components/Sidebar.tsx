"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  ChefHat, 
  Package, 
  Users, 
  LogOut,
  Store,
  Wallet
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("metric_token");
    router.push("/login");
  };

  const navItems = [
    { name: "Inicio", href: "/", icon: LayoutDashboard },
    { name: "Recetas & Costos", href: "/recipes", icon: ChefHat },
    { name: "Inventario & Lotes", href: "/inventory", icon: Package },
    { name: "Vitrina & Consignación", href: "/vitrina", icon: Store },
    { name: "Finanzas & Cierres", href: "/finanzas", icon: Wallet },
    { name: "Clientes & Gastos", href: "/accounting", icon: Users },
  ];

  return (
    <aside className="w-64 bg-stone-900 text-stone-50 flex flex-col min-h-screen shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="p-6">
        <h1 className="text-3xl font-bold tracking-tight text-amber-500 mb-1">Metric</h1>
        <p className="text-stone-400 text-sm">Costos & Repostería</p>
      </div>
      
      <div className="px-6 py-4 mb-4 border-b border-stone-800">
        <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Usuario</p>
        <p className="font-medium flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center text-xs text-amber-500">YC</span>
          Yoselyn Castillo
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? "bg-amber-600/10 text-amber-500 font-medium" 
                  : "text-stone-300 hover:bg-stone-800 hover:text-stone-50"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg text-stone-400 hover:bg-stone-800 hover:text-stone-50 transition-colors"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
