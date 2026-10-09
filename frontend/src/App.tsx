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

import AnalyticsPage from "./modules/analytics/AnalyticsPage";
import LoginPage from "./modules/auth/LoginPage";
import CustomersPage from "./modules/customers/CustomersPage";
import DashboardPage from "./modules/dashboard/DashboardPage";
import InventoryPage from "./modules/inventory/InventoryPage";
import ProductsPage from "./modules/products/ProductsPage";
import ReportsPage from "./modules/reports/ReportsPage";
import SalesPage from "./modules/sales/SalesPage";
import SuppliersPage from "./modules/suppliers/SuppliersPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<DashboardPage />} />

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
                <Route
                  path="/productos"
                  element={<ProductsPage />}
                />
                <Route
                  path="/proveedores"
                  element={<SuppliersPage />}
                />
                <Route
                  path="/inventario"
                  element={<InventoryPage />}
                />
              </Route>

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
