"""Generación de archivos CSV para reportes F12."""

import csv
from io import StringIO
from decimal import Decimal

from app.schemas.report import (
    SalesReportResponse,
    InventoryReportResponse,
    CustomerReportResponse,
)


SALES_COLUMNS = [
    "ID Venta",
    "Fecha",
    "ID Cliente",
    "Cliente",
    "ID Vendedor",
    "Vendedor",
    "ID Sucursal",
    "Sucursal",
    "Subtotal",
    "Descuento",
    "Impuesto",
    "Total",
    "Metodo de pago",
]



def _safe_csv_value(value: object) -> str:
    """Convierte valores CSV y neutraliza fórmulas en texto."""

    if value is None:
        return ""

    # Conserva valores numéricos reales, incluidos negativos.
    # bool se comprueba antes porque hereda de int.
    if isinstance(value, bool):
        return str(value)

    if isinstance(value, (int, float, Decimal)):
        return str(value)

    text = str(value)

    # Protege únicamente cadenas de texto no confiables.
    if text.lstrip().startswith(("=", "+", "-", "@")):
        return "'" + text

    return text



def build_sales_csv(
    report: SalesReportResponse,
) -> bytes:
    """Genera un CSV UTF-8 de las ventas del reporte."""

    output = StringIO(newline="")

    writer = csv.writer(output)

    writer.writerow(SALES_COLUMNS)

    for item in report.items:
        writer.writerow([
            _safe_csv_value(item.sale_id),
            (
                item.created_at.isoformat()
                if item.created_at is not None
                else ""
            ),
            _safe_csv_value(item.customer_id),
            _safe_csv_value(item.customer_name),
            _safe_csv_value(item.seller_id),
            _safe_csv_value(item.seller_name),
            _safe_csv_value(item.branch_id),
            _safe_csv_value(item.branch_name),
            _safe_csv_value(item.subtotal_amount),
            _safe_csv_value(item.discount_amount),
            _safe_csv_value(item.tax_amount),
            _safe_csv_value(item.total_amount),
            _safe_csv_value(item.payment_method),
        ])

    return output.getvalue().encode("utf-8-sig")

INVENTORY_PRODUCT_COLUMNS = [
    "ID Producto",
    "SKU",
    "Producto",
    "ID Categoria",
    "Categoria",
    "Stock actual",
    "Precio unitario",
    "Valor referencial",
    "Activo",
    "Stock bajo",
]


INVENTORY_MOVEMENT_COLUMNS = [
    "ID Movimiento",
    "Fecha",
    "ID Producto",
    "Producto",
    "Tipo movimiento",
    "Cantidad",
    "Stock anterior",
    "Stock posterior",
    "ID Proveedor",
    "Motivo",
]

def build_inventory_products_csv(
    report: InventoryReportResponse,
) -> bytes:
    """Exporta las existencias actuales a CSV."""

    output = StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow(INVENTORY_PRODUCT_COLUMNS)

    for item in report.products:
        writer.writerow([
            _safe_csv_value(item.product_id),
            _safe_csv_value(item.sku),
            _safe_csv_value(item.product_name),
            _safe_csv_value(item.category_id),
            _safe_csv_value(item.category_name),
            _safe_csv_value(item.stock),
            _safe_csv_value(item.unit_price),
            _safe_csv_value(item.reference_value),
            _safe_csv_value(item.is_active),
            _safe_csv_value(item.low_stock),
        ])

    return output.getvalue().encode("utf-8-sig")


def build_inventory_movements_csv(
    report: InventoryReportResponse,
) -> bytes:
    """Exporta los movimientos históricos a CSV."""

    output = StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow(INVENTORY_MOVEMENT_COLUMNS)

    for item in report.movements:
        writer.writerow([
            _safe_csv_value(item.movement_id),
            (
                item.created_at.isoformat()
                if item.created_at is not None
                else ""
            ),
            _safe_csv_value(item.product_id),
            _safe_csv_value(item.product_name),
            _safe_csv_value(item.movement_type),
            _safe_csv_value(item.quantity),
            _safe_csv_value(item.stock_before),
            _safe_csv_value(item.stock_after),
            _safe_csv_value(item.supplier_id),
            _safe_csv_value(item.reason),
        ])

    return output.getvalue().encode("utf-8-sig")

CUSTOMER_COLUMNS = [
    "ID Cliente",
    "Cliente",
    "Tipo documento",
    "Numero documento",
    "Correo",
    "Telefono",
    "Activo",
    "Total pedidos",
    "Total gastado",
    "Ticket promedio",
    "Ultima compra",
]


def build_customers_csv(
    report: CustomerReportResponse,
) -> bytes:
    """Exporta el reporte de clientes a CSV UTF-8."""

    output = StringIO(newline="")
    writer = csv.writer(output)

    writer.writerow(CUSTOMER_COLUMNS)

    for item in report.items:
        writer.writerow([
            _safe_csv_value(item.customer_id),
            _safe_csv_value(item.customer_name),
            _safe_csv_value(item.document_type),
            _safe_csv_value(item.document_number),
            _safe_csv_value(item.email),
            _safe_csv_value(item.phone),
            _safe_csv_value(item.is_active),
            _safe_csv_value(item.total_orders),
            _safe_csv_value(item.total_spent),
            _safe_csv_value(item.average_ticket),
            (
                item.last_purchase_at.isoformat()
                if item.last_purchase_at is not None
                else ""
            ),
        ])

    return output.getvalue().encode("utf-8-sig")
