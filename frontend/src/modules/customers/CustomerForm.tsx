import { useState } from "react";
import Button from "../../components/Button";
import type { Customer } from "../../types/customer";

interface CustomerFormProps {
  onSubmit: (customer: Omit<Customer, "id">) => void;
  onCancel: () => void;
}

export default function CustomerForm({
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      document: document.trim(),
      status: "active",
    });
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
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
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Empresa Andina SAC"
            required
          />
        </label>

        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@empresa.com"
            required
          />
        </label>

        <label>
          Teléfono
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="999 999 999"
          />
        </label>

        <label>
          Documento
          <input
            value={document}
            onChange={(event) => setDocument(event.target.value)}
            placeholder="RUC / DNI"
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