from getpass import getpass

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.role import Role
from app.models.user import User


def main():
    full_name = input(
        "Nombre completo: "
    ).strip()

    email = input(
        "Correo: "
    ).strip().lower()

    role_name = input(
        "Rol: "
    ).strip()

    password = getpass(
        "Contrasena: "
    )

    confirmation = getpass(
        "Repite la contrasena: "
    )

    if not full_name or not email or not role_name:
        print("Nombre, correo y rol son obligatorios.")
        return

    if password != confirmation:
        print("Las contrasenas no coinciden.")
        return

    if len(password) < 8:
        print(
            "La contrasena debe tener al menos 8 caracteres."
        )
        return

    with SessionLocal() as db:
        existing_user = db.scalar(
            select(User).where(
                func.lower(User.email) == email
            )
        )

        if existing_user is not None:
            print("Ya existe un usuario con ese correo.")
            return

        role = db.scalar(
            select(Role).where(
                func.lower(Role.name)
                == role_name.lower()
            )
        )

        if role is None:
            print("Rol no encontrado.")
            return

        user = User(
            role_id=role.id,
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            is_active=True,
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print(
            f"Usuario creado: {user.full_name} "
            f"(id={user.id}, rol={role.name})"
        )


if __name__ == "__main__":
    main()