-- Tabela para metadados de arquivos temporários no Storage
-- Substitui sistema de arquivos local por Supabase Storage

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

-- Criar índices separadamente (sintaxe PostgreSQL correta)
CREATE INDEX IF NOT EXISTS idx_temp_files_batch_id ON temp_files_metadata(batch_id);
CREATE INDEX IF NOT EXISTS idx_temp_files_user_id ON temp_files_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_files_expires_at ON temp_files_metadata(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_files_timestamp ON temp_files_metadata(timestamp);

-- Política de segurança: apenas usuários autenticados podem ver seus próprios arquivos
CREATE POLICY "Users can view own temp files" ON temp_files_metadata
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política de segurança: apenas usuários autenticados podem inserir seus próprios arquivos
CREATE POLICY "Users can insert own temp files" ON temp_files_metadata
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política de segurança: apenas usuários autenticados podem deletar seus próprios arquivos
CREATE POLICY "Users can delete own temp files" ON temp_files_metadata
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Habilitar RLS (Row Level Security)
ALTER TABLE temp_files_metadata ENABLE ROW LEVEL SECURITY;

-- Criar bucket no Supabase Storage (via dashboard ou API)
-- Nome: vant-temp-files
-- Políticas de acesso:
-- - Usuários autenticados: upload/download por 24 horas
-- - Público: nenhum acesso

-- Função para limpeza automática (rodar via cron job a cada hora)
CREATE OR REPLACE FUNCTION cleanup_expired_temp_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar registros expirados
    DELETE FROM temp_files_metadata 
    WHERE expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Notificar no log
    RAISE NOTICE 'Cleaned up % expired temp file batches', deleted_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE temp_files_metadata IS 'Metadados de arquivos temporários armazenados no Supabase Storage';
COMMENT ON COLUMN temp_files_metadata.batch_id IS 'ID único do batch de arquivos (para recuperação)';
COMMENT ON COLUMN temp_files_metadata.user_id IS 'ID do usuário que fez upload (opcional)';
COMMENT ON COLUMN temp_files_metadata.cv_path IS 'Path do CV no Supabase Storage';
COMMENT ON COLUMN temp_files_metadata.job_path IS 'Path da job description no Supabase Storage';
COMMENT ON COLUMN temp_files_metadata.expires_at IS 'Data/hora de expiração (24 horas)';
COMMENT ON COLUMN temp_files_metadata.job_description IS 'Texto da job description (cache para fácil acesso)';
