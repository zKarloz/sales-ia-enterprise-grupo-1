from getpass import getpass

from sqlalchemy import func, select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def main():
    email = input(
        "Correo del usuario: "
    ).strip().lower()

    password = getpass(
        "Nueva contrasena: "
    )

    confirmation = getpass(
        "Repite la contrasena: "
    )

    if password != confirmation:
        print("Las contrasenas no coinciden.")
        return

    if len(password) < 8:
        print(
            "La contrasena debe tener al menos 8 caracteres."
        )
        return

    with SessionLocal() as db:
        user = db.scalar(
            select(User).where(
                func.lower(User.email) == email
            )
        )

        if user is None:
            print("Usuario no encontrado.")
            return

        user.hashed_password = hash_password(password)

        db.commit()

        print(
            f"Contrasena actualizada para {user.full_name}."
        )


if __name__ == "__main__":
    main()