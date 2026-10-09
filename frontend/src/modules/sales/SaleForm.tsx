import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import Button from "../../components/Button";

import {
  getCustomerByDocument,
} from "../../services/customerService";

import type {
  Customer,
  CustomerDocumentType,
} from "../../types/customer";

import type {
  Product,
} from "../../types/product";

import type {
  SaleCreate,
  SaleItemCreate,
} from "../../types/sale";


interface SaleFormProps {
  customers: Customer[];
  products: Product[];
  initialCustomerId?: number | null;

  onSubmit: (
    sale: SaleCreate,
  ) => void | Promise<void>;

  onRegisterCustomer: (
    documentType: CustomerDocumentType,
    documentNumber: string,
  ) => void;

  onCancel: () => void;
  submitting?: boolean;
}


interface FormItem {
  product_id: string;
  quantity: string;
}


type LookupState =
  | "idle"
  | "found"
  | "not-found"
  | "inactive"
  | "error";


const controlClasses = `
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
  focus:border-cyan-500
  focus:ring-4
  focus:ring-cyan-500/10
  disabled:cursor-not-allowed
  disabled:bg-slate-100
  disabled:opacity-70
  dark:border-slate-700
  dark:bg-slate-950
  dark:text-slate-100
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


export default function SaleForm({
  customers,
  products,
  initialCustomerId = null,
  onSubmit,
  onRegisterCustomer,
  onCancel,
  submitting = false,
}: SaleFormProps) {
  const [customerId, setCustomerId] = useState("");
  const [documentType, setDocumentType] =
    useState<CustomerDocumentType>("DNI");
  const [documentNumber, setDocumentNumber] = useState("");
  const [lookupState, setLookupState] =
    useState<LookupState>("idle");
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("EFECTIVO");

  const [items, setItems] = useState<FormItem[]>([
    {
      product_id: "",
      quantity: "1",
    },
  ]);


  useEffect(() => {
    if (!initialCustomerId) {
      return;
    }

    const customer = customers.find(
      (item) => item.id === initialCustomerId,
    );

    if (!customer) {
      return;
    }

    setCustomerId(String(customer.id));
    setDocumentType(
      customer.document_type ?? "DNI",
    );
    setDocumentNumber(
      customer.document_number ?? "",
    );
    setLookupState("found");
    setLookupMessage(
      `Cliente seleccionado: ${customer.full_name}.`,
    );
  }, [initialCustomerId, customers]);


  const selectedCustomer = useMemo(
    () =>
      customers.find(
        (customer) =>
          customer.id === Number(customerId),
      ) ?? null,
    [customers, customerId],
  );


  const productMap = useMemo(
    () =>
      new Map(
        products.map((product) => [
          product.id,
          product,
        ]),
      ),
    [products],
  );


  const estimatedTotal = useMemo(
    () =>
      items.reduce(
        (total, item) => {
          const product =
            productMap.get(
              Number(item.product_id),
            );

          const quantity =
            Number(item.quantity);

          if (
            !product ||
            !Number.isFinite(quantity) ||
            quantity <= 0
          ) {
            return total;
          }

          return (
            total +
            Number(product.price) *
            quantity
          );
        },
        0,
      ),
    [
      items,
      productMap,
    ],
  );


  function normalizeDocumentNumber(
    value: string,
  ) {
    const trimmed = value.trim();

    if (
      documentType === "DNI" ||
      documentType === "RUC"
    ) {
      return trimmed
        .replace(/\s+/g, "")
        .replace(/-/g, "");
    }

    return trimmed.toUpperCase();
  }


  async function handleCustomerLookup() {
    const normalized =
      normalizeDocumentNumber(
        documentNumber,
      );

    setLookupState("idle");
    setLookupMessage("");

    if (!normalized) {
      setLookupState("error");
      setLookupMessage(
        "Ingresa un número de documento para buscar.",
      );
      return;
    }

    if (
      documentType === "DNI" &&
      !/^\d{8}$/.test(normalized)
    ) {
      setLookupState("error");
      setLookupMessage(
        "El DNI debe tener 8 dígitos.",
      );
      return;
    }

    if (
      documentType === "RUC" &&
      !/^\d{11}$/.test(normalized)
    ) {
      setLookupState("error");
      setLookupMessage(
        "El RUC debe tener 11 dígitos.",
      );
      return;
    }

    try {
      setLookupLoading(true);

      const customer =
        await getCustomerByDocument(
          normalized,
        );

      if (!customer) {
        setCustomerId("");
        setLookupState("not-found");
        setLookupMessage(
          "El cliente no está registrado en SalesIA.",
        );
        return;
      }

      if (!customer.is_active) {
        setCustomerId("");
        setLookupState("inactive");
        setLookupMessage(
          `El cliente ${customer.full_name} existe, pero se encuentra inactivo. Reactívalo desde Clientes.`,
        );
        return;
      }

      setCustomerId(
        String(customer.id),
      );
      setDocumentType(
        customer.document_type ?? documentType,
      );
      setDocumentNumber(
        customer.document_number ?? normalized,
      );
      setLookupState("found");
      setLookupMessage(
        `Cliente encontrado: ${customer.full_name}.`,
      );
    } catch (error) {
      setCustomerId("");
      setLookupState("error");
      setLookupMessage(
        error instanceof Error
          ? error.message
          : "No se pudo buscar el cliente.",
      );
    } finally {
      setLookupLoading(false);
    }
  }


  function handleManualCustomerSelection(
    value: string,
  ) {
    setCustomerId(value);
    setLookupState("idle");
    setLookupMessage("");

    const customer = customers.find(
      (item) => item.id === Number(value),
    );

    if (customer) {
      setDocumentType(
        customer.document_type ?? "DNI",
      );
      setDocumentNumber(
        customer.document_number ?? "",
      );
    }
  }


  function updateItem(
    index: number,
    field: keyof FormItem,
    value: string,
  ) {
    setItems((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
              ...item,
              [field]: value,
            }
            : item,
      ),
    );
  }


  function addItem() {
    setItems((current) => [
      ...current,
      {
        product_id: "",
        quantity: "1",
      },
    ]);
  }


  function removeItem(
    index: number,
  ) {
    setItems((current) =>
      current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !customerId ||
      !paymentMethod ||
      items.length === 0
    ) {
      return;
    }

    const parsedItems:
      SaleItemCreate[] =
      items.map((item) => ({
        product_id:
          Number(item.product_id),

        quantity:
          Number(item.quantity),
      }));

    const validItems =
      parsedItems.every(
        (item) =>
          item.product_id > 0 &&
          item.quantity > 0,
      );

    if (!validItems) {
      return;
    }

    await onSubmit({
      customer_id:
        Number(customerId),

      payment_method:
        paymentMethod,

      items:
        parsedItems,
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
          Operación comercial
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
          Nueva venta
        </h2>

        <p
          className="
            mt-1.5
            text-sm
            text-slate-500
            dark:text-slate-400
          "
        >
          Identifica al cliente, selecciona el método de pago
          y agrega los productos de la operación.
        </p>
      </header>

      <div className="space-y-7 p-5 sm:p-6">
        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-slate-50/60
            p-4
            dark:border-slate-800
            dark:bg-slate-950/30
          "
        >
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Identificación del cliente
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Busca primero por DNI, RUC u otro documento registrado.
            </p>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              lg:grid-cols-[180px_minmax(0,1fr)_auto]
              lg:items-end
            "
          >
            <div>
              <label htmlFor="sale-document-type" className={labelClasses}>
                Tipo
              </label>

              <select
                id="sale-document-type"
                value={documentType}
                onChange={(event) => {
                  setDocumentType(
                    event.target.value as CustomerDocumentType,
                  );
                  setLookupState("idle");
                  setLookupMessage("");
                }}
                disabled={submitting || lookupLoading}
                className={controlClasses}
              >
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">Carné de extranjería</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label htmlFor="sale-document-number" className={labelClasses}>
                Número de documento
              </label>

              <input
                id="sale-document-number"
                value={documentNumber}
                onChange={(event) => {
                  setDocumentNumber(event.target.value);
                  setLookupState("idle");
                  setLookupMessage("");
                }}
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
                disabled={submitting || lookupLoading}
                className={controlClasses}
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={handleCustomerLookup}
              disabled={submitting || lookupLoading}
            >
              {lookupLoading
                ? "Buscando..."
                : "Buscar cliente"}
            </Button>
          </div>

          {lookupMessage && (
            <div
              className={`
                mt-4
                rounded-xl
                border
                px-4
                py-3
                text-sm
                ${lookupState === "found"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300"
                  : lookupState === "not-found"
                    ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
                    : "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
                }
              `}
            >
              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <span>{lookupMessage}</span>

                {lookupState === "not-found" && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      onRegisterCustomer(
                        documentType,
                        normalizeDocumentNumber(documentNumber),
                      )
                    }
                  >
                    Registrar cliente
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-5">
            <label htmlFor="sale-customer" className={labelClasses}>
              Cliente seleccionado
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="sale-customer"
              value={customerId}
              onChange={(event) =>
                handleManualCustomerSelection(
                  event.target.value,
                )
              }
              required
              disabled={submitting}
              className={controlClasses}
            >
              <option value="">
                Seleccionar cliente
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.document_number
                    ? `${customer.document_type ?? "DOC"} ${customer.document_number} — `
                    : ""}
                  {customer.full_name}
                </option>
              ))}
            </select>

            {selectedCustomer && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Cliente activo: {selectedCustomer.full_name}
              </p>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="sale-payment" className={labelClasses}>
              Método de pago
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="sale-payment"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              disabled={submitting}
              className={controlClasses}
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="YAPE">Yape</option>
              <option value="PLIN">Plin</option>
            </select>
          </div>
        </div>

        <div>
          <div
            className="
              mb-4
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Productos
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Agrega los productos incluidos en la venta.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              onClick={addItem}
              disabled={submitting}
            >
              + Agregar producto
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const selectedProduct =
                productMap.get(
                  Number(item.product_id),
                );

              const quantity =
                Number(item.quantity);

              const subtotal =
                selectedProduct && quantity > 0
                  ? Number(selectedProduct.price) * quantity
                  : 0;

              return (
                <div
                  key={index}
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50/70
                    p-4
                    dark:border-slate-800
                    dark:bg-slate-950/40
                  "
                >
                  <div
                    className="
                      mb-4
                      flex
                      items-center
                      justify-between
                      gap-3
                    "
                  >
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Producto {index + 1}
                    </p>

                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeItem(index)}
                        disabled={submitting}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>

                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-4
                      lg:grid-cols-[minmax(0,1fr)_140px_160px]
                      lg:items-end
                    "
                  >
                    <div>
                      <label
                        htmlFor={`sale-product-${index}`}
                        className={labelClasses}
                      >
                        Producto
                      </label>

                      <select
                        id={`sale-product-${index}`}
                        value={item.product_id}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "product_id",
                            event.target.value,
                          )
                        }
                        required
                        disabled={submitting}
                        className={controlClasses}
                      >
                        <option value="">
                          Seleccionar producto
                        </option>

                        {products.map((product) => (
                          <option
                            key={product.id}
                            value={product.id}
                            disabled={product.stock === 0}
                          >
                            {product.name} — Stock: {product.stock} — S/{" "}
                            {Number(product.price).toFixed(2)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`sale-quantity-${index}`}
                        className={labelClasses}
                      >
                        Cantidad
                      </label>

                      <input
                        id={`sale-quantity-${index}`}
                        type="number"
                        min="1"
                        max={selectedProduct?.stock}
                        step="1"
                        value={item.quantity}
                        onChange={(event) =>
                          updateItem(
                            index,
                            "quantity",
                            event.target.value,
                          )
                        }
                        required
                        disabled={submitting}
                        className={controlClasses}
                      />
                    </div>

                    <div>
                      <span className={labelClasses}>
                        Subtotal estimado
                      </span>

                      <div
                        className="
                          flex
                          h-11
                          items-center
                          rounded-xl
                          border
                          border-slate-200
                          bg-white
                          px-3.5
                          text-sm
                          font-bold
                          text-slate-900
                          dark:border-slate-700
                          dark:bg-slate-900
                          dark:text-slate-100
                        "
                      >
                        S/{" "}
                        {subtotal.toLocaleString(
                          "es-PE",
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedProduct && (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Stock disponible:{" "}
                      <span className="font-semibold">
                        {selectedProduct.stock}
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="
            flex
            flex-col
            gap-2
            rounded-2xl
            border
            border-cyan-200
            bg-cyan-50
            p-4
            sm:flex-row
            sm:items-center
            sm:justify-between
            dark:border-cyan-900/60
            dark:bg-cyan-950/20
          "
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-cyan-700 dark:text-cyan-400">
              Total estimado
            </p>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              El monto definitivo se calcula y valida en el servidor.
            </p>
          </div>

          <p className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            S/{" "}
            {estimatedTotal.toLocaleString(
              "es-PE",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          </p>
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
            ? "Registrando..."
            : "Registrar venta"}
        </Button>
      </footer>
    </form>
  );
}
