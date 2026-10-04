# Modelos base del dominio comercial y de seguridad.
from app.models.category import Category
from app.models.customer import Customer
from app.models.product import Product
from app.models.role import Role
from app.models.user import User

# Modelos del flujo de ventas e inventario.
from app.models.inventory import InventoryMovement
from app.models.sale import Sale
from app.models.sale_detail import SaleDetail


__all__ = [
    "Role",
    "User",
    "Customer",
    "Category",
    "Product",
    "Sale",
    "SaleDetail",
    "InventoryMovement",
]