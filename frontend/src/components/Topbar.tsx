import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import Button from "./Button";

import {
  saveTheme,
  type Theme,
} from "../utils/theme";


interface TopbarProps {
  onMenuClick: () => void;
}


export default function Topbar({
  onMenuClick,
}: TopbarProps) {
  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const [
    theme,
    setTheme,
  ] = useState<Theme>(() =>
    document.documentElement.classList.contains(
      "dark",
    )
      ? "dark"
      : "light",
  );


  function handleLogout() {
    logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }


  function handleThemeToggle() {
    const nextTheme: Theme =
      theme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);
    saveTheme(nextTheme);
  }


  const initial =
    user?.full_name
      .trim()
      .charAt(0)
      .toUpperCase() || "U";


  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-slate-200/80
        bg-white/90
        backdrop-blur-xl
        transition-colors
        dark:border-slate-800
        dark:bg-slate-950/90
      "
    >
      <div
        className="
          flex
          min-h-16
          items-center
          justify-between
          gap-3
          px-4
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-3
          "
        >
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={onMenuClick}
            className="
              grid
              h-10
              w-10
              shrink-0
              place-items-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-600
              transition
              hover:bg-slate-50
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-cyan-500
              lg:hidden
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0">
            <p
              className="
                text-[11px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-cyan-700
                dark:text-cyan-400
              "
            >
              Panel empresarial
            </p>

            <h2
              className="
                truncate
                text-base
                font-bold
                text-slate-900
                sm:text-lg
                dark:text-slate-100
              "
            >
              SalesIA Enterprise
            </h2>
          </div>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
            sm:gap-3
          "
        >
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label={
              theme === "dark"
                ? "Activar tema claro"
                : "Activar tema oscuro"
            }
            title={
              theme === "dark"
                ? "Tema claro"
                : "Tema oscuro"
            }
            className="
              grid
              h-10
              w-10
              place-items-center
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-600
              transition
              hover:bg-slate-50
              hover:text-slate-900
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-cyan-500
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
              dark:hover:text-white
            "
          >
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="4"
                />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
              </svg>
            )}
          </button>

          <div
            className="
              hidden
              items-center
              gap-3
              border-l
              border-slate-200
              pl-3
              sm:flex
              dark:border-slate-800
            "
          >
            <div
              className="
                grid
                h-9
                w-9
                shrink-0
                place-items-center
                rounded-full
                bg-cyan-100
                text-sm
                font-bold
                text-cyan-800
                dark:bg-cyan-400/15
                dark:text-cyan-300
              "
            >
              {initial}
            </div>

            <div className="hidden min-w-0 md:block">
              <p
                className="
                  max-w-40
                  truncate
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {user?.full_name ??
                  "Usuario"}
              </p>

              <p
                className="
                  mt-0.5
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {user?.role ??
                  "Sin rol"}
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={handleLogout}
            className="hidden sm:inline-flex"
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}