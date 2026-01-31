-- FIX: Denormalización de RLS para mayor estabilidad
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Agregar columna user_id a las tablas hijas
ALTER TABLE body_measurements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE body_photos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Poblar datos existentes (si hubiera)
UPDATE body_measurements bm
SET user_id = br.user_id
FROM body_records br
WHERE bm.body_record_id = br.id AND bm.user_id IS NULL;

UPDATE body_photos bp
SET user_id = br.user_id
FROM body_records br
WHERE bp.body_record_id = br.id AND bp.user_id IS NULL;

-- 3. Habilitar nuevas políticas simplificadas (más rápidas y seguras)
DROP POLICY IF EXISTS "Users can manage their own measurements" ON body_measurements;
CREATE POLICY "Users can manage their own measurements" ON body_measurements
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own photos" ON body_photos;
CREATE POLICY "Users can manage their own photos" ON body_photos
    FOR ALL USING (auth.uid() = user_id);

-- 4. Asegurarse de que el registro principal esté correcto
DROP POLICY IF EXISTS "Users can manage their own records" ON body_records;
CREATE POLICY "Users can manage their own records" ON body_records
    FOR ALL USING (auth.uid() = user_id);
