-- ========================================
-- Tabela para Progressive Loading - Vant
-- ========================================
-- Objetivo: Suportar carregamento progressivo de análises de CV
-- Permite que o frontend mostre resultados parciais em tempo real

-- Drop tabela se existir (apenas para desenvolvimento)
-- DROP TABLE IF EXISTS public.analysis_sessions;

-- Criar tabela analysis_sessions
CREATE TABLE IF NOT EXISTS public.analysis_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'processing',
    current_step TEXT DEFAULT 'starting',
    result_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON public.analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON public.analysis_sessions(status);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_created_at ON public.analysis_sessions(created_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analysis_sessions_updated_at 
    BEFORE UPDATE ON public.analysis_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança (RLS)
ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só podem ver/alterar suas próprias sessões
CREATE POLICY "Users can view own analysis sessions" ON public.analysis_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis sessions" ON public.analysis_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis sessions" ON public.analysis_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis sessions" ON public.analysis_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE public.analysis_sessions IS 'Sessões de análise com progressive loading para CV optimization';
COMMENT ON COLUMN public.analysis_sessions.id IS 'Identificador único da sessão';
COMMENT ON COLUMN public.analysis_sessions.user_id IS 'Referência ao usuário autenticado';
COMMENT ON COLUMN public.analysis_sessions.status IS 'Estado atual: processing, completed, failed';
COMMENT ON COLUMN public.analysis_sessions.current_step IS 'Passo atual para UI: diagnostico_pronto, cv_pronto, etc';
COMMENT ON COLUMN public.analysis_sessions.result_data IS 'JSON parcial com resultados sendo construído';
COMMENT ON COLUMN public.analysis_sessions.created_at IS 'Data de criação da sessão';
COMMENT ON COLUMN public.analysis_sessions.updated_at IS 'Última atualização (trigger automático)';

-- Exemplo de dados para teste (remover em produção)
-- INSERT INTO public.analysis_sessions (user_id, status, current_step, result_data) 
-- VALUES 
--     ('test-user-id', 'processing', 'diagnostico_pronto', '{"diagnostico": {"gaps": ["Falta de experiência em Cloud"], "score": 75}}'),
--     ('test-user-id-2', 'completed', 'finalizado', '{"diagnostico": {...}, "cv_optimizado": {...}, "biblioteca": {...}}');
