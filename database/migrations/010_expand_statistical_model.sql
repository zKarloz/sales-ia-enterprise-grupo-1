-- =============================================================================
-- FASE 09.A - MOTOR ESTADISTICO
-- Expansión del modelo analítico de SalesIA Enterprise.
--
-- Entidades incorporadas:
--   dataset_variables
--   observations
--   random_variables
--   statistical_results
--   bayes_analyses
--
-- Además:
--   - datasets obtiene trazabilidad de origen y usuario.
--   - statistical_analyses se relaciona formalmente con variables.
-- =============================================================================

BEGIN;


-- =============================================================================
-- 1. DATASETS
-- =============================================================================
-- Los datasets existentes se conservan.
-- Los registros históricos quedarán como MANUAL.

ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(30)
        NOT NULL DEFAULT 'MANUAL';

ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS source_config JSONB;

ALTER TABLE datasets
    ADD COLUMN IF NOT EXISTS created_by INTEGER;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'datasets_source_type_check'
          AND conrelid = 'datasets'::regclass
    ) THEN
        ALTER TABLE datasets
            ADD CONSTRAINT datasets_source_type_check
            CHECK (
                source_type IN (
                    'MANUAL',
                    'SALES',
                    'CUSTOMERS',
                    'PRODUCTS',
                    'INVENTORY'
                )
            );
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'datasets_created_by_fkey'
          AND conrelid = 'datasets'::regclass
    ) THEN
        ALTER TABLE datasets
            ADD CONSTRAINT datasets_created_by_fkey
            FOREIGN KEY (created_by)
            REFERENCES users(id)
            ON DELETE SET NULL;
    END IF;
END
$$;


CREATE INDEX IF NOT EXISTS idx_datasets_source_type
    ON datasets(source_type);

CREATE INDEX IF NOT EXISTS idx_datasets_created_by
    ON datasets(created_by);


-- =============================================================================
-- 2. DATASET VARIABLES
-- =============================================================================
-- Define las variables contenidas en cada dataset y su clasificación estadística.

CREATE TABLE IF NOT EXISTS dataset_variables (
    id SERIAL PRIMARY KEY,

    dataset_id INTEGER NOT NULL
        REFERENCES datasets(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    label VARCHAR(150) NOT NULL,

    variable_type VARCHAR(50) NOT NULL,

    value_type VARCHAR(20) NOT NULL,

    source_entity VARCHAR(50),

    source_field VARCHAR(100),

    description TEXT,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT dataset_variables_dataset_name_key
        UNIQUE (dataset_id, name),

    CONSTRAINT dataset_variables_variable_type_check
        CHECK (
            variable_type IN (
                'QUALITATIVE_NOMINAL',
                'QUALITATIVE_ORDINAL',
                'QUANTITATIVE_DISCRETE',
                'QUANTITATIVE_CONTINUOUS'
            )
        ),

    CONSTRAINT dataset_variables_value_type_check
        CHECK (
            value_type IN (
                'NUMERIC',
                'TEXT'
            )
        )
);


CREATE INDEX IF NOT EXISTS idx_dataset_variables_dataset
    ON dataset_variables(dataset_id);

CREATE INDEX IF NOT EXISTS idx_dataset_variables_type
    ON dataset_variables(variable_type);


-- =============================================================================
-- 3. OBSERVATIONS
-- =============================================================================
-- Almacena los valores observados de cada variable.
--
-- Formato largo:
--   una variable puede poseer muchas observaciones.
--
-- Para datos comerciales:
--   source_entity    = sales / customers / products
--   source_record_id = ID del registro original
--
-- observed_at permite conservar la fecha de la operación analizada.

CREATE TABLE IF NOT EXISTS observations (
    id SERIAL PRIMARY KEY,

    variable_id INTEGER NOT NULL
        REFERENCES dataset_variables(id)
        ON DELETE CASCADE,

    source_entity VARCHAR(50),

    source_record_id INTEGER,

    numeric_value NUMERIC(18, 6),

    text_value TEXT,

    observed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT observations_value_check
        CHECK (
            (
                numeric_value IS NOT NULL
                AND text_value IS NULL
            )
            OR
            (
                numeric_value IS NULL
                AND text_value IS NOT NULL
            )
        )
);


CREATE INDEX IF NOT EXISTS idx_observations_variable
    ON observations(variable_id);

CREATE INDEX IF NOT EXISTS idx_observations_source
    ON observations(source_entity, source_record_id);

CREATE INDEX IF NOT EXISTS idx_observations_observed_at
    ON observations(observed_at);


CREATE UNIQUE INDEX IF NOT EXISTS ux_observations_source_variable
    ON observations(
        variable_id,
        source_entity,
        source_record_id
    )
    WHERE source_record_id IS NOT NULL;


-- =============================================================================
-- 4. RANDOM VARIABLES
-- =============================================================================
-- Configuración formal de variables aleatorias asociadas a variables
-- estadísticas del dataset.

CREATE TABLE IF NOT EXISTS random_variables (
    id SERIAL PRIMARY KEY,

    variable_id INTEGER NOT NULL
        REFERENCES dataset_variables(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    random_type VARCHAR(20) NOT NULL,

    description TEXT,

    configuration JSONB,

    created_by INTEGER
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT random_variables_variable_name_key
        UNIQUE (variable_id, name),

    CONSTRAINT random_variables_type_check
        CHECK (
            random_type IN (
                'DISCRETE',
                'CONTINUOUS'
            )
        )
);


CREATE INDEX IF NOT EXISTS idx_random_variables_variable
    ON random_variables(variable_id);

CREATE INDEX IF NOT EXISTS idx_random_variables_created_by
    ON random_variables(created_by);


-- =============================================================================
-- 5. STATISTICAL ANALYSES
-- =============================================================================
-- Se conserva la estructura existente y se agregan relaciones normalizadas.

ALTER TABLE statistical_analyses
    ADD COLUMN IF NOT EXISTS variable_id INTEGER;

ALTER TABLE statistical_analyses
    ADD COLUMN IF NOT EXISTS random_variable_id INTEGER;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'statistical_analyses_variable_id_fkey'
          AND conrelid = 'statistical_analyses'::regclass
    ) THEN
        ALTER TABLE statistical_analyses
            ADD CONSTRAINT statistical_analyses_variable_id_fkey
            FOREIGN KEY (variable_id)
            REFERENCES dataset_variables(id)
            ON DELETE SET NULL;
    END IF;
END
$$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'statistical_analyses_random_variable_id_fkey'
          AND conrelid = 'statistical_analyses'::regclass
    ) THEN
        ALTER TABLE statistical_analyses
            ADD CONSTRAINT statistical_analyses_random_variable_id_fkey
            FOREIGN KEY (random_variable_id)
            REFERENCES random_variables(id)
            ON DELETE SET NULL;
    END IF;
