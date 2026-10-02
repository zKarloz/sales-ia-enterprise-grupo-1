import type {
  Product,
  SaleDetail,
} from "../types/sales.types";

/*
 * Redondea valores monetarios a dos decimales.
 *
 * JavaScript trabaja con números de punto flotante, por lo que
 * operaciones monetarias pueden producir valores como:
 *
 * 19.9999999997
 *
 * Esta función evita mostrar o almacenar esos resultados imprecisos
 * durante el desarrollo del módulo.
 */
export const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/*
 * Valida si la cantidad solicitada de un producto puede venderse.
 *
 * Reglas provisionales:
 * - La cantidad debe ser mayor que cero.
 * - No se puede superar el stock disponible.
 *
 * Más adelante estas validaciones también deberán existir
 * en el backend, ya que el frontend por sí solo no garantiza
 * la integridad del inventario.
 */
export const validateProductQuantity = (
  product: Product,
  quantity: number,
): boolean => {
  if (quantity <= 0) {
    return false;
  }

  if (quantity > product.stock) {
    return false;
  }

  return true;
};

/*
 * Convierte un producto seleccionado en un detalle de venta.
 *
 * Ejemplo:
 * precio: 100
 * cantidad: 3
 * subtotal: 300
 */
export const createSaleDetail = (
  product: Product,
  quantity: number,
): SaleDetail => {
  return {
    productId: product.id,
    productName: product.name,
    quantity,
    unitPrice: product.price,
    subtotal: roundMoney(product.price * quantity),
  };
};

/*
 * Calcula el subtotal general del carrito sumando
 * los subtotales de todos los productos agregados.
 */
export const calculateSubtotal = (
  details: SaleDetail[],
): number => {
  const subtotal = details.reduce(
    (accumulator, detail) => accumulator + detail.subtotal,
    0,
  );

  return roundMoney(subtotal);
};

/*
 * Calcula el descuento aplicado al subtotal.
 *
 * discountRate se recibe como decimal.
 *
 * Ejemplos:
 * 10% = 0.10
 * 5%  = 0.05
 * 0%  = 0
 */
export const calculateDiscount = (
  subtotal: number,
  discountRate: number,
): number => {
  return roundMoney(subtotal * discountRate);
};

/*
 * Calcula el impuesto.
 *
 * El impuesto se aplica sobre:
 *
 * subtotal - descuento
 *
 * taxRate también se recibe como decimal.
 *
 * No dejamos un porcentaje fijo porque el plan del proyecto
 * indica que los impuestos deben depender de reglas configuradas.
 */
export const calculateTax = (
  subtotal: number,
  discount: number,
  taxRate: number,
): number => {
  const taxableAmount = subtotal - discount;

  return roundMoney(taxableAmount * taxRate);
};

/*
 * Calcula todos los importes principales de una venta.
 *
 * Fórmula:
 *
 * subtotal
 * - descuento
 * + impuesto
 * ----------------
 * total
 */
export const calculateSaleTotals = (
  details: SaleDetail[],
  discountRate: number,
  taxRate: number,
) => {
  const subtotal = calculateSubtotal(details);

  const discount = calculateDiscount(
    subtotal,
    discountRate,
  );

  const tax = calculateTax(
    subtotal,
    discount,
    taxRate,
  );

  const total = roundMoney(
    subtotal - discount + tax,
  );

  return {
    subtotal,
    discount,
    tax,
    total,
  };
};