import type { SaleItem } from "../../types/sale";

/*
 * Producto mínimo que necesita el módulo de ventas.
 *
 * Lo definimos aquí de forma estructural para no duplicar
 * todavía el tipo Product global del proyecto.
 *
 * Cuando integremos los productos reales, cualquier objeto
 * que tenga id, name, price y stock podrá utilizarse aquí.
 */
export interface SaleProduct {
    id: number;
    name: string;
    price: number;
    stock: number;
}

/*
 * Redondea importes monetarios a dos decimales.
 */
export function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}

/*
 * Comprueba que la cantidad solicitada sea válida.
 *
 * Reglas provisionales:
 * - Debe ser un número entero.
 * - Debe ser mayor que cero.
 * - No puede superar el stock disponible.
 */
export function validateProductQuantity(
    product: SaleProduct,
    quantity: number,
): boolean {
    if (!Number.isInteger(quantity)) {
        return false;
    }

    if (quantity <= 0) {
        return false;
    }

    if (quantity > product.stock) {
        return false;
    }

    return true;
}

/*
 * Convierte un producto seleccionado en una fila
 * del detalle de venta.
 */
export function createSaleItem(
    product: SaleProduct,
    quantity: number,
): SaleItem {
    return {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        subtotal: roundMoney(product.price * quantity),
    };
}

/*
 * Suma los subtotales de todos los productos del carrito.
 */
export function calculateSubtotal(
    items: SaleItem[],
): number {
    const subtotal = items.reduce(
        (sum, item) => sum + item.subtotal,
        0,
    );

    return roundMoney(subtotal);
}

/*
 * Calcula el descuento.
 *
 * discountRate utiliza formato decimal:
 * 10% = 0.10
 */
export function calculateDiscount(
    subtotal: number,
    discountRate: number,
): number {
    return roundMoney(subtotal * discountRate);
}

/*
 * Calcula el impuesto sobre el importe resultante
 * después del descuento.
 */
export function calculateTax(
    subtotal: number,
    discount: number,
    taxRate: number,
): number {
    const taxableAmount = subtotal - discount;

    return roundMoney(taxableAmount * taxRate);
}

/*
 * Calcula todos los importes principales de la venta.
 */
export function calculateSaleTotals(
    items: SaleItem[],
    discountRate: number,
    taxRate: number,
) {
    const subtotal = calculateSubtotal(items);

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
}