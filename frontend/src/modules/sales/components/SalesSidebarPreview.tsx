/*
 * Sidebar provisional utilizado únicamente para visualizar
 * cómo podría integrarse el módulo de ventas dentro del
 * frontend completo de SalesIA Enterprise.
 *
 * Este componente NO pretende reemplazar el sidebar definitivo
 * que utilizará toda la aplicación.
 */
export const SalesSidebarPreview = () => {
  /*
   * Por ahora los elementos son solamente visuales.
   * Más adelante podrán convertirse en enlaces con React Router.
   */
  const menuItems = [
    "Dashboard",
    "Clientes",
    "Productos",
    "Ventas",
    "Inventario",
    "Analytics",
    "Reportes",
  ];

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-neutral-200 bg-white md:flex md:flex-col">
      {/* LOGO / IDENTIDAD */}
      <div className="border-b border-neutral-200 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-sm font-bold text-white">
            SA
          </div>

          <div>
            <p className="font-semibold text-neutral-900">
              SalesIA
            </p>

            <p className="text-xs text-neutral-500">
              Enterprise
            </p>
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Navegación
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            /*
             * Ventas se marca como opción activa porque
             * actualmente estamos desarrollando este módulo.
             */
            const isActive = item === "Ventas";

            return (
              <button
                key={item}
                type="button"
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                  isActive
                    ? "bg-neutral-900 font-medium text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                ].join(" ")}
              >
                {/* Indicador visual sencillo */}
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    isActive
                      ? "bg-white"
                      : "bg-neutral-300",
                  ].join(" ")}
                />

                {item}
              </button>
            );
          })}
        </div>
      </nav>

      {/* USUARIO PROVISIONAL */}
      <div className="border-t border-neutral-200 p-4">
        <div className="rounded-lg bg-neutral-50 p-3">
          <p className="text-sm font-medium text-neutral-800">
            Usuario de prueba
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Vendedor
          </p>
        </div>
      </div>
    </aside>
  );
};