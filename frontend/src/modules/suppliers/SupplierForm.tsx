import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
    Supplier,
    SupplierCreate,
} from "../../types/supplier";

interface SupplierFormProps {
    initialSupplier?: Supplier | null;
    onSubmit: (
        supplier: SupplierCreate,
    ) => void | Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
}

const inputClasses = `
  h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5
  text-sm text-slate-900 outline-none transition
  placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4
  focus:ring-cyan-500/10 disabled:cursor-not-allowed
  disabled:bg-slate-100 disabled:opacity-70 dark:border-slate-700
  dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600
  dark:disabled:bg-slate-900
`;

const labelClasses = `
  mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200
`;

export default function SupplierForm({
    initialSupplier = null,
    onSubmit,
    onCancel,
    submitting = false,
}: SupplierFormProps) {
    const [businessName, setBusinessName] = useState("");
    const [ruc, setRuc] = useState("");
    const [contactName, setContactName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const editing = initialSupplier !== null;

    useEffect(() => {
        setBusinessName(initialSupplier?.business_name ?? "");
        setRuc(initialSupplier?.ruc ?? "");
        setContactName(initialSupplier?.contact_name ?? "");
        setEmail(initialSupplier?.email ?? "");
        setPhone(initialSupplier?.phone ?? "");
        setAddress(initialSupplier?.address ?? "");
    }, [initialSupplier]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const normalizedRuc =
            ruc.replace(/\D/g, "");

        if (
            !businessName.trim() ||
            normalizedRuc.length !== 11
        ) {
            return;
        }

        await onSubmit({
            business_name: businessName.trim(),
            ruc: normalizedRuc,
            contact_name: contactName.trim() || null,
            email: email.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null,
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            aria-busy={submitting}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.03] dark:border-slate-800 dark:bg-slate-900"
        >
            <header className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">
                    {editing ? "Mantenimiento" : "Registro"}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                    {editing ? "Editar proveedor" : "Nuevo proveedor"}
                </h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    Gestiona los datos comerciales del proveedor.
                </p>
            </header>

            <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label htmlFor="supplier-name" className={labelClasses}>
                            Razón social <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            id="supplier-name"
                            value={businessName}
                            onChange={(event) => setBusinessName(event.target.value)}
                            placeholder="Ej. Distribuidora Andina SAC"
                            required
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label htmlFor="supplier-ruc" className={labelClasses}>
                            RUC <span className="ml-1 text-red-500">*</span>
                        </label>
                        <input
                            id="supplier-ruc"
                            inputMode="numeric"
                            maxLength={11}
                            value={ruc}
                            onChange={(event) =>
                                setRuc(event.target.value.replace(/\D/g, ""))
                            }
                            placeholder="20123456789"
                            required
                            disabled={submitting}
                            className={inputClasses}
                        />
                        {ruc && ruc.length !== 11 && (
                            <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                                El RUC debe contener 11 dígitos.
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="supplier-contact" className={labelClasses}>
                            Contacto
                        </label>
                        <input
                            id="supplier-contact"
                            value={contactName}
                            onChange={(event) => setContactName(event.target.value)}
                            placeholder="Nombre del contacto"
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label htmlFor="supplier-email" className={labelClasses}>
                            Correo electrónico
                        </label>
                        <input
                            id="supplier-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="ventas@proveedor.com"
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label htmlFor="supplier-phone" className={labelClasses}>
                            Teléfono
                        </label>
                        <input
                            id="supplier-phone"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="999 999 999"
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label htmlFor="supplier-address" className={labelClasses}>
                            Dirección
                        </label>
                        <input
                            id="supplier-address"
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            placeholder="Dirección comercial"
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>
                </div>
            </div>

            <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6 dark:border-slate-800 dark:bg-slate-950/30">
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
                            : "Guardar proveedor"}
                </Button>
            </footer>
        </form>
    );
}
