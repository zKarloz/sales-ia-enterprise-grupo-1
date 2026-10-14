-- Fase 10.B.2
-- Exige que cada venta tenga una sucursal asignada.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.sales
        WHERE branch_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Existen ventas sin sucursal asignada.';
    END IF;
END
$$;

ALTER TABLE public.sales
ALTER COLUMN branch_id SET NOT NULL;

COMMIT;
