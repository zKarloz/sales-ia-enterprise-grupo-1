import { useState } from "react";

import PageHeader from "../../components/PageHeader";
import Button from "../../components/Button";
import Card from "../../components/Card";
import EmptyState from "../../components/EmptyState";

import SaleTable from "./SaleTable";
import SaleForm from "./SaleForm";

import type { Sale } from "../../types/sale";

/*
 * Página principal del módulo de ventas.
 *
 * Actualmente trabaja con datos locales mientras
 * el backend definitivo del proyecto continúa
 * en desarrollo.
 *
 * Más adelante podremos reemplazar el estado local
 * por saleService sin modificar SaleForm ni SaleTable.
 */
export default function SalesPage() {
  /*
   * Controla si el formulario de nueva venta
   * se encuentra visible.
   */
  const [showForm, setShowForm] =
    useState(false);

  /*
   * Historial provisional de ventas.
   *
   * Por ahora las ventas permanecen únicamente
   * durante la sesión actual del navegador.
   *
   * Posteriormente serán obtenidas desde FastAPI.
   */
  const [sales, setSales] =
    useState<Sale[]>([]);

  /*
   * Registra una venta de forma provisional.
   *
   * Date.now() se utiliza como identificador temporal.
   * Cuando exista PostgreSQL, el ID será generado
   * por la base de datos.
   */
  function handleCreateSale(
    sale: Omit<Sale, "id">,
  ) {
    const newSale: Sale = {
      ...sale,
      id: Date.now(),
    };

    /*
     * Colocamos la venta nueva al inicio
     * para mostrar primero las operaciones recientes.
     */
    setSales((currentSales) => [
      newSale,
      ...currentSales,
    ]);

    /*
     * Cerramos el formulario una vez registrada
     * correctamente la venta.
     */
    setShowForm(false);

    console.log(
      "Venta registrada provisionalmente:",
      newSale,
    );
  }

  /*
   * Elimina provisionalmente una venta
   * del historial local.
   */
  function handleDeleteSale(id: number) {
    const confirmed = window.confirm(
      "¿Deseas eliminar esta venta?",
    );

    if (!confirmed) {
      return;
    }

    setSales((currentSales) =>
      currentSales.filter(
        (sale) => sale.id !== id,
      ),
    );
  }

  /*
   * Indicadores generales del módulo.
   */
  const totalSales = sales.reduce(
    (sum, sale) => sum + sale.total,
    0,
  );

  const averageTicket =
    sales.length > 0
      ? totalSales / sales.length
      : 0;

  return (
    <section className="page sales-page">
      {/* ENCABEZADO */}
      <PageHeader
        title="Ventas"
        description="Gestiona las ventas y operaciones comerciales."
        action={
          <Button
            onClick={() =>
              setShowForm(true)
            }
          >
            + Nueva venta
          </Button>
        }
      />

      {/* FORMULARIO */}
      {showForm && (
        <SaleForm
          onSubmit={handleCreateSale}
          onCancel={() =>
            setShowForm(false)
          }
        />
      )}

      {/* INDICADORES */}
      <div className="stats-grid sales-stats-grid">
        <Card title="Ventas registradas">
          <div className="stat-value">
            {sales.length}
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

      {/* HISTORIAL */}
      <Card
        title="Historial de ventas"
        subtitle="Ventas registradas provisionalmente durante esta sesión."
      >
        {sales.length === 0 ? (
          <EmptyState
            title="No hay ventas"
            message="Todavía no existen ventas registradas."
          />
        ) : (
          <SaleTable
            sales={sales}
            onDelete={handleDeleteSale}
          />
        )}
      </Card>

      <Card>
        {/* Pie de página provisional */}
        <p>
          <small>
            Este módulo de ventas es una versión
            provisional. Desarrollado por el integrante 5: Carlos Gutierrez
          </small>
        </p>
      </Card>
    </section>
  );
}