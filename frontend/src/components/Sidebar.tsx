import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Dashboard", path: "/" },
  { label: "Clientes", path: "/clientes" },
  { label: "Productos", path: "/productos" },
  { label: "Ventas", path: "/ventas" },
  { label: "Inventario", path: "/inventario" },
  { label: "Analytics", path: "/analytics" },
  { label: "Reportes", path: "/reportes" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">S</div>

        <div>
          <h1>SalesIA</h1>
          <span>Enterprise</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
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