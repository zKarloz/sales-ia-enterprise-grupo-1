import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


export default function Topbar() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  const initial =
    user?.full_name
      .trim()
      .charAt(0)
      .toUpperCase() || "U";


  return (
    <header className="topbar">
      <div>
        <span className="topbar__eyebrow">
          Panel empresarial
        </span>

        <h2>SalesIA Enterprise</h2>
      </div>

      <div className="topbar__user">
        <div className="topbar__avatar">
          {initial}
        </div>

        <div>
          <strong>
            {user?.full_name ?? "Usuario"}
          </strong>

          <span>
            {user?.role ?? "Sin rol"}
          </span>
        </div>

        <button
          type="button"
          className="table-action"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}