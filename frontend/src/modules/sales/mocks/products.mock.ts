import type { Product } from "../types/sales.types";

// Productos simulados disponibles para realizar ventas.
//
// El campo "stock" nos permitirá validar provisionalmente
// que no se venda una cantidad superior a la disponible.
export const productsMock: Product[] = [
  {
    id: 1,
    name: "Laptop Empresarial",
    price: 2500.00,
    stock: 8,
  },
  {
    id: 2,
    name: "Monitor 24 pulgadas",
    price: 750.00,
    stock: 15,
  },
  {
    id: 3,
    name: "Teclado Mecánico",
    price: 180.00,
    stock: 25,
  },
  {
    id: 4,
    name: "Mouse Inalámbrico",
    price: 95.00,
    stock: 30,
  },
  {
    id: 5,
    name: "Webcam Full HD",
    price: 160.00,
    stock: 12,
  },
];