END
$$;


-- Verifica que los datos existentes sean compatibles antes
-- de crear el constraint de tipos de análisis.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM statistical_analyses
        WHERE analysis_type NOT IN (
            'CLASSIFICATION',
            'MEAN',
            'MEDIAN',
            'COMPARE',
            'RANDOM_VARIABLE',
            'PROBABILITY',
            'BAYES'
        )
    ) THEN
        RAISE EXCEPTION
            'Existen analysis_type no contemplados por la Fase 09.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'statistical_analyses_type_check'
          AND conrelid = 'statistical_analyses'::regclass
    ) THEN
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
                    'BAYES'
                )
            );
    END IF;
END
$$;


CREATE INDEX IF NOT EXISTS idx_statistical_analyses_dataset
    ON statistical_analyses(dataset_id);

CREATE INDEX IF NOT EXISTS idx_statistical_analyses_variable
    ON statistical_analyses(variable_id);

CREATE INDEX IF NOT EXISTS idx_statistical_analyses_random_variable
    ON statistical_analyses(random_variable_id);

CREATE INDEX IF NOT EXISTS idx_statistical_analyses_created_by
    ON statistical_analyses(created_by);

CREATE INDEX IF NOT EXISTS idx_statistical_analyses_type
    ON statistical_analyses(analysis_type);


-- =============================================================================
-- 6. STATISTICAL RESULTS
-- =============================================================================
-- Resultados normalizados producidos por cada análisis.
--
-- Ejemplos de result_name:
--   COUNT
--   MEAN
--   MEDIAN
--   DIFFERENCE
--   PROBABILITY
--   EXPECTED_VALUE
--   VARIANCE

CREATE TABLE IF NOT EXISTS statistical_results (
    id SERIAL PRIMARY KEY,

    analysis_id INTEGER NOT NULL
        REFERENCES statistical_analyses(id)
        ON DELETE CASCADE,

    result_name VARCHAR(100) NOT NULL,

    numeric_value NUMERIC(18, 8),

    text_value TEXT,

    result_data JSONB,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT statistical_results_analysis_name_key
        UNIQUE (analysis_id, result_name),

    CONSTRAINT statistical_results_value_check
        CHECK (
            numeric_value IS NOT NULL
            OR text_value IS NOT NULL
            OR result_data IS NOT NULL
        )
);


CREATE INDEX IF NOT EXISTS idx_statistical_results_analysis
    ON statistical_results(analysis_id);


-- =============================================================================
-- 7. BAYES ANALYSES
-- =============================================================================
-- Datos específicos que permiten reproducir un análisis de Bayes.

CREATE TABLE IF NOT EXISTS bayes_analyses (
    id SERIAL PRIMARY KEY,

    analysis_id INTEGER NOT NULL UNIQUE
        REFERENCES statistical_analyses(id)
        ON DELETE CASCADE,

    event_a VARCHAR(150) NOT NULL,

    event_b VARCHAR(150) NOT NULL,

    probability_a NUMERIC(12, 10) NOT NULL,

    probability_b_given_a NUMERIC(12, 10) NOT NULL,

    probability_b NUMERIC(12, 10) NOT NULL,

    probability_a_given_b NUMERIC(12, 10) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT bayes_probability_a_check
        CHECK (
            probability_a >= 0
            AND probability_a <= 1
        ),

    CONSTRAINT bayes_probability_b_given_a_check
        CHECK (
            probability_b_given_a >= 0
            AND probability_b_given_a <= 1
        ),

    CONSTRAINT bayes_probability_b_check
        CHECK (
            probability_b > 0
            AND probability_b <= 1
        ),

    CONSTRAINT bayes_probability_a_given_b_check
        CHECK (
            probability_a_given_b >= 0
            AND probability_a_given_b <= 1
        )
);


CREATE INDEX IF NOT EXISTS idx_bayes_analyses_analysis
    ON bayes_analyses(analysis_id);


COMMIT;
