-- Versão simplificada - Execute passo a passo se necessário

-- 1. Criar tabela principal
CREATE TABLE IF NOT EXISTS temp_files_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TEXT NOT NULL,
    cv_path TEXT NOT NULL,
    job_path TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    job_description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar índices (opcional, para performance)
CREATE INDEX IF NOT EXISTS idx_temp_files_batch_id ON temp_files_metadata(batch_id);
CREATE INDEX IF NOT EXISTS idx_temp_files_expires_at ON temp_files_metadata(expires_at);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE temp_files_metadata ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas básicas (opcional, para segurança)
-- Se der erro, pule esta parte e configure via dashboard

-- Política para usuários verem próprios arquivos
CREATE POLICY "Users can view own temp files" ON temp_files_metadata
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política para usuários inserirem próprios arquivos  
CREATE POLICY "Users can insert own temp files" ON temp_files_metadata
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política para usuários deletarem próprios arquivos
CREATE POLICY "Users can delete own temp files" ON temp_files_metadata
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. Função de limpeza (opcional)
CREATE OR REPLACE FUNCTION cleanup_expired_temp_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM temp_files_metadata WHERE expires_at < now();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Cleaned up % expired temp file batches', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
