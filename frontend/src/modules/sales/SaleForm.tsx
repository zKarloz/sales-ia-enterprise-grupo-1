import { useState } from "react";

import Button from "../../components/Button";

import type { Customer } from "../../types/customer";
import type { Product } from "../../types/product";
import type {
  SaleCreate,
  SaleItemCreate,
} from "../../types/sale";
import type { UserOption } from "../../types/user";


interface SaleFormProps {
  customers: Customer[];
  products: Product[];
  sellers: UserOption[];
  onSubmit: (sale: SaleCreate) => void;
  onCancel: () => void;
}


interface FormItem {
  product_id: string;
  quantity: string;
}


export default function SaleForm({
  customers,
  products,
  sellers,
  onSubmit,
  onCancel,
}: SaleFormProps) {
  const [customerId, setCustomerId] = useState("");
  const [sellerId, setSellerId] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("EFECTIVO");

  const [items, setItems] = useState<FormItem[]>([
    {
      product_id: "",
      quantity: "1",
    },
  ]);


  function updateItem(
    index: number,
    field: keyof FormItem,
    value: string,
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
            ...item,
            [field]: value,
          }
          : item,
      ),
    );
  }


  function addItem() {
    setItems((current) => [
      ...current,
      {
        product_id: "",
        quantity: "1",
      },
    ]);
  }


  function removeItem(index: number) {
    setItems((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    );
  }


  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !customerId ||
      !sellerId ||
      !paymentMethod ||
      items.length === 0
    ) {
      return;
    }

    const parsedItems: SaleItemCreate[] =
      items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
      }));

    const validItems = parsedItems.every(
      (item) =>
        item.product_id > 0 &&
        item.quantity > 0,
    );

    if (!validItems) {
      return;
    }

    // Precio, subtotal y total se calculan en backend.
    onSubmit({
      customer_id: Number(customerId),
      seller_id: Number(sellerId),
      payment_method: paymentMethod,
      items: parsedItems,
    });
  }


  return (
    <form
      className="form-card"
      onSubmit={handleSubmit}
    >
      <div className="form-card__header">
        <h2>Nueva venta</h2>
        <p>
          Registra productos y cantidades de la venta.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="customer">
            Cliente
          </label>

          <select
            id="customer"
            value={customerId}
            onChange={(event) =>
              setCustomerId(event.target.value)
            }
            required
          >
            <option value="">
              Seleccionar cliente
            </option>

            {customers.map((customer) => (
              <option
                key={customer.id}
                value={customer.id}
              >
                {customer.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="seller">
            Vendedor
          </label>

          <select
            id="seller"
            value={sellerId}
            onChange={(event) =>
              setSellerId(event.target.value)
            }
            required
          >
            <option value="">
              Seleccionar vendedor
            </option>

            {sellers.map((seller) => (
              <option
                key={seller.id}
                value={seller.id}
              >
                {seller.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="paymentMethod">
            Método de pago
          </label>

          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(event.target.value)
            }
          >
            <option value="EFECTIVO">
              Efectivo
            </option>
            <option value="TARJETA">
              Tarjeta
            </option>
            <option value="TRANSFERENCIA">
              Transferencia
            </option>
            <option value="YAPE">
              Yape
            </option>
            <option value="PLIN">
              Plin
            </option>
          </select>
        </div>
      </div>

      <div className="sale-items">
        <h3>Productos</h3>

        {items.map((item, index) => (
          <div
            className="form-grid"
            key={index}
          >
            <div className="form-field">
              <label>
                Producto
              </label>

              <select
                value={item.product_id}
                onChange={(event) =>
                  updateItem(
                    index,
                    "product_id",
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Seleccionar producto
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.stock === 0}
                  >
                    {product.name} — Stock:{" "}
                    {product.stock} — S/{" "}
                    {Number(product.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>
                Cantidad
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(
                    index,
                    "quantity",
                    event.target.value,
                  )
                }
                required
              />
            </div>

            {items.length > 1 && (
              <div className="form-field">
                <Button
                  type="button"
                  variant="danger"
                  onClick={() =>
                    removeItem(index)
                  }
                >
                  Quitar
                </Button>
              </div>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="secondary"
          onClick={addItem}
        >
          + Agregar producto
        </Button>
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button type="submit">
          Registrar venta
        </Button>
      </div>
    </form>
  );
}