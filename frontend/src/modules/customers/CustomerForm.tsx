import { useState } from "react";

import Button from "../../components/Button";

import type { CustomerCreate } from "../../types/customer";


interface CustomerFormProps {
  onSubmit: (customer: CustomerCreate) => void;
  onCancel: () => void;
}


export default function CustomerForm({
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");


  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    // El nombre es el único dato obligatorio del formulario.
    if (!fullName.trim()) {
      return;
    }

    onSubmit({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
    });
  }


  return (
    <form
      className="customer-form"
      onSubmit={handleSubmit}
    >
      <div className="customer-form__header">
        <div>
          <span>Registro</span>
          <h2>Nuevo cliente</h2>
        </div>
      </div>

      <div className="customer-form__grid">
        <label>
          Nombre / Razón social
          <input
            value={fullName}
            onChange={(event) =>
              setFullName(event.target.value)
            }
            placeholder="Ej. Empresa Andina SAC"
            required
          />
        </label>

        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="correo@empresa.com"
          />
        </label>

        <label>
          Teléfono
          <input
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value)
            }
            placeholder="999 999 999"
          />
        </label>

        <label>
          Dirección
          <input
            value={address}
            onChange={(event) =>
              setAddress(event.target.value)
            }
            placeholder="Ej. Av. Arequipa 1234"
          />
        </label>
      </div>

      <div className="customer-form__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancelar
        </Button>

        <Button type="submit">
          Guardar cliente
        </Button>
      </div>
    </form>
  );
}