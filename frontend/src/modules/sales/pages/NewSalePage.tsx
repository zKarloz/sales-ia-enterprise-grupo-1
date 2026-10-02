import { useState } from "react";

import { SalesSidebarPreview } from "../components/SalesSidebarPreview";
import { customersMock } from "../mocks/customers.mock";
import { productsMock } from "../mocks/products.mock";
import { useSaleCart } from "../hooks/useSaleCart";
import type { PaymentMethod, Sale } from "../types/sales.types";

/*
 * Página provisional para registrar una nueva venta.
 *
 * Actualmente trabaja con:
 * - Clientes simulados.
 * - Productos simulados.
 * - Carrito local.
 * - Cálculos locales.
 *
 * Posteriormente se conectará con la API FastAPI.
 */
export const NewSalePage = () => {
  // Cliente seleccionado.
  const [customerId, setCustomerId] = useState("");

  // Producto seleccionado.
  const [productId, setProductId] = useState("");

  // Cantidad que se agregará al carrito.
  const [quantity, setQuantity] = useState(1);

  // Mensajes provisionales para informar al usuario.
  const [message, setMessage] = useState("");

  /*
   * El hook mantiene toda la lógica del carrito separada
   * de la presentación visual.
   */
  const {
    details,
    totals,
    discountRate,
    taxRate,
    addProduct,
    updateProductQuantity,
    removeProduct,
    clearCart,
    setDiscountRate,
  } = useSaleCart();

  /*
   * Agrega el producto seleccionado al carrito.
   */
  const handleAddProduct = () => {
    const selectedProductId = Number(productId);

    const product = products.find(
      (item) => item.id === selectedProductId,
    );

    if (!product) {
      setMessage("Selecciona un producto válido.");
      return;
    }

    const wasAdded = addProduct(product, quantity);

    if (!wasAdded) {
      setMessage(
        "No se pudo agregar el producto. Verifica la cantidad y el stock disponible.",
      );
      return;
    }

    setMessage("Producto agregado correctamente.");

    // Reiniciamos los controles después de agregar.
    setProductId("");
    setQuantity(1);
  };

/*
 * Registra provisionalmente una venta.
 *
 * Actualmente:
 * 1. Valida cliente.
 * 2. Valida productos.
 * 3. Valida pago.
 * 4. Crea la venta.
 * 5. Actualiza el inventario local.
 * 6. Agrega la venta al historial.
 *
 * Posteriormente estos pasos serán responsabilidad
 * principalmente del backend y PostgreSQL.
 */
const handleRegisterSale = () => {
  if (!customerId) {
    setMessage("Debes seleccionar un cliente.");
    return;
  }

  if (details.length === 0) {
    setMessage(
      "Debes agregar al menos un producto.",
    );
    return;
  }

  if (!validatePayment()) {
    return;
  }

  /*
   * Recuperamos el cliente completo porque nuestra
   * interfaz Sale almacena el objeto Customer.
   */
  const customer = customersMock.find(
    (item) => item.id === Number(customerId),
  );

  if (!customer) {
    setMessage(
      "No se pudo encontrar el cliente seleccionado.",
    );
    return;
  }

  /*
   * Creamos la venta provisional.
   *
   * Date.now() funciona como identificador temporal.
   * PostgreSQL generará el ID real cuando integremos
   * el backend.
   */
  const newSale: Sale = {
    id: Date.now(),
    customer,
    date: new Date().toISOString(),

    details: details.map((detail) => ({
      ...detail,
    })),

    subtotal: totals.subtotal,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total,

    payment: {
      method: paymentMethod as PaymentMethod,
      amount: paymentAmount,
    },

    status: "PAID",
  };

  /*
   * Actualizamos provisionalmente el inventario.
   *
   * Por cada producto vendido buscamos su detalle
   * correspondiente y restamos la cantidad vendida.
   */
  setProducts((currentProducts) =>
    currentProducts.map((product) => {
      const soldDetail = details.find(
        (detail) =>
          detail.productId === product.id,
      );

      if (!soldDetail) {
        return product;
      }

      return {
        ...product,
        stock:
          product.stock -
          soldDetail.quantity,
      };
    }),
  );

  /*
   * Guardamos la venta en el historial local.
   *
   * La venta más reciente aparecerá primero.
   */
  setSalesHistory((currentSales) => [
    newSale,
    ...currentSales,
  ]);

  console.log(
    "Venta registrada provisionalmente:",
    newSale,
  );

  /*
   * Reiniciamos el formulario después de registrar
   * correctamente la operación.
   */
  clearCart();

  setCustomerId("");
  setProductId("");
  setQuantity(1);

  setPaymentMethod("");
  setPaymentAmount(0);

  setMessage(
    "Venta registrada correctamente. El inventario fue actualizado.",
  );
};

  /*
 * Actualiza la cantidad de un producto que ya está
 * agregado en el detalle de venta.
 *
 * Si la cantidad supera el stock disponible,
 * se rechaza la modificación.
 */
const handleQuantityChange = (
  productId: number,
  newQuantity: number,
) => {
  const product = products.find(
    (item) => item.id === productId,
  );

  if (!product) {
    setMessage("El producto seleccionado no existe.");
    return;
  }

  const wasUpdated = updateProductQuantity(
    product,
    newQuantity,
  );

  if (!wasUpdated) {
    setMessage(
      `Cantidad inválida. El stock disponible para ${product.name} es ${product.stock}.`,
    );

    return;
  }

  setMessage("Cantidad actualizada correctamente.");
};

// Método de pago seleccionado.
// Inicialmente no hay ninguno seleccionado.
const [paymentMethod, setPaymentMethod] =
  useState<PaymentMethod | "">("");

// Monto ingresado por el usuario para realizar el pago.
const [paymentAmount, setPaymentAmount] =
  useState(0);

/*
 * Valida que el pago tenga la información necesaria
 * antes de confirmar la venta.
 */
const validatePayment = (): boolean => {
  if (!paymentMethod) {
    setMessage(
      "Debes seleccionar un método de pago.",
    );

    return false;
  }

  if (paymentAmount <= 0) {
    setMessage(
      "El monto pagado debe ser mayor que cero.",
    );

    return false;
  }

  /*
   * Por ahora exigiremos que el monto cubra
   * por completo el total de la venta.
   *
   * Más adelante se podría implementar:
   * - pagos parciales,
   * - crédito,
   * - pagos múltiples.
   */
  if (paymentAmount < totals.total) {
    setMessage(
      "El monto pagado es menor que el total de la venta.",
    );

    return false;
  }

  return true;
};

/*
 * Inventario provisional.
 *
 * Creamos una copia de productsMock para poder modificar
 * el stock durante esta sesión sin alterar directamente
 * el archivo de datos simulados.
 */
const [products, setProducts] =
  useState(() => productsMock.map((product) => ({ ...product })));

/*
 * Historial provisional de ventas registradas.
 *
 * Más adelante esta información vendrá de:
 * GET /sales
 */
const [salesHistory, setSalesHistory] =
  useState<Sale[]>([]);

  return (
  <div className="min-h-screen bg-neutral-100 md:flex">
    <SalesSidebarPreview />

    <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ENCABEZADO */}
        <header className="mb-8">
          <p className="mb-1 text-sm font-medium text-neutral-500">
            SalesIA Enterprise
          </p>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            Nueva venta
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Registra el cliente, agrega productos y revisa los
            importes antes de confirmar la operación.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* COLUMNA PRINCIPAL */}
          <div className="space-y-6 lg:col-span-2">

            {/* CLIENTE */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Cliente
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Selecciona el cliente asociado a la venta.
                </p>
              </div>

              <label
                htmlFor="customer"
                className="mb-2 block text-sm font-medium text-neutral-700"
              >
                Cliente
              </label>

              <select
                id="customer"
                value={customerId}
                onChange={(event) =>
                  setCustomerId(event.target.value)
                }
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
              >
                <option value="">
                  Selecciona un cliente
                </option>

                {customersMock.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.name} - {customer.document}
                  </option>
                ))}
              </select>
            </section>

            {/* AGREGAR PRODUCTO */}
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Agregar producto
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Selecciona un producto y especifica la cantidad.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div>
                  <label
                    htmlFor="product"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Producto
                  </label>

                  <select
                    id="product"
                    value={productId}
                    onChange={(event) =>
                      setProductId(event.target.value)
                    }
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                  >
                    <option value="">
                      Selecciona un producto
                    </option>

                    {products.map((product) => (
                      <option
                        key={product.id}
                        value={product.id}
                      >
                        {product.name} — S/{" "}
                        {product.price.toFixed(2)} — Stock:{" "}
                        {product.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="quantity"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Cantidad
                  </label>

                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => {
                        const newQuantity = Number(
                            event.target.value,
                        );

                        if (newQuantity < 1) {
                            setMessage(
                            "La cantidad debe ser mayor que cero.",
                            );

                            return;
                        }

                        setQuantity(newQuantity);
                        setMessage("");
                        }}
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddProduct}
                className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 active:bg-neutral-800"
              >
                Agregar producto
              </button>
            </section>

            {/* DETALLE DE VENTA */}
            <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 p-6">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Detalle de venta
                </h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Productos que forman parte de la operación.
                </p>
              </div>

              {details.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-neutral-600">
                    No hay productos agregados
                  </p>

                  <p className="mt-1 text-sm text-neutral-400">
                    Los productos aparecerán aquí al agregarlos.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-neutral-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        <th className="px-6 py-3">
                          Producto
                        </th>

                        <th className="px-6 py-3">
                          Cantidad
                        </th>

                        <th className="px-6 py-3">
                          Precio
                        </th>

                        <th className="px-6 py-3">
                          Subtotal
                        </th>

                        <th className="px-6 py-3 text-right">
                          Acción
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-neutral-100">
                      {details.map((detail) => (
                        <tr
                          key={detail.productId}
                          className="text-sm text-neutral-700"
                        >
                          <td className="px-6 py-4 font-medium text-neutral-900">
                            {detail.productName}
                          </td>

                          <td className="px-6 py-4">
                            <input
                                type="number"
                                min="1"
                                value={detail.quantity}
                                onChange={(event) =>
                                handleQuantityChange(
                                    detail.productId,
                                    Number(event.target.value),
                                )
                                }
                                className="w-20 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                            />
                            </td>

                          <td className="px-6 py-4">
                            S/ {detail.unitPrice.toFixed(2)}
                          </td>

                          <td className="px-6 py-4 font-medium">
                            S/ {detail.subtotal.toFixed(2)}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                removeProduct(detail.productId)
                              }
                              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* PANEL LATERAL DE TOTALES */}
          <aside className="lg:col-span-1">
            <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                Resumen
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Importes calculados de la venta.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="discount"
                  className="mb-2 block text-sm font-medium text-neutral-700"
                >
                  Descuento %
                </label>

                <input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate * 100}
                  onChange={(event) => {
                    const percentage = Number(
                        event.target.value,
                    );

                    /*
                    * El descuento debe permanecer entre 0% y 100%.
                    */
                    if (percentage < 0 || percentage > 100) {
                        setMessage(
                        "El descuento debe estar entre 0% y 100%.",
                        );

                        return;
                    }

                    setDiscountRate(percentage / 100);

                    setMessage("");
                    }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                />
              </div>

              <div className="mt-6 space-y-4 border-t border-neutral-200 pt-5">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-neutral-900">
                    S/ {totals.subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Descuento
                  </span>

                  <span className="font-medium text-neutral-900">
                    - S/ {totals.discount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">
                    Impuesto ({(taxRate * 100).toFixed(0)}%)
                  </span>

                  <span className="font-medium text-neutral-900">
                    S/ {totals.tax.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-neutral-200 pt-5">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-medium text-neutral-600">
                    Total
                  </span>

                  <span className="text-2xl font-semibold text-neutral-950">
                    S/ {totals.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* PAGO */}
              <div className="mt-6 border-t border-neutral-200 pt-5">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Pago
                </h3>

                <div className="mt-4">
                  <label
                    htmlFor="paymentMethod"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
                    Método de pago
                  </label>

                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value as PaymentMethod,
                      )
                    }
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
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

                <div className="mt-4">
                  <label
                    htmlFor="paymentAmount"
                    className="mb-2 block text-sm font-medium text-neutral-700"
                  >
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
                        Number(event.target.value),
                      )
                    }
                    className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                  />

                  {paymentAmount > totals.total &&
                    totals.total > 0 && (
                      <div className="mt-3 rounded-lg bg-neutral-100 px-3 py-2">
                        <p className="text-sm text-neutral-600">
                          Vuelto
                        </p>

                        <p className="font-semibold text-neutral-900">
                          S/{" "}
                          {(
                            paymentAmount - totals.total
                          ).toFixed(2)}
                        </p>
                      </div>
                    )}

                </div>
              </div>

              <button
                type="button"
                onClick={handleRegisterSale}
                className="mt-6 w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700"
              >
                Registrar venta
              </button>

              <button
                type="button"
                onClick={() => {
                  clearCart();

                  setPaymentMethod("");
                  setPaymentAmount(0);
                  setMessage("Carrito vaciado.");
                }}
                className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
              >
                Vaciar carrito
              </button>
            </section>
          </aside>
        </div>

        {/* HISTORIAL PROVISIONAL DE VENTAS */}
        <section className="mt-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 p-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              Historial de ventas
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Ventas registradas durante esta sesión.
            </p>
          </div>

          {salesHistory.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-neutral-600">
                Todavía no hay ventas registradas
              </p>

              <p className="mt-1 text-sm text-neutral-400">
                Las ventas confirmadas aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-neutral-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <th className="px-6 py-3">
                      Venta
                    </th>

                    <th className="px-6 py-3">
                      Fecha
                    </th>

                    <th className="px-6 py-3">
                      Cliente
                    </th>

                    <th className="px-6 py-3">
                      Productos
                    </th>

                    <th className="px-6 py-3">
                      Pago
                    </th>

                    <th className="px-6 py-3">
                      Estado
                    </th>

                    <th className="px-6 py-3 text-right">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100">
                  {salesHistory.map((sale) => (
                    <tr
                      key={sale.id}
                      className="text-sm text-neutral-700"
                    >
                      <td className="px-6 py-4 font-medium text-neutral-900">
                        #{sale.id}
                      </td>

                      <td className="px-6 py-4">
                        {new Date(
                          sale.date,
                        ).toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        {sale.customer.name}
                      </td>

                      <td className="px-6 py-4">
                        {sale.details.reduce(
                          (total, detail) =>
                            total + detail.quantity,
                          0,
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {sale.payment?.method ?? "Sin pago"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                          {sale.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-neutral-900">
                        S/ {sale.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* MENSAJE DEL SISTEMA */}
        {message && (
          <div className="mt-6 rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-neutral-700">
              {message}
            </p>
          </div>
        )}
      </div>
    </main>
    </div>
  );
};