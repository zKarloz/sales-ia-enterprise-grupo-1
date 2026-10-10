import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
  Category,
} from "../../types/category";

import type {
  Product,
  ProductCreate,
} from "../../types/product";


interface ProductFormProps {
  categories: Category[];
  initialProduct?: Product | null;

  onSubmit: (
    product: ProductCreate,
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


export default function ProductForm({
  categories,
  initialProduct = null,
  onSubmit,
  onCancel,
  submitting = false,
}: ProductFormProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const editing = initialProduct !== null;


  useEffect(() => {
    setSku(initialProduct?.sku ?? "");
    setName(initialProduct?.name ?? "");
    setPrice(initialProduct?.price ?? "");
    setCategoryId(
      initialProduct
        ? String(initialProduct.category_id)
        : "",
    );
  }, [initialProduct]);


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const numericPrice = Number(price);
    const numericCategoryId = Number(categoryId);

    if (
      !sku.trim() ||
      !name.trim() ||
      !categoryId ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0 ||
      !Number.isInteger(numericCategoryId) ||
      numericCategoryId <= 0
    ) {
      return;
    }

    await onSubmit({
      category_id: numericCategoryId,
      sku: sku.trim(),
      name: name.trim(),
      price: numericPrice,
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
          {editing ? "Editar producto" : "Nuevo producto"}
        </h2>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {editing
            ? "Actualiza los datos comerciales del producto. El stock se administra desde Inventario/Kardex."
            : "Registra los datos comerciales del producto. Se creará con stock 0."}
        </p>
      </header>

      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="product-sku"
              className={labelClasses}
            >
              SKU
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="product-sku"
              value={sku}
              onChange={(event) =>
                setSku(event.target.value)
              }
              placeholder="Ej. LAP-001"
              required
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="product-name"
              className={labelClasses}
            >
              Nombre del producto
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="product-name"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ej. Laptop empresarial"
              required
              disabled={submitting}
              className={inputClasses}
            />
          </div>

          <div>
            <label
              htmlFor="product-category"
              className={labelClasses}
            >
              Categoría
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="product-category"
              value={categoryId}
              onChange={(event) =>
                setCategoryId(event.target.value)
              }
              required
              disabled={
                submitting ||
                categories.length === 0
              }
              className={inputClasses}
            >
              <option value="">
                Seleccionar categoría
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-price"
              className={labelClasses}
            >
              Precio
              <span className="ml-1 text-red-500">*</span>
            </label>

            <div className="relative">
              <span
                className="
                  pointer-events-none
                  absolute
                  left-3.5
                  top-1/2
                  -translate-y-1/2
                  text-sm
                  font-medium
                  text-slate-400
                  dark:text-slate-500
                "
              >
                S/
              </span>

              <input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                placeholder="0.00"
                required
                disabled={submitting}
                className={`${inputClasses} pl-10`}
              />
            </div>
          </div>
        </div>

        <div
          className="
            mt-5
            rounded-2xl
            border
            border-cyan-200
            bg-cyan-50
            p-4
            dark:border-cyan-900/60
            dark:bg-cyan-950/20
          "
        >
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Control de inventario
          </p>

          {editing ? (
            <>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Stock actual:{" "}
                <span className="font-bold">
                  {initialProduct.stock}
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Para aumentar o disminuir existencias utiliza el módulo
                Inventario/Kardex. El stock no puede modificarse desde
                mantenimiento de productos.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              El producto se registrará con{" "}
              <span className="font-bold">
                stock 0
              </span>
              . Para ingresar existencias registra posteriormente una
              entrada desde Inventario/Kardex.
            </p>
          )}
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
            : editing
              ? "Guardar cambios"
              : "Guardar producto"}
        </Button>
      </footer>
    </form>
  );
}