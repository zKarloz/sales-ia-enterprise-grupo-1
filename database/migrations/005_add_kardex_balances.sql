ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS stock_before INTEGER;

ALTER TABLE inventory_movements
ADD COLUMN IF NOT EXISTS stock_after INTEGER;

ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_stock_before_check
CHECK (stock_before IS NULL OR stock_before >= 0);

ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_stock_after_check
CHECK (stock_after IS NULL OR stock_after >= 0);