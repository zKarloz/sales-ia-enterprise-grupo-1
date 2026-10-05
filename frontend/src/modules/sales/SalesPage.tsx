import { useState } from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";

import { useApi } from "../../hooks/useApi";
import { createSale } from "../../services/saleService";

import type { Customer } from "../../types/customer";
import type { Product } from "../../types/product";
import type {
  Sale,
  SaleCreate,
} from "../../types/sale";
import type { UserOption } from "../../types/user";

import SaleForm from "./SaleForm";
import SaleTable from "./SaleTable";

import {
  ROLE_ADMIN,
  ROLE_SELLER,
} from "../../constants/roles";

import { useAuth } from "../../context/AuthContext";

export default function SalesPage() {
  const { user } = useAuth();

  const canCreateSale =
    user?.role === ROLE_ADMIN ||
    user?.role === ROLE_SELLER;

  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] =
    useState<string | null>(null);
  const [saving, setSaving] = useState(false);


  const {
    data: sales,
    loading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = useApi<Sale[]>("/api/sales");


  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useApi<Customer[]>("/api/customers");


  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useApi<Product[]>("/api/products");


  const {
    data: sellers,
    loading: sellersLoading,
    error: sellersError,
  } = useApi<UserOption[]>("/api/users/options");


  const saleList = sales ?? [];
  const customerList = customers ?? [];
  const productList = products ?? [];
  const sellerList = sellers ?? [];


  const loading =
    salesLoading ||
    customersLoading ||
    productsLoading ||
    sellersLoading;

  const error =
    salesError ||
    customersError ||
    productsError ||
    sellersError;


  async function handleCreateSale(
    sale: SaleCreate,
  ) {
    try {
      setSaving(true);
      setActionError(null);

      await createSale(sale);

      setShowForm(false);

      // Actualiza ventas y stock después de registrar.
      await Promise.all([
        refetchSales(),
        refetchProducts(),
      ]);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar la venta.",
      );
    } finally {
      setSaving(false);
    }
  }


  const totalSales = saleList.reduce(
    (sum, sale) =>
      sum + Number(sale.total_amount),
    0,
  );

  const averageTicket =
    saleList.length > 0
      ? totalSales / saleList.length
      : 0;


  return (
    <section className="page">
      <PageHeader
        title="Ventas"
        description="Gestiona las ventas y operaciones comerciales."
        action={
          canCreateSale ? (
            <Button
              onClick={() => {
                setActionError(null);
                setShowForm(true);
              }}
            >
              + Nueva venta
            </Button>
          ) : undefined
        }
      />

      {actionError && (
        <ErrorState message={actionError} />
      )}

      {showForm && (
        <>
          <SaleForm
            customers={customerList}
            products={productList}
            onSubmit={handleCreateSale}
            onCancel={() => setShowForm(false)}
          />

          {saving && <LoadingState />}
        </>
      )}

      <div className="stats-grid">
        <Card title="Ventas registradas">
          <div className="stat-value">
            {saleList.length}
          </div>
        </Card>

        <Card title="Monto acumulado">
          <div className="stat-value">
            S/ {totalSales.toFixed(2)}
          </div>
        </Card>

        <Card title="Ticket promedio">
          <div className="stat-value">
            S/ {averageTicket.toFixed(2)}
          </div>
        </Card>
      </div>

      <Card
        title="Historial de ventas"
        subtitle="Información obtenida desde la API."
      >
        {loading && <LoadingState />}

        {!loading && error && (
          <ErrorState message={error} />
        )}

        {!loading &&
          !error &&
          saleList.length === 0 && (
            <EmptyState
              title="No hay ventas"
              message="Todavía no existen ventas registradas."
            />
          )}

        {!loading &&
          !error &&
          saleList.length > 0 && (
            <SaleTable
              sales={saleList}
              customers={customerList}
              sellers={sellerList}
            />
          )}
      </Card>
    </section>
  );
}