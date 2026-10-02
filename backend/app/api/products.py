from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# Modelo provisional compatible con Product
# definido actualmente en el frontend.
class ProductData(BaseModel):
    name: str
    description: str | None = None
    price: float
    stock: int
    categoryId: int | None = None
    categoryName: str | None = None
    status: str


# Inventario provisional en memoria.
#
# Al reiniciar Uvicorn estos datos vuelven
# a sus valores iniciales.
products_mock = [
    {
        "id": 1,
        "name": "Laptop Empresarial",
        "description": "Laptop para uso empresarial.",
        "price": 2500.00,
        "stock": 8,
        "categoryId": 1,
        "categoryName": "Computadoras",
        "status": "active",
    },
    {
        "id": 2,
        "name": "Monitor 24 pulgadas",
        "description": "Monitor Full HD de 24 pulgadas.",
        "price": 750.00,
        "stock": 15,
        "categoryId": 2,
        "categoryName": "Monitores",
        "status": "active",
    },
    {
        "id": 3,
        "name": "Teclado Mecánico",
        "description": "Teclado mecánico para escritorio.",
        "price": 180.00,
        "stock": 25,
        "categoryId": 3,
        "categoryName": "Accesorios",
        "status": "active",
    },
    {
        "id": 4,
        "name": "Mouse Inalámbrico",
        "description": "Mouse inalámbrico empresarial.",
        "price": 95.00,
        "stock": 30,
        "categoryId": 3,
        "categoryName": "Accesorios",
        "status": "active",
    },
    {
        "id": 5,
        "name": "Webcam Full HD",
        "description": "Webcam Full HD para videoconferencias.",
        "price": 160.00,
        "stock": 12,
        "categoryId": 3,
        "categoryName": "Accesorios",
        "status": "active",
    },
]


@router.get("")
def get_products():
    """
    Devuelve todos los productos provisionales.
    """
    return products_mock


@router.get("/{product_id}")
def get_product(product_id: int):
    """
    Busca un producto por ID.
    """
    product = next(
        (
            item
            for item in products_mock
            if item["id"] == product_id
        ),
        None,
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado.",
        )

    return product


@router.post("", status_code=status.HTTP_201_CREATED)
def create_product(product: ProductData):
    """
    Registra provisionalmente un producto.
    """

    new_id = (
        max(
            (item["id"] for item in products_mock),
            default=0,
        )
        + 1
    )

    new_product = {
        "id": new_id,
        **product.model_dump(),
    }

    products_mock.append(new_product)

    return new_product


@router.put("/{product_id}")
def update_product(
    product_id: int,
    product: ProductData,
):
    """
    Actualiza un producto provisional.
    """

    for index, current_product in enumerate(
        products_mock
    ):
        if current_product["id"] == product_id:
            updated_product = {
                "id": product_id,
                **product.model_dump(),
            }

            products_mock[index] = updated_product

            return updated_product

    raise HTTPException(
        status_code=404,
        detail="Producto no encontrado.",
    )


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_product(product_id: int):
    """
    Elimina provisionalmente un producto.
    """

    for index, product in enumerate(products_mock):
        if product["id"] == product_id:
            products_mock.pop(index)

            return Response(
                status_code=status.HTTP_204_NO_CONTENT,
            )

    raise HTTPException(
        status_code=404,
        detail="Producto no encontrado.",
    )