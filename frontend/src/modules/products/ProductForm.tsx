import {
  useState,
  type FormEvent,
} from "react";

import Button from "../../components/Button";

import type {
  Category,
} from "../../types/category";

import type {
  ProductCreate,
} from "../../types/product";


interface ProductFormProps {
  categories: Category[];

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
  onSubmit,
  onCancel,
  submitting = false,
}: ProductFormProps) {
  const [
    sku,
    setSku,
  ] = useState("");

  const [
    name,
    setName,
  ] = useState("");

  const [
    price,
    setPrice,
  ] = useState("");

  const [
    stock,
    setStock,
  ] = useState("0");

  const [
    categoryId,
    setCategoryId,
  ] = useState("");


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const numericPrice =
      Number(price);

    const numericStock =
      Number(stock);

    const numericCategoryId =
      Number(categoryId);

    if (
      !sku.trim() ||
      !name.trim() ||
      !categoryId ||
      numericPrice < 0 ||
      numericStock < 0
    ) {
      return;
    }

    await onSubmit({
      category_id:
        numericCategoryId,

      sku:
        sku.trim(),

      name:
        name.trim(),

      price:
        numericPrice,

      stock:
        numericStock,
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
          Nuevo producto
        </h2>

        <p
          className="
            mt-1.5
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Registra un producto,
          su categoría, precio y
          stock inicial.
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
              htmlFor="product-sku"
              className={labelClasses}
            >
              SKU
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="product-sku"
              value={sku}
              onChange={(event) =>
                setSku(
                  event.target.value,
                )
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
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="product-name"
              value={name}
              onChange={(event) =>
                setName(
                  event.target.value,
                )
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
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="product-category"
              value={categoryId}
              onChange={(event) =>
                setCategoryId(
                  event.target.value,
                )
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

              {categories.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="product-price"
              className={labelClasses}
            >
              Precio
              <span className="ml-1 text-red-500">
                *
              </span>
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
                  setPrice(
                    event.target.value,
                  )
                }
                placeholder="0.00"
                required
                disabled={submitting}
                className={`
                  ${inputClasses}
                  pl-10
                `}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="product-stock"
              className={labelClasses}
            >
              Stock inicial
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="product-stock"
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(event) =>
                setStock(
                  event.target.value,
                )
              }
              required
              disabled={submitting}
              className={inputClasses}
            />

            <p
              className="
                mt-2
                text-xs
                text-slate-400
                dark:text-slate-500
              "
            >
              Este valor será el stock
              disponible inicial.
            </p>
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
            : "Guardar producto"}
        </Button>
      </footer>
    </form>
  );
}