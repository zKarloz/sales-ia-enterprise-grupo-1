import { useState } from "react";

import Button from "../../components/Button";

import type { Category } from "../../types/category";
import type { ProductCreate } from "../../types/product";


interface ProductFormProps {
  categories: Category[];
  onSubmit: (product: ProductCreate) => void;
  onCancel: () => void;
}


export default function ProductForm({
  categories,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState("");


  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const numericPrice = Number(price);
    const numericStock = Number(stock);
    const numericCategoryId = Number(categoryId);

    if (
      !sku.trim() ||
      !name.trim() ||
      !categoryId ||
      numericPrice < 0 ||
      numericStock < 0
    ) {
      return;
    }

    // El backend valida también categoría, SKU y valores.
    onSubmit({
      category_id: numericCategoryId,
      sku: sku.trim(),
      name: name.trim(),
      price: numericPrice,
      stock: numericStock,
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
          <h2>Nuevo producto</h2>
        </div>
      </div>

      <div className="customer-form__grid">
        <label>
          SKU
          <input
            value={sku}
            onChange={(event) =>
              setSku(event.target.value)
            }
            placeholder="Ej. LAP-001"
            required
          />
        </label>

        <label>
          Nombre del producto
          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Ej. Laptop empresarial"
            required
          />
        </label>

        <label>
          Categoría
          <select
            value={categoryId}
            onChange={(event) =>
              setCategoryId(event.target.value)
            }
            required
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
        </label>

        <label>
          Precio
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(event) =>
              setPrice(event.target.value)
            }
            placeholder="0.00"
            required
          />
        </label>

        <label>
          Stock inicial
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(event) =>
              setStock(event.target.value)
            }
            required
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
          Guardar producto
        </Button>
      </div>
    </form>
  );
}