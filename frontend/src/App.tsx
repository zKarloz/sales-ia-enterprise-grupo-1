import "./App.css";

import AnalyticsPage from "./modules/analytics/AnalyticsPage";
import InventoryPage from "./modules/inventory/InventoryPage";
import SalesPage from "./modules/sales/SalesPage";
import ProductsPage from "./modules/products/ProductsPage";
import CustomersPage from "./modules/customers/CustomersPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./modules/dashboard/DashboardPage";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section className="page-placeholder">
      <span className="page-placeholder__label">Módulo</span>
      <h1>{title}</h1>
      <p>
        Este módulo será implementado en las siguientes fases del proyecto.
      </p>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />

          <Route
            path="/clientes"
            element={<CustomersPage />}
          />

          <Route
            path="/productos"
            element={<ProductsPage />}
          />

          <Route
            path="/ventas"
            element={<SalesPage />}
          />

          <Route
            path="/inventario"
            element={<InventoryPage />}
          />

          <Route
            path="/analytics"
            element={<AnalyticsPage />}
           />

          <Route
            path="/reportes"
            element={<PlaceholderPage title="Reportes" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;