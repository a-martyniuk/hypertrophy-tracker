-- Tablas principales para Hypertrophy Tracker

-- 1. Tabla de Registros (Body Records)
CREATE TABLE body_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight DECIMAL,
    body_fat_pct DECIMAL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Para condition, sleep_hours, etc.
);

-- 2. Tabla de Medidas (Body Measurements)
CREATE TABLE body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    body_record_id UUID REFERENCES body_records(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- peso, cintura, arm.right, etc.
    value DECIMAL NOT NULL,
    side VARCHAR(10) DEFAULT 'center' -- center, right, left
);

-- 3. Tabla de Objetivos (Growth Goals)
CREATE TABLE growth_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    measurement_type VARCHAR(50) NOT NULL,
    target_value DECIMAL NOT NULL,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE body_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_goals ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Solo el dueño puede ver/editar)
CREATE POLICY "Users can manage their own records" ON body_records
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own measurements" ON body_measurements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM body_records 
            WHERE body_records.id = body_measurements.body_record_id 
            AND body_records.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own goals" ON growth_goals
    FOR ALL USING (auth.uid() = user_id);
