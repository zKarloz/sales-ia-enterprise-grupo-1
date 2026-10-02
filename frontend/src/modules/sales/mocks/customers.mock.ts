import type { Customer } from "../types/sales.types";

// Clientes simulados para desarrollar el módulo de ventas.
//
// Estos datos son temporales.
// Cuando el backend esté disponible serán reemplazados (Por Almenara)
// por información obtenida desde la API de clientes.
export const customersMock: Customer[] = [
  {
    id: 1,
    name: "Distribuidora Lima SAC",
    document: "20123456789",
    email: "ventas@distribuidoralima.com",
  },
  {
    id: 2,
    name: "Comercial Andina EIRL",
    document: "20456789123",
    email: "contacto@comercialandina.com",
  },
  {
    id: 3,
    name: "Carlos Gutierrez",
    document: "72845163",
    email: "carlos.gutierrez@email.com",
  },
];