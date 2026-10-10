-- Fase 08.A
-- Agrega la composición comercial de los totales de una venta.
-- Las ventas históricas conservan su importe original y no reciben
-- descuentos ni impuestos de forma retroactiva.

BEGIN;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS subtotal_amount NUMERIC(12, 2);

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC(5, 2) NOT NULL DEFAULT 18;

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Ventas históricas:
-- conservan el total registrado originalmente.
UPDATE sales
SET
    subtotal_amount = total_amount,
    discount_percentage = 0,
    discount_amount = 0,
    tax_percentage = 0,
    tax_amount = 0
WHERE subtotal_amount IS NULL;

ALTER TABLE sales
ALTER COLUMN subtotal_amount SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_subtotal_amount_check'
          AND conrelid = 'sales'::regclass
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_subtotal_amount_check
        CHECK (subtotal_amount >= 0);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_discount_percentage_check'
          AND conrelid = 'sales'::regclass
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_discount_percentage_check
        CHECK (
            discount_percentage >= 0
            AND discount_percentage <= 100
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_discount_amount_check'
          AND conrelid = 'sales'::regclass
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_discount_amount_check
        CHECK (discount_amount >= 0);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_tax_percentage_check'
          AND conrelid = 'sales'::regclass
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_tax_percentage_check
        CHECK (
            tax_percentage >= 0
            AND tax_percentage <= 100
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_tax_amount_check'
          AND conrelid = 'sales'::regclass
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_tax_amount_check
        CHECK (tax_amount >= 0);
    END IF;
END
$$;

-- sales_total_amount_check ya existe en la estructura base.
-- Solo se crea si alguna instalación no lo tuviera.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_total_amount_check'
          AND conrelid = 'sales'::regclass
    ) THEN
        ALTER TABLE sales
        ADD CONSTRAINT sales_total_amount_check
        CHECK (total_amount >= 0);
    END IF;
END
$$;

COMMIT;
