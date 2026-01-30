-- 5. Tabla de Fotos (Body Photos)
CREATE TABLE body_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    body_record_id UUID REFERENCES body_records(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    angle VARCHAR(20) NOT NULL, -- front, side, back
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE body_photos ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage their own photos" ON body_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM body_records 
            WHERE body_records.id = body_photos.body_record_id 
            AND body_records.user_id = auth.uid()
        )
    );
