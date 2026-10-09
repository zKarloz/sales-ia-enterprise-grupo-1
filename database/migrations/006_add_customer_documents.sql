ALTER TABLE customers
ADD COLUMN IF NOT EXISTS document_type VARCHAR(20);

ALTER TABLE customers
ADD COLUMN IF NOT EXISTS document_number VARCHAR(20);

CREATE UNIQUE INDEX IF NOT EXISTS ux_customers_document_number
ON customers (document_number)
WHERE document_number IS NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'customers_document_type_check'
    ) THEN
        ALTER TABLE customers
        ADD CONSTRAINT customers_document_type_check
        CHECK (
            document_type IS NULL
            OR document_type IN ('DNI', 'RUC', 'CE', 'OTRO')
        );
    END IF;
END $$;
