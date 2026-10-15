import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./layouts/MainLayout";

import {
  ROLE_ADMIN,
  ROLE_ANALYST,
  ROLE_MANAGER,
  ROLE_SELLER,
  ROLE_WAREHOUSE,
} from "./constants/roles";

// ============================================================
// IMPORTACIÓN DE PÁGINAS POR MÓDULO
// ============================================================

import LoginPage from "./modules/auth/LoginPage";
import LandingPage from "./modules/landing/LandingPage";
import DashboardPage from "./modules/dashboard/DashboardPage";

import CustomersPage from "./modules/customers/CustomersPage";

import ProductsPage from "./modules/products/ProductsPage";
import CategoriesPage from "./modules/categories/CategoriesPage";
import SuppliersPage from "./modules/suppliers/SuppliersPage";
import InventoryPage from "./modules/inventory/InventoryPage";

import SalesPage from "./modules/sales/SalesPage";

import StatisticsPage from "./modules/statistics/StatisticsPage";
import AnalyticsPage from "./modules/analytics/AnalyticsPage";
import InsightsPage from "./modules/insights/InsightsPage";

import ReportsPage from "./modules/reports/ReportsPage";


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* ==================================================
              MÓDULO: AUTENTICACIÓN
              Ruta pública de inicio de sesión.
          ================================================== */}

          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />


          {/* ==================================================
              RUTAS PRIVADAS
              Requieren una sesión autenticada.
          ================================================== */}

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* ==============================================
                  MÓDULO: DASHBOARD
                  Disponible para usuarios autenticados.
              ============================================== */}

              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />


              {/* ==============================================
                  MÓDULO: CLIENTES
                  Roles: Administrador y Vendedor.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_SELLER,
                    ]}
                  />
                }
              >
                <Route
                  path="/clientes"
                  element={<CustomersPage />}
                />
              </Route>


              {/* ==============================================
                  MÓDULOS: CATÁLOGOS E INVENTARIO
                  Roles: Administrador y Almacén.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_WAREHOUSE,
                    ]}
                  />
                }
              >
                {/* Módulo: Productos */}
                <Route
                  path="/productos"
                  element={<ProductsPage />}
                />

                {/* Módulo: Categorías */}
                <Route
                  path="/categorias"
                  element={<CategoriesPage />}
                />

                {/* Módulo: Proveedores */}
                <Route
                  path="/proveedores"
                  element={<SuppliersPage />}
                />

                {/* Módulo: Inventario */}
                <Route
                  path="/inventario"
                  element={<InventoryPage />}
                />
              </Route>


              {/* ==============================================
                  MÓDULO: VENTAS
                  Roles: Administrador, Gerente y Vendedor.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_MANAGER,
                      ROLE_SELLER,
                    ]}
                  />
                }
              >
                <Route
                  path="/ventas"
                  element={<SalesPage />}
                />
              </Route>


              {/* ==============================================
                  MÓDULO: ESTADÍSTICA
                  Roles: Administrador y Analista.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_ANALYST,
                    ]}
                  />
                }
              >
                <Route
                  path="/estadistica"
                  element={<StatisticsPage />}
                />
              </Route>


              {/* ==============================================
                  MÓDULO: ANALYTICS — FASE 10
                  Roles: Administrador, Gerente y Analista.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_MANAGER,
                      ROLE_ANALYST,
                    ]}
                  />
                }
              >
                <Route
                  path="/analytics"
                  element={<AnalyticsPage />}
                />
              </Route>


              {/* ==============================================
                  MÓDULO: INSIGHTS — FASE 11
                  Roles: Administrador, Gerente y Analista.

                  Generación:
                    Administrador y Analista.

                  Consulta:
                    Administrador, Gerente y Analista.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_MANAGER,
                      ROLE_ANALYST,
                    ]}
                  />
                }
              >
                <Route
                  path="/insights"
                  element={<InsightsPage />}
                />
              </Route>


              {/* ==============================================
                  MÓDULO: REPORTES — FASE 12
                  Roles: Administrador y Gerente.
              ============================================== */}

              <Route
                element={
                  <RoleRoute
                    allowedRoles={[
                      ROLE_ADMIN,
                      ROLE_MANAGER,
                    ]}
                  />
                }
              >
                <Route
                  path="/reportes"
                  element={<ReportsPage />}
                />
              </Route>

            </Route>
          </Route>


          {/* ==================================================
              RUTA DE RESPALDO
              Redirige rutas desconocidas al Dashboard.
          ================================================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
