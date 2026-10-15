import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Lightbulb,
  Package,
  ShoppingCart,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import BrandLogo from "./BrandLogo";
import {
  ROLE_ADMIN,
  ROLE_ANALYST,
  ROLE_MANAGER,
  ROLE_SELLER,
  ROLE_WAREHOUSE,
} from "../constants/roles";
import { useAuth } from "../context/AuthContext";

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

const menuItems: MenuItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Clientes", path: "/clientes", icon: Users, roles: [ROLE_ADMIN, ROLE_SELLER] },
  { label: "Productos", path: "/productos", icon: Package, roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Categorías", path: "/categorias", icon: FolderTree, roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Proveedores", path: "/proveedores", icon: Truck, roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Ventas", path: "/ventas", icon: ShoppingCart, roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_SELLER] },
  { label: "Inventario", path: "/inventario", icon: Boxes, roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Estadística", path: "/estadistica", icon: BarChart3, roles: [ROLE_ADMIN, ROLE_ANALYST] },
  { label: "Analytics", path: "/analytics", icon: ChartNoAxesCombined, roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_ANALYST] },
  { label: "Insights", path: "/insights", icon: Lightbulb, roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_ANALYST] },
  { label: "Reportes", path: "/reportes", icon: ClipboardList, roles: [ROLE_ADMIN, ROLE_MANAGER] },
];

export default function Sidebar({
  open,
  onClose,
  expanded,
  onToggleExpanded,
}: SidebarProps) {
  const { user } = useAuth();
  const visibleItems = menuItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role)),
  );

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        aria-label="Navegación principal"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-white/10 bg-[#081b31] text-white shadow-xl transition-[transform,width] duration-200 ease-out motion-reduce:transition-none lg:translate-x-0 lg:shadow-none ${expanded ? "lg:w-64" : "lg:w-20"} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5 lg:justify-center lg:px-3">
          <div className="shrink-0"><BrandLogo size={42} /></div>
          <div className={`min-w-0 flex-1 ${expanded ? "lg:block" : "lg:hidden"}`}>
            <p className="truncate text-base font-bold tracking-tight">SalesIA</p>
            <p className="text-xs font-medium text-slate-400">Enterprise</p>
          </div>
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={onClose}
            className="ml-auto grid h-9 w-9 place-items-center rounded-lg text-cyan-300 hover:bg-white/10 lg:hidden"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className={`hidden pt-4 lg:flex ${expanded ? "justify-end px-4" : "justify-center"}`}>
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-label={expanded ? "Contraer barra lateral" : "Expandir barra lateral"}
            title={expanded ? "Contraer menú" : "Expandir menú"}
            aria-expanded={expanded}
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-cyan-300 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            {expanded ? <ChevronLeft size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
          </button>
        </div>

        <p className={`px-6 pt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 ${expanded ? "lg:block" : "lg:sr-only"}`}>
          Navegación
        </p>

        <nav className={`mt-3 flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pb-5 ${expanded ? "px-4" : "px-4 lg:px-3"}`}>
          {visibleItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/dashboard"}
              onClick={onClose}
              title={!expanded ? label : undefined}
              aria-label={label}
              className={({ isActive }) => `group flex min-h-11 items-center rounded-xl transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${expanded ? "gap-3 px-3" : "gap-3 px-3 lg:justify-center lg:px-0"} ${isActive ? "bg-cyan-400/15 text-white ring-1 ring-inset ring-cyan-400/25" : "text-slate-200 hover:bg-white/[0.07] hover:text-white"}`}
            >
              <Icon aria-hidden="true" size={21} strokeWidth={1.9} className="shrink-0 text-cyan-300" />
              <span className={`truncate text-sm font-medium ${expanded ? "lg:inline" : "lg:sr-only"}`}>
                {label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-white/10 py-4 text-xs text-slate-400 ${expanded ? "px-6" : "px-3 lg:text-center"}`}>
          <span className={expanded ? "" : "lg:sr-only"}>SalesIA Enterprise</span>
          {!expanded && <span className="hidden font-semibold text-cyan-300 lg:inline">SE</span>}
        </div>
      </aside>
    </>
  );
}
