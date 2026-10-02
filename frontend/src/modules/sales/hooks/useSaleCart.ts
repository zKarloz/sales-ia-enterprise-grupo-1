import { useMemo, useState } from "react";

import type {
  Product,
  SaleDetail,
} from "../types/sales.types";

import {
  calculateSaleTotals,
  createSaleDetail,
  validateProductQuantity,
} from "../utils/salesCalculations";

// Tasa de impuesto provisional.
//
// Por ahora utilizamos 18% como valor de prueba.
// Más adelante este valor puede venir desde configuración,
// variables de entorno o desde el backend.
const DEFAULT_TAX_RATE = 0.18;

// Inicialmente una venta no tendrá descuento.
const DEFAULT_DISCOUNT_RATE = 0;

/*
 * Hook encargado de administrar el carrito de una venta.
 *
 * Aquí manejaremos:
 * - Productos agregados.
 * - Cantidades.
 * - Eliminación de productos.
 * - Descuentos.
 * - Cálculo automático de totales.
 *
 * La interfaz solamente tendrá que llamar estas funciones.
 */
export const useSaleCart = () => {
  // Lista de productos que actualmente forman parte de la venta.
  const [details, setDetails] = useState<SaleDetail[]>([]);

  // Porcentaje de descuento expresado en formato decimal.
  //
  // Ejemplo:
  // 10% = 0.10
  const [discountRate, setDiscountRate] = useState(
    DEFAULT_DISCOUNT_RATE,
  );

  /*
   * Agrega un producto al carrito.
   *
   * Retorna true si el producto pudo agregarse
   * y false cuando la cantidad no es válida.
   */
  const addProduct = (
  product: Product,
  quantity: number,
): boolean => {
  // Validación inicial:
  // la cantidad debe ser positiva y no superar el stock.
  if (!validateProductQuantity(product, quantity)) {
    return false;
  }

  // Buscamos si el producto ya se encuentra en el carrito.
  const existingDetail = details.find(
    (detail) => detail.productId === product.id,
  );

  /*
   * Si el producto ya existe, calculamos cuál sería
   * la cantidad total después de agregar más unidades.
   */
  if (existingDetail) {
    const newQuantity =
      existingDetail.quantity + quantity;

    // Evitamos superar el stock disponible.
    if (
      !validateProductQuantity(
        product,
        newQuantity,
      )
    ) {
      return false;
    }

    setDetails((currentDetails) =>
      currentDetails.map((detail) =>
        detail.productId === product.id
          ? createSaleDetail(
              product,
              newQuantity,
            )
          : detail,
      ),
    );

    return true;
  }


  
  /*
   * Si el producto todavía no existe en el carrito,
   * simplemente creamos una nueva fila.
   */
  const newDetail = createSaleDetail(
    product,
    quantity,
  );

  setDetails((currentDetails) => [
    ...currentDetails,
    newDetail,
  ]);

  return true;
};

/*
 * Actualiza la cantidad de un producto que ya se encuentra
 * dentro del carrito.
 *
 * La cantidad nueva debe:
 * - Ser mayor que cero.
 * - No superar el stock disponible.
 *
 * Retorna true si pudo actualizarse.
 * Retorna false si la cantidad no es válida.
 */
const updateProductQuantity = (
  product: Product,
  quantity: number,
): boolean => {
  if (!validateProductQuantity(product, quantity)) {
    return false;
  }

  const productExists = details.some(
    (detail) => detail.productId === product.id,
  );

  // Evitamos actualizar un producto inexistente.
  if (!productExists) {
    return false;
  }

  setDetails((currentDetails) =>
    currentDetails.map((detail) =>
      detail.productId === product.id
        ? createSaleDetail(product, quantity)
        : detail,
    ),
  );

  return true;
};

  /*
   * Elimina completamente un producto del carrito.
   */
  const removeProduct = (productId: number) => {
    setDetails((currentDetails) =>
      currentDetails.filter(
        (detail) => detail.productId !== productId,
      ),
    );
  };

  /*
   * Vacía el carrito.
   *
   * Será útil después de registrar correctamente una venta.
   */
  const clearCart = () => {
    setDetails([]);
    setDiscountRate(DEFAULT_DISCOUNT_RATE);
  };

  /*
   * Calculamos los importes automáticamente cada vez que
   * cambian los productos o el porcentaje de descuento.
   *
   * useMemo evita volver a calcularlos innecesariamente
   * en cada renderizado del componente.
   */
  const totals = useMemo(() => {
    return calculateSaleTotals(
      details,
      discountRate,
      DEFAULT_TAX_RATE,
    );
  }, [details, discountRate]);

  /*
   * Todo lo retornado aquí podrá ser utilizado
   * posteriormente desde NewSalePage.tsx.
   */
    return {
    details,
    discountRate,
    taxRate: DEFAULT_TAX_RATE,
    totals,

    addProduct,
    updateProductQuantity,
    removeProduct,
    clearCart,
    setDiscountRate,
    };
};