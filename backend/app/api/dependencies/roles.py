from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.api.dependencies.auth import get_current_user
from app.core.roles import ROLE_ADMIN
from app.schemas.auth import CurrentUserResponse


def require_roles(
    *allowed_roles: str,
) -> Callable[..., CurrentUserResponse]:
    """Restringe un endpoint según el rol autenticado."""

    def dependency(
        current_user: CurrentUserResponse = Depends(
            get_current_user,
        ),
    ) -> CurrentUserResponse:
        # El administrador posee acceso total.
        if current_user.role == ROLE_ADMIN:
            return current_user

        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción.",
            )

        return current_user

    return dependency