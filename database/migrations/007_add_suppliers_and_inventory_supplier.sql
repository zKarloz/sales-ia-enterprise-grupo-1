CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    ruc VARCHAR(11) NOT NULL,
    contact_name VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(30),
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS suppliers_ruc_key
ON suppliers (ruc);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'suppliers_ruc_check'
    ) THEN
        ALTER TABLE suppliers
        ADD CONSTRAINT suppliers_ruc_check
        CHECK (ruc ~ '^[0-9]{11}$');
    END IF;
END $$;

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS supplier_id INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'inventory_movements_supplier_id_fkey'
    ) THEN
        ALTER TABLE inventory_movements
        ADD CONSTRAINT inventory_movements_supplier_id_fkey
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ix_inventory_movements_supplier_id
ON inventory_movements (supplier_id);
