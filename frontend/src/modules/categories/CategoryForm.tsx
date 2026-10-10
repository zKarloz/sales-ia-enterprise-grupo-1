import {
    useEffect,
    useState,
    type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
    Category,
    CategoryCreate,
} from "../../types/category";

interface CategoryFormProps {
    initialCategory?: Category | null;
    onSubmit: (
        category: CategoryCreate,
    ) => void | Promise<void>;
    onCancel: () => void;
    submitting?: boolean;
}

const inputClasses = `
  h-11 w-full rounded-xl border border-slate-300 bg-white
  px-3.5 text-sm text-slate-900 outline-none transition
  placeholder:text-slate-400 focus:border-cyan-500
  focus:ring-4 focus:ring-cyan-500/10
  disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70
  dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100
  dark:placeholder:text-slate-600 dark:disabled:bg-slate-900
`;

const labelClasses = `
  mb-2 block text-sm font-semibold
  text-slate-700 dark:text-slate-200
`;

export default function CategoryForm({
    initialCategory = null,
    onSubmit,
    onCancel,
    submitting = false,
}: CategoryFormProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const editing = initialCategory !== null;

    useEffect(() => {
        setName(initialCategory?.name ?? "");
        setDescription(initialCategory?.description ?? "");
    }, [initialCategory]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!name.trim()) {
            return;
        }

        await onSubmit({
            name: name.trim(),
            description: description.trim() || null,
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            aria-busy={submitting}
            className="
        overflow-hidden rounded-2xl border border-slate-200
        bg-white shadow-sm shadow-slate-950/[0.03]
        dark:border-slate-800 dark:bg-slate-900
      "
        >
            <header className="border-b border-slate-100 px-5 py-5 sm:px-6 dark:border-slate-800">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-400">
                    {editing ? "Mantenimiento" : "Registro"}
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                    {editing ? "Editar categoría" : "Nueva categoría"}
                </h2>

                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {editing
                        ? "Actualiza el nombre o la descripción de la categoría."
                        : "Registra una categoría para organizar el catálogo de productos."}
                </p>
            </header>

            <div className="p-5 sm:p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div>
                        <label htmlFor="category-name" className={labelClasses}>
                            Nombre
                            <span className="ml-1 text-red-500">*</span>
                        </label>

                        <input
                            id="category-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="Ej. Laptops"
                            required
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>

                    <div>
                        <label htmlFor="category-description" className={labelClasses}>
                            Descripción
                        </label>

                        <input
                            id="category-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Ej. Equipos portátiles empresariales"
                            disabled={submitting}
                            className={inputClasses}
                        />
                    </div>
                </div>
            </div>

            <footer className="
        flex flex-col-reverse gap-3 border-t border-slate-100
        bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6
        dark:border-slate-800 dark:bg-slate-950/30
      ">
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
                            : "Guardar categoría"}
                </Button>
            </footer>
        </form>
    );
}
