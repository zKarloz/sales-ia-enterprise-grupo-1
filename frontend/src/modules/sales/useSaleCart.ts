import { useMemo, useState } from "react";

import type { SaleItem } from "../../types/sale";

import {
    calculateSaleTotals,
    createSaleItem,
    validateProductQuantity,
} from "./salesCalculations";

import type { SaleProduct } from "./salesCalculations";

/*
 * Valores provisionales del módulo.
 *
 * Posteriormente podrán venir desde configuración
 * o desde el backend.
 */
const DEFAULT_TAX_RATE = 0.18;
const DEFAULT_DISCOUNT_RATE = 0;

/*
 * Hook responsable del carrito de ventas.
 *
 * Mantiene separada la lógica comercial
 * de la interfaz de SaleForm.tsx.
 */
export function useSaleCart() {
    const [items, setItems] = useState<SaleItem[]>([]);

    const [discountRate, setDiscountRateState] =
        useState(DEFAULT_DISCOUNT_RATE);

    /*
     * Agrega un producto al carrito.
     *
     * Si el producto ya existe, aumenta su cantidad.
     */
    function addProduct(
        product: SaleProduct,
        quantity: number,
    ): boolean {
        if (!validateProductQuantity(product, quantity)) {
            return false;
        }

        const existingItem = items.find(
            (item) => item.productId === product.id,
        );

        if (existingItem) {
            const newQuantity =
                existingItem.quantity + quantity;

            if (
                !validateProductQuantity(
                    product,
                    newQuantity,
                )
            ) {
                return false;
            }

            setItems((currentItems) =>
                currentItems.map((item) =>
                    item.productId === product.id
                        ? createSaleItem(
                            product,
                            newQuantity,
                        )
                        : item,
                ),
            );

            return true;
        }

        const newItem = createSaleItem(
            product,
            quantity,
        );

        setItems((currentItems) => [
            ...currentItems,
            newItem,
        ]);

        return true;
    }

    /*
     * Modifica la cantidad de un producto
     * que ya se encuentra en el carrito.
     */
    function updateProductQuantity(
        product: SaleProduct,
        quantity: number,
    ): boolean {
        if (!validateProductQuantity(product, quantity)) {
            return false;
        }

        const exists = items.some(
            (item) => item.productId === product.id,
        );

        if (!exists) {
            return false;
        }

        setItems((currentItems) =>
            currentItems.map((item) =>
                item.productId === product.id
                    ? createSaleItem(product, quantity)
                    : item,
            ),
        );

        return true;
    }

    /*
     * Elimina completamente un producto del carrito.
     */
    function removeProduct(productId: number) {
        setItems((currentItems) =>
            currentItems.filter(
                (item) => item.productId !== productId,
            ),
        );
    }

    /*
     * Valida y actualiza el porcentaje de descuento.
     *
     * El valor debe estar entre:
     * 0 = 0%
     * 1 = 100%
     */
    function setDiscountRate(
        newRate: number,
    ): boolean {
        if (
            !Number.isFinite(newRate) ||
            newRate < 0 ||
            newRate > 1
        ) {
            return false;
        }

        setDiscountRateState(newRate);

        return true;
    }

    /*
     * Limpia completamente el carrito.
     */
    function clearCart() {
        setItems([]);
        setDiscountRateState(DEFAULT_DISCOUNT_RATE);
    }

    /*
     * Recalcula automáticamente los importes cuando
     * cambian los productos o el descuento.
     */
    const totals = useMemo(() => {
        return calculateSaleTotals(
            items,
            discountRate,
            DEFAULT_TAX_RATE,
        );
    }, [items, discountRate]);

    return {
        items,
        discountRate,
        taxRate: DEFAULT_TAX_RATE,
        totals,

        addProduct,
        updateProductQuantity,
        removeProduct,
        clearCart,
        setDiscountRate,
    };
}