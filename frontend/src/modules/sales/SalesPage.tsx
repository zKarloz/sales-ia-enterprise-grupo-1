import { useState } from "react";
import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Card from "../../components/Card";
import LoadingState from "../../components/LoadingState";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import SaleTable from "./SaleTable";
import SaleForm from "./SaleForm";
import { useApi } from "../../hooks/useApi";
import {
  createSale,
  deleteSale,
} from "../../services/saleService";
import type { Sale } from "../../types/sale";

export default function SalesPage() {
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    data: sales,
    loading,
    error,
    refetch,
  } = useApi<Sale[]>("/sales");

  const saleList = sales ?? [];

  async function handleCreateSale(
    sale: Omit<Sale, "id">,
  ) {
    try {
      setSaving(true);
      setActionError(null);

      await createSale(sale);

      setShowForm(false);
      await refetch();
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

  async function handleDeleteSale(id: number) {
    const confirmed = window.confirm(
      "¿Deseas eliminar esta venta?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionError(null);

      await deleteSale(id);
      await refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la venta.",
      );
    }
  }

  const totalSales = saleList.reduce(
    (sum, sale) => sum + sale.total,
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
          <Button
            onClick={() => {
              setActionError(null);
              setShowForm(true);
            }}
          >
            + Nueva venta
          </Button>
        }
      />

      {actionError && <ErrorState message={actionError} />}

      {showForm && (
        <>
          <SaleForm
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

        {!loading && !error && saleList.length === 0 && (
          <EmptyState
            title="No hay ventas"
            message="Todavía no existen ventas registradas."
          />
        )}

        {!loading && !error && saleList.length > 0 && (
          <SaleTable
            sales={saleList}
            onDelete={handleDeleteSale}
          />
        )}
      </Card>
    </section>
  );
}
