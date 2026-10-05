import { NavLink } from "react-router-dom";

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
  roles?: string[];
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


export default function Sidebar() {
  const { user } = useAuth();

  const visibleItems = menuItems.filter(
    (item) =>
      !item.roles ||
      (user &&
        item.roles.includes(user.role)),
  );

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">
          S
        </div>

        <div>
          <h1>SalesIA</h1>
          <span>Enterprise</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive
                ? "sidebar__link--active"
                : ""
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span>SalesIA Enterprise</span>
        <small>v1.0.0</small>
      </div>
    </aside>
  );
}