import {
  useState,
} from "react";

import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import LoadingState from "../../components/LoadingState";
import PageHeader from "../../components/PageHeader";
import SuccessState from "../../components/SuccessState";

import {
  ROLE_ADMIN,
  ROLE_SELLER,
} from "../../constants/roles";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useApi,
} from "../../hooks/useApi";

import {
  createSale,
} from "../../services/saleService";

import type {
  Customer,
} from "../../types/customer";

import type {
  Product,
} from "../../types/product";

import type {
  Sale,
  SaleCreate,
} from "../../types/sale";

import type {
  UserOption,
} from "../../types/user";

import SaleForm from "./SaleForm";
import SaleTable from "./SaleTable";


interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
}


function MetricCard({
  label,
  value,
  helper,
}: MetricCardProps) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        shadow-slate-950/[0.03]
        dark:border-slate-800
        dark:bg-slate-900
      "
    >
      <span
        className="
          inline-flex
          rounded-lg
          bg-cyan-50
          px-2.5
          py-1
          text-xs
          font-bold
          text-cyan-700
          dark:bg-cyan-400/10
          dark:text-cyan-300
        "
      >
        {label}
      </span>

      <p
        className="
          mt-4
          text-3xl
          font-bold
          tracking-tight
          text-slate-950
          dark:text-white
        "
      >
        {value}
      </p>

      <p
        className="
          mt-2
          text-sm
          text-slate-500
          dark:text-slate-400
        "
      >
        {helper}
      </p>
    </div>
  );
}


export default function SalesPage() {
  const { user } = useAuth();

  const canCreateSale =
    user?.role === ROLE_ADMIN ||
    user?.role === ROLE_SELLER;


  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    saving,
    setSaving,
  ] = useState(false);


  const {
    data: sales,
    loading: salesLoading,
    error: salesError,
    refetch: refetchSales,
  } = useApi<Sale[]>(
    "/api/sales",
  );


  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useApi<Customer[]>(
    "/api/customers",
  );


  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useApi<Product[]>(
    "/api/products",
  );


  const {
    data: sellers,
    loading: sellersLoading,
    error: sellersError,
  } = useApi<UserOption[]>(
    "/api/users/options",
  );


  const saleList =
    sales ?? [];

  const customerList =
    customers ?? [];

  const productList =
    products ?? [];

  const sellerList =
    sellers ?? [];


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
      setSuccessMessage(null);

      await createSale(sale);

      await Promise.all([
        refetchSales(),
        refetchProducts(),
      ]);

      setShowForm(false);

      setSuccessMessage(
        "La venta fue registrada y el inventario fue actualizado correctamente.",
      );
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


  const totalSales =
    saleList.reduce(
      (sum, sale) =>
        sum +
        Number(
          sale.total_amount,
        ),
      0,
    );


  const averageTicket =
    saleList.length > 0
      ? totalSales /
      saleList.length
      : 0;


  return (
    <section
      className="
        w-full
        space-y-6
      "
    >
      <PageHeader
        title="Ventas"
        description="Gestiona las ventas y operaciones comerciales de SalesIA Enterprise."
        action={
          canCreateSale ? (
            <Button
              disabled={loading}
              onClick={() => {
                setActionError(
                  null,
                );

                setSuccessMessage(
                  null,
                );

                setShowForm(
                  true,
                );
              }}
            >
              + Nueva venta
            </Button>
          ) : undefined
        }
      />

      {actionError && (
        <ErrorState
          message={actionError}
        />
      )}

      {successMessage && (
        <SuccessState
          title="Venta registrada"
          message={successMessage}
        />
      )}

      {showForm && (
        <SaleForm
          customers={
            customerList
          }
          products={
            productList
          }
          onSubmit={
            handleCreateSale
          }
          onCancel={() => {
            setActionError(null);
            setShowForm(false);
          }}
          submitting={saving}
        />
      )}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          md:grid-cols-3
        "
      >
        <MetricCard
          label="Operaciones"
          value={saleList.length.toLocaleString(
            "es-PE",
          )}
          helper="Ventas registradas"
        />

        <MetricCard
          label="Facturación"
          value={`S/ ${totalSales.toLocaleString(
            "es-PE",
            {
              minimumFractionDigits:
                2,
              maximumFractionDigits:
                2,
            },
          )}`}
          helper="Monto acumulado"
        />

        <MetricCard
          label="Ticket promedio"
          value={`S/ ${averageTicket.toLocaleString(
            "es-PE",
            {
              minimumFractionDigits:
                2,
              maximumFractionDigits:
                2,
            },
          )}`}
          helper="Promedio por operación"
        />
      </div>

      <Card
        title="Historial de ventas"
        subtitle="Operaciones comerciales registradas en el sistema."
      >
        {loading && (
          <LoadingState
            message="Cargando ventas..."
          />
        )}

        {!loading &&
          error && (
            <ErrorState
              message={error}
            />
          )}

        {!loading &&
          !error &&
          saleList.length ===
          0 && (
            <EmptyState
              title="No hay ventas"
              message="Todavía no existen ventas registradas."
            />
          )}

        {!loading &&
          !error &&
          saleList.length >
          0 && (
            <SaleTable
              sales={saleList}
              customers={
                customerList
              }
              sellers={
                sellerList
              }
            />
          )}
      </Card>
    </section>
  );
}