-- Fase 10.B.1
-- Incorporación de sucursales para Analytics.
-- Primera etapa compatible con el flujo de ventas existente.

BEGIN;

-- 1. Tabla de sucursales.
CREATE TABLE IF NOT EXISTS public.branches (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT branches_code_not_blank_check
        CHECK (LENGTH(TRIM(code)) > 0),

    CONSTRAINT branches_name_not_blank_check
        CHECK (LENGTH(TRIM(name)) > 0)
);

-- 2. Sucursal inicial para los registros históricos.
INSERT INTO public.branches (
    code,
    name,
    is_active
)
VALUES (
    'PRINCIPAL',
    'Principal',
    TRUE
)
ON CONFLICT (code) DO NOTHING;

-- 3. Incorporar la referencia en ventas.
ALTER TABLE public.sales
ADD COLUMN IF NOT EXISTS branch_id INTEGER;

-- 4. Agregar clave foránea cuando todavía no exista.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'sales_branch_id_fkey'
          AND conrelid = 'public.sales'::regclass
    ) THEN
        ALTER TABLE public.sales
        ADD CONSTRAINT sales_branch_id_fkey
        FOREIGN KEY (branch_id)
        REFERENCES public.branches(id)
        ON DELETE RESTRICT;
    END IF;
END
$$;

-- 5. Asociar las ventas históricas a la sucursal inicial.
UPDATE public.sales
SET branch_id = (
    SELECT id
    FROM public.branches
    WHERE code = 'PRINCIPAL'
)
WHERE branch_id IS NULL;

-- 6. Índice para filtrar ventas por sucursal.
CREATE INDEX IF NOT EXISTS idx_sales_branch_id
ON public.sales(branch_id);

-- 7. Índice para consultas por sucursal y fecha.
CREATE INDEX IF NOT EXISTS idx_sales_branch_created_at
ON public.sales(branch_id, created_at);

COMMIT;
