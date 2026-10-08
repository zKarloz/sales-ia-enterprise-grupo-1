import {
  useState,
  type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
  CustomerCreate,
} from "../../types/customer";


interface CustomerFormProps {
  onSubmit: (
    customer: CustomerCreate,
  ) => void | Promise<void>;

  onCancel: () => void;
  submitting?: boolean;
}


const inputClasses = `
  h-11
  w-full
  rounded-xl
  border
  border-slate-300
  bg-white
  px-3.5
  text-sm
  text-slate-900
  outline-none
  transition
  placeholder:text-slate-400
  focus:border-cyan-500
  focus:ring-4
  focus:ring-cyan-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:opacity-70
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-slate-100
  dark:placeholder:text-slate-600
  dark:disabled:bg-slate-900
`;


const labelClasses = `
  mb-2
  block
  text-sm
  font-semibold
  text-slate-700
  dark:text-slate-200
`;


export default function CustomerForm({
  onSubmit,
  onCancel,
  submitting = false,
}: CustomerFormProps) {
  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    address,
    setAddress,
  ] = useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!fullName.trim()) {
      return;
    }

    await onSubmit({
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
    });
  }


  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={submitting}
      className="
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        shadow-slate-950/[0.03]
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-black/10
      "
    >
      <header
        className="
          border-b
          border-slate-100
          px-5
          py-5
          sm:px-6
          dark:border-slate-800
        "
      >
        <p
          className="
            text-[11px]
            font-bold
            uppercase
            tracking-[0.14em]
            text-cyan-700
            dark:text-cyan-400
          "
        >
          Registro
        </p>

        <h2
          className="
            mt-1
            text-lg
            font-bold
            text-slate-950
            dark:text-white
          "
        >
          Nuevo cliente
        </h2>

        <p
          className="
            mt-1.5
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Registra la información comercial y de
          contacto del cliente.
        </p>
      </header>

      <div className="p-5 sm:p-6">
        <div
          className="
            grid
            grid-cols-1
            gap-5
            md:grid-cols-2
          "
        >
          <div>
            <label
              htmlFor="customer-name"
              className={labelClasses}
            >
              Nombre / Razón social
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="customer-name"
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value,
                )
              }
              placeholder="Ej. Empresa Andina SAC"
              required
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="customer-email"
              className={labelClasses}
            >
              Correo electrónico
            </label>

            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              placeholder="correo@empresa.com"
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="customer-phone"
              className={labelClasses}
            >
              Teléfono
            </label>

            <input
              id="customer-phone"
              value={phone}
              onChange={(event) =>
                setPhone(
                  event.target.value,
                )
              }
              placeholder="999 999 999"
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="customer-address"
              className={labelClasses}
            >
              Dirección
            </label>

            <input
              id="customer-address"
              value={address}
              onChange={(event) =>
                setAddress(
                  event.target.value,
                )
              }
              placeholder="Ej. Av. Arequipa 1234"
              disabled={submitting}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <footer
        className="
          flex
          flex-col-reverse
          gap-3
          border-t
          border-slate-100
          bg-slate-50/60
          px-5
          py-4
          sm:flex-row
          sm:justify-end
          sm:px-6
          dark:border-slate-800
          dark:bg-slate-950/30
        "
      >
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? "Guardando..."
            : "Guardar cliente"}
        </Button>
      </footer>
    </form>
  );
}