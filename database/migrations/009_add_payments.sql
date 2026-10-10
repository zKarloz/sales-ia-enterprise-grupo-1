-- Fase 08.B
-- Registro formal de pagos asociados a ventas.
-- Se mantiene una relación 1 a 1 entre sale y payment para el MVP.

BEGIN;

-- Normaliza los métodos de pago históricos.
UPDATE sales
SET payment_method = UPPER(TRIM(payment_method))
WHERE payment_method IS NOT NULL;

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,

    sale_id INTEGER NOT NULL UNIQUE
        REFERENCES sales(id)
        ON DELETE CASCADE,

    user_id INTEGER NOT NULL
        REFERENCES users(id)
        ON DELETE RESTRICT,

    method VARCHAR(50) NOT NULL,

    amount NUMERIC(12, 2) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PAID',

    reference VARCHAR(120),

    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT payments_amount_check
        CHECK (amount >= 0),

    CONSTRAINT payments_method_check
        CHECK (
            method IN (
                'EFECTIVO',
                'TARJETA',
                'TRANSFERENCIA',
                'YAPE',
                'PLIN'
            )
        ),

    CONSTRAINT payments_status_check
        CHECK (
            status IN (
                'PENDING',
                'PAID',
                'FAILED',
                'REFUNDED'
            )
        )
);

CREATE INDEX IF NOT EXISTS idx_payments_sale_id
ON payments(sale_id);

CREATE INDEX IF NOT EXISTS idx_payments_user_id
ON payments(user_id);

CREATE INDEX IF NOT EXISTS idx_payments_paid_at
ON payments(paid_at);


-- Backfill de ventas históricas.
-- Todas las ventas existentes están registradas como completadas,
-- por lo que se genera un pago PAID equivalente a su total.
INSERT INTO payments (
    sale_id,
    user_id,
    method,
    amount,
    status,
    reference,
    paid_at
)
SELECT
    s.id,
    s.seller_id,
    UPPER(TRIM(s.payment_method)),
    s.total_amount,
    'PAID',
    NULL,
    COALESCE(s.created_at, CURRENT_TIMESTAMP)
FROM sales s
ON CONFLICT (sale_id) DO NOTHING;

COMMIT;
