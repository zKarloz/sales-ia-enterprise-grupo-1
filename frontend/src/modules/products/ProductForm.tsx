import { useState } from "react";
import Button from "../../components/Button";
import type { Product } from "../../types/product";

interface ProductFormProps {
  categories: string[];
  onSubmit: (product: Omit<Product, "id">) => void;
  onCancel: () => void;
}

export default function ProductForm({
  categories,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (
      !name.trim() ||
      !price ||
      numericPrice < 0 ||
      !stock ||
      numericStock < 0
    ) {
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: numericPrice,
      stock: numericStock,
      categoryId: undefined,
      categoryName: category || "Sin categoría",
      status: numericStock > 0 ? "active" : "inactive",
    });
  }

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <div className="customer-form__header">
        <div>
          <span>Registro</span>
          <h2>Nuevo producto</h2>
        </div>
      </div>

      <div className="customer-form__grid">
        <label>
          Nombre del producto
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Laptop empresarial"
            required
          />
        </label>

        <label>
          Categoría
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">Seleccionar categoría</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
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
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
            required
          />
        </label>

        <label>
          Stock
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            placeholder="0"
            required
          />
        </label>

        <label className="form-field--full">
          Descripción
          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Descripción del producto"
            rows={3}
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