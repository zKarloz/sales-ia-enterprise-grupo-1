import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
  Customer,
  CustomerCreate,
  CustomerDocumentType,
} from "../../types/customer";


interface CustomerFormProps {
  initialCustomer?: Customer | null;
  initialDocumentType?: CustomerDocumentType | null;
  initialDocumentNumber?: string;

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
  initialCustomer = null,
  initialDocumentType = null,
  initialDocumentNumber = "",
  onSubmit,
  onCancel,
  submitting = false,
}: CustomerFormProps) {
  const [documentType, setDocumentType] =
    useState<CustomerDocumentType>("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const editing = initialCustomer !== null;


  useEffect(() => {
    setDocumentType(
      initialCustomer?.document_type ??
      initialDocumentType ??
      "DNI",
    );
    setDocumentNumber(
      initialCustomer?.document_number ??
      initialDocumentNumber,
    );
    setFullName(initialCustomer?.full_name ?? "");
    setEmail(initialCustomer?.email ?? "");
    setPhone(initialCustomer?.phone ?? "");
    setAddress(initialCustomer?.address ?? "");
    setFormError(null);
  }, [
    initialCustomer,
    initialDocumentType,
    initialDocumentNumber,
  ]);


  function validateDocument(): string | null {
    const number = documentNumber.trim();

    if (!number) {
      return editing
        ? null
        : "Ingresa el número de documento del cliente.";
    }

    if (
      documentType === "DNI" &&
      !/^\d{8}$/.test(number)
    ) {
      return "El DNI debe tener 8 dígitos.";
    }

    if (
      documentType === "RUC" &&
      !/^\d{11}$/.test(number)
    ) {
      return "El RUC debe tener 11 dígitos.";
    }

    if (number.length > 20) {
      return "El documento no puede superar 20 caracteres.";
    }

    return null;
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!fullName.trim()) {
      return;
    }

    const documentError = validateDocument();

    if (documentError) {
      setFormError(documentError);
      return;
    }

    setFormError(null);

    const normalizedDocument = documentNumber.trim();

    await onSubmit({
      document_type: normalizedDocument
        ? documentType
        : null,
      document_number: normalizedDocument || null,
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
          {editing ? "Mantenimiento" : "Registro"}
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
          {editing ? "Editar cliente" : "Nuevo cliente"}
        </h2>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {editing
            ? "Actualiza la identificación y datos comerciales del cliente."
            : "Registra la identificación y datos comerciales del cliente."}
        </p>
      </header>

      <div className="p-5 sm:p-6">
        {formError && (
          <div
            className="
              mb-5
              rounded-xl
              border
              border-red-200
              bg-red-50
              px-4
              py-3
              text-sm
              font-medium
              text-red-700
              dark:border-red-900/60
              dark:bg-red-950/30
              dark:text-red-300
            "
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="customer-document-type" className={labelClasses}>
              Tipo de documento
              {!editing && <span className="ml-1 text-red-500">*</span>}
            </label>

            <select
              id="customer-document-type"
              value={documentType}
              onChange={(event) =>
                setDocumentType(
                  event.target.value as CustomerDocumentType,
                )
              }
              disabled={submitting}
              className={inputClasses}
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">Carné de extranjería</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div>
            <label htmlFor="customer-document-number" className={labelClasses}>
              Número de documento
              {!editing && <span className="ml-1 text-red-500">*</span>}
            </label>

            <input
              id="customer-document-number"
              value={documentNumber}
              onChange={(event) =>
                setDocumentNumber(event.target.value)
              }
              placeholder={
                documentType === "RUC"
                  ? "20123456789"
                  : documentType === "DNI"
                    ? "12345678"
                    : "Número de documento"
              }
              inputMode={
                documentType === "DNI" || documentType === "RUC"
                  ? "numeric"
                  : undefined
              }
              maxLength={20}
              required={!editing}
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="customer-name" className={labelClasses}>
              Nombre / Razón social
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="customer-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Ej. Empresa Andina SAC"
              required
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="customer-email" className={labelClasses}>
              Correo electrónico
            </label>

            <input
              id="customer-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@empresa.com"
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="customer-phone" className={labelClasses}>
              Teléfono
            </label>

            <input
              id="customer-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="999 999 999"
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="customer-address" className={labelClasses}>
              Dirección
            </label>

            <input
              id="customer-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
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

        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : editing
              ? "Guardar cambios"
              : "Guardar cliente"}
        </Button>
      </footer>
    </form>
  );
}
