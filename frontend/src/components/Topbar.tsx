import {
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getInitialTheme,
  saveTheme,
  type Theme,
} from "../utils/theme";


interface TopbarProps {
  onMenuClick: () => void;
}


const pageTitles: Record<
  string,
  string
> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/productos": "Productos",
  "/categorias": "Categorías",
  "/proveedores": "Proveedores",
  "/ventas": "Ventas",
  "/inventario": "Inventario",
  "/analytics": "Analytics",
  "/reportes": "Reportes",
};


export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const [
    theme,
    setTheme,
  ] = useState<Theme>(
    () => getInitialTheme(),
  );


  const pageTitle =
    pageTitles[
    location.pathname
    ] ?? "SalesIA";


  const initial =
    user?.full_name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "U";


  function handleThemeToggle() {
    const nextTheme:
      Theme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);
    saveTheme(nextTheme);
  }


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-14
        items-center
        justify-between
        gap-3
        border-b
        border-slate-200
        bg-white/95
        px-3
        backdrop-blur
        sm:h-16
        sm:px-5
        lg:px-6
        dark:border-slate-800
        dark:bg-slate-950/95
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-2.5
        "
      >
        <button
          type="button"
          onClick={
            onMenuClick
          }
          aria-label="Abrir menú"
          className="
            grid
            h-9
            w-9
            shrink-0
            place-items-center
            rounded-lg
            border
            border-slate-200
            text-slate-600
            transition
            hover:bg-slate-100
            lg:hidden
            dark:border-slate-700
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <h1
          className="
            truncate
            text-base
            font-bold
            text-slate-950
            sm:text-lg
            dark:text-white
          "
        >
          {pageTitle}
        </h1>
      </div>


      <div
        className="
          flex
          shrink-0
          items-center
          gap-1.5
          sm:gap-2
        "
      >
        <button
          type="button"
          onClick={
            handleThemeToggle
          }
          aria-label={
            theme === "dark"
              ? "Usar modo claro"
              : "Usar modo oscuro"
          }
          title={
            theme === "dark"
              ? "Modo claro"
              : "Modo oscuro"
          }
          className="
            grid
            h-8
            w-8
            place-items-center
            rounded-lg
            text-slate-500
            transition
            hover:bg-slate-100
            hover:text-slate-900
            sm:h-9
            sm:w-9
            dark:text-slate-400
            dark:hover:bg-slate-800
            dark:hover:text-white
          "
        >
          {theme === "dark" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <circle
                cx="12"
                cy="12"
                r="4"
              />

              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              className="h-4 w-4"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3A7 7 0 0 0 21 12.79Z" />
            </svg>
          )}
        </button>


        <div
          title={
            user?.full_name ??
            "Usuario"
          }
          className="
            grid
            h-8
            w-8
            place-items-center
            rounded-full
            bg-cyan-100
            text-xs
            font-bold
            text-cyan-800
            sm:h-9
            sm:w-9
            sm:text-sm
            dark:bg-cyan-400/10
            dark:text-cyan-300
          "
        >
          {initial}
        </div>


        <button
          type="button"
          onClick={
            handleLogout
          }
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="
            grid
            h-8
            w-8
            place-items-center
            rounded-lg
            text-slate-500
            transition
            hover:bg-red-50
            hover:text-red-600
            sm:h-9
            sm:w-9
            dark:text-slate-400
            dark:hover:bg-red-950/30
            dark:hover:text-red-400
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-4 w-4"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          </svg>
        </button>
      </div>
    </header>
  );
}