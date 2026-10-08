import {
  NavLink,
} from "react-router-dom";

import {
  ROLE_ADMIN,
  ROLE_ANALYST,
  ROLE_MANAGER,
  ROLE_SELLER,
  ROLE_WAREHOUSE,
} from "../constants/roles";

import {
  useAuth,
} from "../context/AuthContext";


interface MenuItem {
  label: string;
  path: string;
  roles?: string[];
}


interface SidebarProps {
  open: boolean;
  onClose: () => void;
}


const menuItems: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/",
  },
  {
    label: "Clientes",
    path: "/clientes",
    roles: [
      ROLE_ADMIN,
      ROLE_SELLER,
    ],
  },
  {
    label: "Productos",
    path: "/productos",
    roles: [
      ROLE_ADMIN,
      ROLE_WAREHOUSE,
    ],
  },
  {
    label: "Ventas",
    path: "/ventas",
    roles: [
      ROLE_ADMIN,
      ROLE_MANAGER,
      ROLE_SELLER,
    ],
  },
  {
    label: "Inventario",
    path: "/inventario",
    roles: [
      ROLE_ADMIN,
      ROLE_WAREHOUSE,
    ],
  },
  {
    label: "Analytics",
    path: "/analytics",
    roles: [
      ROLE_ADMIN,
      ROLE_MANAGER,
      ROLE_ANALYST,
    ],
  },
  {
    label: "Reportes",
    path: "/reportes",
    roles: [
      ROLE_ADMIN,
      ROLE_MANAGER,
    ],
  },
];


export default function Sidebar({
  open,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();

  const visibleItems = menuItems.filter(
    (item) =>
      !item.roles ||
      (
        user &&
        item.roles.includes(user.role)
      ),
  );


  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="
            fixed
            inset-0
            z-40
            bg-slate-950/50
            backdrop-blur-[2px]
            lg:hidden
          "
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-64
          flex-col
          border-r
          border-white/10
          bg-[#081b31]
          text-white
          shadow-xl
          transition-transform
          duration-200
          ease-out
          lg:translate-x-0
          lg:shadow-none
          ${open
            ? "translate-x-0"
            : "-translate-x-full"
          }
        `}
      >
        <div
          className="
            flex
            h-20
            items-center
            gap-3
            border-b
            border-white/10
            px-6
          "
        >
          <div
            className="
              grid
              h-10
              w-10
              shrink-0
              place-items-center
              rounded-xl
              bg-cyan-400
              text-lg
              font-black
              text-slate-950
              shadow-lg
              shadow-cyan-950/20
            "
          >
            S
          </div>

          <div className="min-w-0">
            <p
              className="
                truncate
                text-base
                font-bold
                tracking-tight
              "
            >
              SalesIA
            </p>

            <p
              className="
                text-xs
                font-medium
                text-slate-400
              "
            >
              Enterprise
            </p>
          </div>
        </div>

        <div className="px-4 pt-6">
          <p
            className="
              px-3
              text-[10px]
              font-bold
              uppercase
              tracking-[0.16em]
              text-slate-500
            "
          >
            Navegación
          </p>
        </div>

        <nav
          className="
            mt-3
            flex
            flex-1
            flex-col
            gap-1
            overflow-y-auto
            px-4
          "
        >
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={onClose}
              className={({
                isActive,
              }) =>
                `
                  flex
                  min-h-11
                  items-center
                  rounded-xl
                  px-3
                  text-sm
                  font-medium
                  transition
                  ${isActive
                  ? `
                        bg-cyan-400/15
                        text-cyan-300
                        ring-1
                        ring-inset
                        ring-cyan-400/20
                      `
                  : `
                        text-slate-300
                        hover:bg-white/5
                        hover:text-white
                      `
                }
                `
              }
            >
              <span
                className="
                  mr-3
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-current
                  opacity-70
                "
              />

              {item.label}
            </NavLink>
          ))}
        </nav>

        <div
          className="
            border-t
            border-white/10
            p-4
          "
        >
          <div
            className="
              rounded-xl
              bg-white/5
              px-4
              py-3
            "
          >
            <p
              className="
                text-xs
                font-semibold
                text-slate-200
              "
            >
              SalesIA Enterprise
            </p>

            <p
              className="
                mt-1
                text-[11px]
                text-slate-500
              "
            >
              Versión 1.0.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}