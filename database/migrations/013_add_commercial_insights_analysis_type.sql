-- ============================================================
-- FASE 11 - INSIGHTS EMPRESARIALES
-- Permite registrar ejecuciones de reglas comerciales
-- dentro del historial de análisis estadísticos.
-- ============================================================

BEGIN;

ALTER TABLE statistical_analyses
    DROP CONSTRAINT IF EXISTS statistical_analyses_type_check;

ALTER TABLE statistical_analyses
    ADD CONSTRAINT statistical_analyses_type_check
    CHECK (
        analysis_type IN (
            'CLASSIFICATION',
            'MEAN',
            'MEDIAN',
            'COMPARE',
            'RANDOM_VARIABLE',
            'PROBABILITY',
            'BAYES',
            'COMMERCIAL_INSIGHTS'
        )
    );

COMMIT;
