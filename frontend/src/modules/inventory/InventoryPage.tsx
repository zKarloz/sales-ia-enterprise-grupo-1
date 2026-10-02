import Card from "../../components/Card";
import PageHeader from "../../components/PageHeader";
import InventoryTable from "./InventoryTable";
import type { Product } from "../../types/product";

const inventoryProducts: Product[] = [
  {
    id: 1,
    name: "Laptop empresarial",
    categoryId: 1,
    categoryName: "Tecnología",
    price: 2500,
    stock: 24,
    status: "active",
  },
  {
    id: 2,
    name: "Monitor 24 pulgadas",
    categoryId: 1,
    categoryName: "Tecnología",
    price: 850,
    stock: 8,
    status: "active",
  },
  {
    id: 3,
    name: "Silla ergonómica",
    categoryId: 2,
    categoryName: "Mobiliario",
    price: 650,
    stock: 0,
    status: "inactive",
  },
  {
    id: 4,
    name: "Teclado mecánico",
    categoryId: 1,
    categoryName: "Tecnología",
    price: 280,
    stock: 15,
    status: "active",
  },
];

export default function InventoryPage() {
  const totalProducts = inventoryProducts.length;

  const totalUnits = inventoryProducts.reduce(
    (total, product) => total + product.stock,
    0,
  );

  const lowStock = inventoryProducts.filter(
    (product) =>
      product.stock > 0 && product.stock <= 10,
  ).length;

  const outOfStock = inventoryProducts.filter(
    (product) => product.stock === 0,
  ).length;

  return (
    <section className="page">
      <PageHeader
        title="Inventario"
        description="Consulta el estado y disponibilidad de los productos."
      />

      <div className="stats-grid">
        <Card title="Productos">
          <div className="stat-value">
            {totalProducts}
          </div>
        </Card>

        <Card title="Unidades disponibles">
          <div className="stat-value">
            {totalUnits}
          </div>
        </Card>

        <Card title="Stock bajo">
          <div className="stat-value">
            {lowStock}
          </div>
        </Card>

        <Card title="Sin stock">
          <div className="stat-value">
            {outOfStock}
          </div>
        </Card>
      </div>

      <Card
        title="Estado del inventario"
        subtitle="Resumen provisional del stock."
      >
        <InventoryTable
          products={inventoryProducts}
        />
      </Card>
    </section>
  );
}