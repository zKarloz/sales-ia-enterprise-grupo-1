import { useState } from "react";
import Button from "../../components/Button";
import type { Sale } from "../../types/sale";

interface SaleFormProps {
  onSubmit: (sale: Omit<Sale, "id">) => void;
  onCancel: () => void;
}

export default function SaleForm({
  onSubmit,
  onCancel,
}: SaleFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [total, setTotal] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!customerName.trim() || !total) {
      return;
    }

    onSubmit({
      customerId: Date.now(),
      customerName,
      date: new Date().toISOString().split("T")[0],
      items: [],
      total: Number(total),
      status: "completed",
    });
  }

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-card__header">
        <h2>Nueva venta</h2>
        <p>Registra una venta de forma provisional.</p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="customerName">
            Cliente
          </label>

          <input
            id="customerName"
            value={customerName}
            onChange={(event) =>
              setCustomerName(event.target.value)
            }
            placeholder="Nombre del cliente"
          />
        </div>

        <div className="form-field">
          <label htmlFor="total">
            Total
          </label>

          <input
            id="total"
            type="number"
            min="0"
            step="0.01"
            value={total}
            onChange={(event) =>
              setTotal(event.target.value)
            }
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>

        <Button type="submit">
          Registrar venta
        </Button>
      </div>
    </form>
  );
}