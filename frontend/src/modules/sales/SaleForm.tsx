import { useState } from "react";

import Button from "../../components/Button";

import type {
  PaymentMethod,
  Sale,
} from "../../types/sale";

import { useSaleCart } from "./useSaleCart";

import {
  customersMock,
  productsMock,
} from "./salesMocks";

/*
 * Propiedades recibidas desde SalesPage.
 *
 * SaleForm se encarga de construir la venta,
 * pero SalesPage decidirá posteriormente cómo
 * almacenarla.
 */
interface SaleFormProps {
  onSubmit: (sale: Omit<Sale, "id">) => void;
  onCancel: () => void;
}

export default function SaleForm({
  onSubmit,
  onCancel,
}: SaleFormProps) {
  /*
   * Cliente seleccionado.
   *
   * Los valores de <select> llegan como texto,
   * por eso inicialmente utilizamos string.
   */
  const [customerId, setCustomerId] =
    useState("");

  /*
   * Producto seleccionado para agregar al carrito.
   */
  const [productId, setProductId] =
    useState("");

  /*
   * Cantidad de unidades que se agregarán.
   */
  const [quantity, setQuantity] =
    useState(1);

  /*
   * Información provisional del pago.
   */
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod | "">("");

  const [paymentAmount, setPaymentAmount] =
    useState(0);

  /*
   * Mensaje para mostrar validaciones al usuario.
   */
  const [message, setMessage] =
    useState("");

  /*
   * Toda la lógica del carrito se encuentra
   * separada de esta interfaz.
   */
  const {
    items,
    discountRate,
    taxRate,
    totals,

    addProduct,
    updateProductQuantity,
    removeProduct,
    setDiscountRate,
  } = useSaleCart();

  /*
   * Agrega el producto seleccionado al carrito.
   */
  function handleAddProduct() {
    const selectedProductId =
      Number(productId);

    const product = productsMock.find(
      (item) =>
        item.id === selectedProductId,
    );

    if (!product) {
      setMessage(
        "Selecciona un producto válido.",
      );

      return;
    }

    const wasAdded = addProduct(
      product,
      quantity,
    );

    if (!wasAdded) {
      setMessage(
        "No se pudo agregar el producto. Verifica la cantidad y el stock disponible.",
      );

      return;
    }

    setProductId("");
    setQuantity(1);

    setMessage(
      "Producto agregado correctamente.",
    );
  }

  /*
   * Actualiza directamente la cantidad
   * de un producto del carrito.
   */
  function handleQuantityChange(
    productId: number,
    newQuantity: number,
  ) {
    const product = productsMock.find(
      (item) => item.id === productId,
    );

    if (!product) {
      setMessage(
        "El producto seleccionado no existe.",
      );

      return;
    }

    const wasUpdated =
      updateProductQuantity(
        product,
        newQuantity,
      );

    if (!wasUpdated) {
      setMessage(
        `Cantidad inválida. Stock disponible para ${product.name}: ${product.stock}.`,
      );

      return;
    }

    setMessage(
      "Cantidad actualizada correctamente.",
    );
  }

  /*
   * Construye y envía la venta al componente padre.
   *
   * Por ahora sigue siendo una operación provisional.
   * Posteriormente SalesPage podrá enviarla al backend.
   */
  function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    /*
     * VALIDACIÓN DEL CLIENTE
     */
    if (!customerId) {
      setMessage(
        "Debes seleccionar un cliente.",
      );

      return;
    }

    /*
     * VALIDACIÓN DEL CARRITO
     */
    if (items.length === 0) {
      setMessage(
        "Debes agregar al menos un producto.",
      );

      return;
    }

    /*
     * VALIDACIÓN DEL MÉTODO DE PAGO
     */
    if (!paymentMethod) {
      setMessage(
        "Debes seleccionar un método de pago.",
      );

      return;
    }

    /*
     * VALIDACIÓN DEL MONTO
     */
    if (paymentAmount <= 0) {
      setMessage(
        "El monto pagado debe ser mayor que cero.",
      );

      return;
    }

    if (paymentAmount < totals.total) {
      setMessage(
        "El monto pagado es menor que el total de la venta.",
      );

      return;
    }

    /*
     * Recuperamos el cliente completo.
     */
    const customer = customersMock.find(
      (item) =>
        item.id === Number(customerId),
    );

    if (!customer) {
      setMessage(
        "No se pudo encontrar el cliente seleccionado.",
      );

      return;
    }

    /*
     * Construimos la venta utilizando el tipo
     * definido globalmente en src/types/sale.ts.
     */
    const sale: Omit<Sale, "id"> = {
      customerId: customer.id,
      customerName: customer.name,

      date: new Date()
        .toISOString()
        .split("T")[0],

      items: items.map((item) => ({
        ...item,
      })),

      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total,

      payment: {
        method: paymentMethod,
        amount: paymentAmount,
      },

      status: "completed",
    };

    /*
     * Enviamos la venta a SalesPage.
     *
     * En el siguiente paso SalesPage dejará
     * temporalmente de utilizar la API y guardará
     * estas ventas en memoria.
     */
    onSubmit(sale);
  }

  return (
    <form
      className="form-card sales-form"
      onSubmit={handleSubmit}
    >
      {/* ENCABEZADO */}
      <div className="form-card__header">
        <h2>Nueva venta</h2>

        <p>
          Registra productos, cantidades y
          datos del pago.
        </p>
      </div>

      {/* CLIENTE */}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="customer">
            Cliente
          </label>

          <select
            id="customer"
            value={customerId}
            onChange={(event) =>
              setCustomerId(
                event.target.value,
              )
            }
          >
            <option value="">
              Selecciona un cliente
            </option>

            {customersMock.map(
              (customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.name} -{" "}
                  {customer.document}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* AGREGAR PRODUCTO */}
      <div className="form-card__header">
        <h2>Agregar producto</h2>

        <p>
          Selecciona el producto y la cantidad.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="product">
            Producto
          </label>

          <select
            id="product"
            value={productId}
            onChange={(event) =>
              setProductId(
                event.target.value,
              )
            }
          >
            <option value="">
              Selecciona un producto
            </option>

            {productsMock.map(
              (product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                  {" - "}
                  S/ {product.price.toFixed(2)}
                  {" - "}
                  Stock: {product.stock}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="quantity">
            Cantidad
          </label>

          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => {
              const value = Number(
                event.target.value,
              );

              if (value < 1) {
                setMessage(
                  "La cantidad debe ser mayor que cero.",
                );

                return;
              }

              setQuantity(value);
              setMessage("");
            }}
          />
        </div>
      </div>

      <div className="form-actions">
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddProduct}
        >
          + Agregar producto
        </Button>
      </div>

      {/* CARRITO */}
      <div className="form-card__header">
        <h2>Detalle de venta</h2>

        <p>
          Productos agregados a la operación.
        </p>
      </div>

      {items.length === 0 ? (
        <p>
          No hay productos agregados.
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.productId}>
                  <td>
                    <strong>
                      {item.productName}
                    </strong>
                  </td>

                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(
                          item.productId,
                          Number(
                            event.target.value,
                          ),
                        )
                      }
                    />
                  </td>

                  <td>
                    S/{" "}
                    {item.unitPrice.toFixed(
                      2,
                    )}
                  </td>

                  <td>
                    <strong>
                      S/{" "}
                      {item.subtotal.toFixed(
                        2,
                      )}
                    </strong>
                  </td>

                  <td>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() =>
                        removeProduct(
                          item.productId,
                        )
                      }
                    >
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* IMPORTES */}
      <div className="form-card__header">
        <h2>Resumen de venta</h2>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="discount">
            Descuento %
          </label>

          <input
            id="discount"
            type="number"
            min="0"
            max="100"
            value={discountRate * 100}
            onChange={(event) => {
              const percentage =
                Number(
                  event.target.value,
                );

              const wasUpdated =
                setDiscountRate(
                  percentage / 100,
                );

              if (!wasUpdated) {
                setMessage(
                  "El descuento debe estar entre 0% y 100%.",
                );

                return;
              }

              setMessage("");
            }}
          />
        </div>
      </div>

      <div className="sales-summary">
        <p>
          Subtotal:{" "}
          <strong>
            S/ {totals.subtotal.toFixed(2)}
          </strong>
        </p>

        <p>
          Descuento:{" "}
          <strong>
            - S/ {totals.discount.toFixed(2)}
          </strong>
        </p>

        <p>
          Impuesto (
          {(taxRate * 100).toFixed(0)}%):{" "}
          <strong>
            S/ {totals.tax.toFixed(2)}
          </strong>
        </p>

        <p>
          Total:{" "}
          <strong>
            S/ {totals.total.toFixed(2)}
          </strong>
        </p>
      </div>

      {/* PAGO */}
      <div className="form-card__header">
        <h2>Pago</h2>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="paymentMethod">
            Método de pago
          </label>

          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(
                event.target
                  .value as PaymentMethod,
              )
            }
          >
            <option value="">
              Selecciona un método
            </option>

            <option value="CASH">
              Efectivo
            </option>

            <option value="CARD">
              Tarjeta
            </option>

            <option value="TRANSFER">
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

        <div className="form-field">
          <label htmlFor="paymentAmount">
            Monto pagado
          </label>

          <input
            id="paymentAmount"
            type="number"
            min="0"
            step="0.01"
            value={paymentAmount}
            onChange={(event) =>
              setPaymentAmount(
                Number(
                  event.target.value,
                ),
              )
            }
          />
        </div>
      </div>

      {/* VUELTO */}
      {paymentAmount > totals.total &&
        totals.total > 0 && (
          <p>
            Vuelto:{" "}
            <strong>
              S/{" "}
              {(
                paymentAmount -
                totals.total
              ).toFixed(2)}
            </strong>
          </p>
        )}

      {/* MENSAJES */}
      {message && (
        <div className="sales-message">
          {message}
        </div>
      )}

      {/* ACCIONES */}
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