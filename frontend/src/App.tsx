import "./App.css";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

import MainLayout from "./layouts/MainLayout";

import RoleRoute from "./components/RoleRoute";

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
import SalesPage from "./modules/sales/SalesPage";


function PlaceholderPage({
  title,
}: {
  title: string;
}) {
  return (
    <section className="page-placeholder">
      <span className="page-placeholder__label">
        Módulo
      </span>

      <h1>{title}</h1>

      <p>
        Este módulo será implementado en las
        siguientes fases del proyecto.
      </p>
    </section>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={<DashboardPage />}
              />


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
                  element={
                    <PlaceholderPage title="Reportes" />
                  }
                />
              </Route>
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


export default App;