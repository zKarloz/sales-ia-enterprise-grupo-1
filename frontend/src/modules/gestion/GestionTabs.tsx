import { type ReactNode } from "react";
import { NavLink, Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_ADMIN, ROLE_MANAGER, ROLE_SELLER, ROLE_WAREHOUSE } from "../../constants/roles";

type Section = { label: string; path: string; roles: string[] };

const sections: Section[] = [
  { label: "Clientes", path: "/clientes", roles: [ROLE_ADMIN, ROLE_SELLER] },
  { label: "Productos", path: "/productos", roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Categorías", path: "/categorias", roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Proveedores", path: "/proveedores", roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
  { label: "Ventas", path: "/ventas", roles: [ROLE_ADMIN, ROLE_MANAGER, ROLE_SELLER] },
  { label: "Inventario", path: "/inventario", roles: [ROLE_ADMIN, ROLE_WAREHOUSE] },
];

/** Redirige a la primera sección autorizada, sin modificar las rutas existentes. */
export function GestionRedirect() {
  const { user } = useAuth();
  const first = sections.find(section => !!user && section.roles.includes(user.role));
  return <Navigate to={first?.path ?? "/dashboard"} replace />;
}

export default function GestionTabs({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const visible = sections.filter(section => !!user && section.roles.includes(user.role));

  return (
    <div className="space-y-5">
      <section aria-label="Secciones de Gestión" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-3 text-base font-bold text-slate-900 dark:text-white">Gestión</h1>
        <nav aria-label="Pestañas de Gestión" className="flex flex-wrap gap-2">
          {visible.map(section => (
            <NavLink
              key={section.path}
              to={section.path}
              className={({ isActive }) => `rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${
                isActive
                  ? "border-cyan-600 bg-cyan-600 text-white dark:border-cyan-500 dark:bg-cyan-500 dark:text-slate-950"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-400 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-cyan-300"
              }`}
            >
              {section.label}
            </NavLink>
          ))}
        </nav>
      </section>
      {children}
    </div>
  );
}
