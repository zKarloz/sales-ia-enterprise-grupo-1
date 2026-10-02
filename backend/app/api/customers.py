from fastapi import APIRouter, HTTPException, Response, status
from pydantic import BaseModel


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


# Modelo provisional que representa los datos
# esperados actualmente por el frontend.
class CustomerData(BaseModel):
    name: str
    email: str
    phone: str | None = None
    document: str | None = None
    status: str
    createdAt: str | None = None


# Base de datos provisional en memoria.
#
# IMPORTANTE:
# Estos datos desaparecen al reiniciar Uvicorn.
customers_mock = [
    {
        "id": 1,
        "name": "Distribuidora Lima SAC",
        "email": "ventas@distribuidoralima.com",
        "phone": "987654321",
        "document": "20123456789",
        "status": "active",
        "createdAt": "2026-10-01",
    },
    {
        "id": 2,
        "name": "Comercial Andina EIRL",
        "email": "contacto@comercialandina.com",
        "phone": "986123456",
        "document": "20456789123",
        "status": "active",
        "createdAt": "2026-10-01",
    },
    {
        "id": 3,
        "name": "Carlos Mendoza",
        "email": "carlos@example.com",
        "phone": "985112233",
        "document": "72845163",
        "status": "active",
        "createdAt": "2026-10-01",
    },
]


@router.get("")
def get_customers():
    """
    Devuelve todos los clientes provisionales.
    """
    return customers_mock


@router.get("/{customer_id}")
def get_customer(customer_id: int):
    """
    Busca un cliente por ID.
    """
    customer = next(
        (
            item
            for item in customers_mock
            if item["id"] == customer_id
        ),
        None,
    )

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Cliente no encontrado.",
        )

    return customer


@router.post("", status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerData):
    """
    Registra un cliente provisionalmente en memoria.
    """

    new_id = (
        max(
            (item["id"] for item in customers_mock),
            default=0,
        )
        + 1
    )

    new_customer = {
        "id": new_id,
        **customer.model_dump(),
    }

    customers_mock.append(new_customer)

    return new_customer


@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    customer: CustomerData,
):
    """
    Actualiza completamente un cliente provisional.
    """

    for index, current_customer in enumerate(
        customers_mock
    ):
        if current_customer["id"] == customer_id:
            updated_customer = {
                "id": customer_id,
                **customer.model_dump(),
            }

            customers_mock[index] = updated_customer

            return updated_customer

    raise HTTPException(
        status_code=404,
        detail="Cliente no encontrado.",
    )


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer(customer_id: int):
    """
    Elimina un cliente provisional.
    """

    for index, customer in enumerate(customers_mock):
        if customer["id"] == customer_id:
            customers_mock.pop(index)

            return Response(
                status_code=status.HTTP_204_NO_CONTENT,
            )

    raise HTTPException(
        status_code=404,
        detail="Cliente no encontrado.",
    )