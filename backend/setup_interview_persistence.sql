-- ========================================
-- PERSISTÊNCIA COMPLETA DO SIMULADOR WOW
-- ========================================

-- Tabela principal de sessões de entrevista
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cv_analysis_id UUID REFERENCES analysis_sessions(id) ON DELETE SET NULL,
    
    -- Configuração da entrevista
    interview_mode VARCHAR(20) NOT NULL DEFAULT 'standard', -- standard, pressure, technical, behavioral
    difficulty VARCHAR(20) NOT NULL DEFAULT 'médio', -- fácil, médio, difícil
    sector_detected VARCHAR(50) NOT NULL,
    focus_areas TEXT[], -- áreas de foco selecionadas
    
    -- Estado da sessão
    status VARCHAR(20) NOT NULL DEFAULT 'created', -- created, in_progress, completed, abandoned
    current_question INTEGER DEFAULT 1,
    total_questions INTEGER DEFAULT 5,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Dados da sessão (JSON para flexibilidade)
    questions JSONB NOT NULL DEFAULT '[]',
    answers JSONB NOT NULL DEFAULT '[]',
    feedbacks JSONB NOT NULL DEFAULT '[]',
    
    -- Métricas da sessão
    final_score INTEGER,
    total_xp_earned INTEGER DEFAULT 0,
    streak_bonus INTEGER DEFAULT 0,
    perfect_answers INTEGER DEFAULT 0,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas detalhadas (para análise granular)
CREATE TABLE IF NOT EXISTS interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL,
    
    -- Dados da pergunta
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- tecnica, comportamental, situacional
    question_intent TEXT,
    question_focus TEXT[],
    
    -- Dados da resposta
    answer_text TEXT,
    audio_file_url TEXT, -- se houver gravação
    transcription TEXT,
    response_time_seconds INTEGER,
    
    -- Feedback detalhado
    feedback JSONB NOT NULL DEFAULT '{}',
    score INTEGER,
    sentiment_analysis JSONB DEFAULT '{}',
    benchmark_comparison JSONB DEFAULT '{}',
    cultural_fit JSONB DEFAULT '{}',
    
    -- Timestamps
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso e gamificação do usuário
CREATE TABLE IF NOT EXISTS user_interview_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Estatísticas gerais
    total_interviews INTEGER DEFAULT 0,
    completed_interviews INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    
    -- Gamificação
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    
    -- Conquistas (badges)
    badges JSONB DEFAULT '[]', -- array de objetos badge
    current_rank VARCHAR(50) DEFAULT 'Iniciante',
    
    -- Performance por setor
    sector_performance JSONB DEFAULT '{}', -- { "Tecnologia": { avg_score: 85, interviews: 5 } }
    
    -- Preferências e histórico
    favorite_interview_mode VARCHAR(20),
    preferred_difficulty VARCHAR(20),
    strongest_areas TEXT[],
    improvement_areas TEXT[],
    
    -- Timestamps
    last_interview_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conquistas/badges disponíveis
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL, -- emoji ou nome do ícone
    category VARCHAR(30) NOT NULL, -- streak, perfect, sector, improvement
    requirement_type VARCHAR(30) NOT NULL, -- count, score, streak, consecutive
    requirement_value INTEGER NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    
    -- Condições específicas (JSON para flexibilidade)
    conditions JSONB DEFAULT '{}', -- { "sector": "Tecnologia", "difficulty": "difícil" }
    
    -- Metadados
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de conquistas do usuário (quão desbloqueou)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    
    -- Contexto da conquista
    session_id UUID REFERENCES interview_sessions(id) ON DELETE SET NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadados
    metadata JSONB DEFAULT '{}', -- dados específicos de como foi desbloqueado
    
    UNIQUE(user_id, achievement_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON interview_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id ON interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_user_interview_profile_user_id ON user_interview_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interview_sessions_updated_at 
    BEFORE UPDATE ON interview_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_interview_profile_updated_at 
    BEFORE UPDATE ON user_interview_profile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) para segurança
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interview_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own interview sessions" ON interview_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interview sessions" ON interview_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interview sessions" ON interview_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interview sessions" ON interview_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas similares para outras tabelas
CREATE POLICY "Users can view own interview answers" ON interview_answers
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM interview_sessions WHERE id = session_id));

CREATE POLICY "Users can insert own interview answers" ON interview_answers
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM interview_sessions WHERE id = session_id));

CREATE POLICY "Users can view own profile" ON user_interview_profile
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile" ON user_interview_profile
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Inserir conquistas básicas
INSERT INTO achievements (name, description, icon, category, requirement_type, requirement_value, xp_reward, conditions, is_active) VALUES
('Primeira Entrevista', 'Complete sua primeira entrevista', '🎯', 'streak', 'count', 1, 10, '{}', true),
('Entrevista Perfeita', 'Score 100% em uma entrevista', '💯', 'perfect', 'score', 100, 50, '{}', true),
('Mestre Tecnologia', '10 entrevistas em Tecnologia', '💻', 'sector', 'count', 10, 100, '{"sector": "Tecnologia"}', true),
('Mestre Financeiro', '10 entrevistas em Financeiro', '🏦', 'sector', 'count', 10, 100, '{"sector": "Financeiro"}', true),
('Mestre Marketing', '10 entrevistas em Marketing', '📈', 'sector', 'count', 10, 100, '{"sector": "Marketing"}', true),
('Mestre RH', '10 entrevistas em RH', '👥', 'sector', 'count', 10, 100, '{"sector": "RH"}', true),
('Streak de 3', 'Complete 3 entrevistas seguidas', '🔥', 'streak', 'count', 3, 30, '{}', true),
('Streak de 7', 'Complete 7 entrevistas seguidas', '⚡', 'streak', 'count', 7, 70, '{}', true),
('Nível 5', 'Alcance o nível 5', '⭐', 'level', 'count', 5, 100, '{}', true),
('Nível 10', 'Alcance o nível 10', '🌟', 'level', 'count', 10, 200, '{}', true),
('Desafio Difícil', 'Complete entrevista difícil com score >80', '🏆', 'score', 'score', 80, 80, '{"difficulty": "difícil", "min_score": 80}', true),
('Explorador', 'Complete entrevistas em 3 setores diferentes', '🧭', 'variety', 'count', 3, 60, '{"unique_sectors": 3}', true)
ON CONFLICT (name) DO NOTHING;

-- Função para criar/atualizar perfil do usuário
CREATE OR REPLACE FUNCTION ensure_user_profile(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_interview_profile (user_id)
    VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular XP e nível
CREATE OR REPLACE FUNCTION calculate_level_and_rank(total_xp INTEGER)
RETURNS TABLE(level INTEGER, rank VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN total_xp < 50 THEN 1
            WHEN total_xp < 150 THEN 2
            WHEN total_xp < 300 THEN 3
            WHEN total_xp < 500 THEN 4
            WHEN total_xp < 800 THEN 5
            WHEN total_xp < 1200 THEN 6
            WHEN total_xp < 1700 THEN 7
            WHEN total_xp < 2300 THEN 8
            WHEN total_xp < 3000 THEN 9
            WHEN total_xp < 4000 THEN 10
            ELSE 11
        END as level,
        CASE 
            WHEN total_xp < 50 THEN 'Iniciante'
            WHEN total_xp < 150 THEN 'Aprendiz'
            WHEN total_xp < 300 THEN 'Praticante'
            WHEN total_xp < 500 THEN 'Competente'
            WHEN total_xp < 800 THEN 'Avançado'
            WHEN total_xp < 1200 THEN 'Especialista'
            WHEN total_xp < 1700 THEN 'Mestre'
            WHEN total_xp < 2300 THEN 'Sênior'
            WHEN total_xp < 3000 THEN 'Expert'
            WHEN total_xp < 4000 THEN 'Mítico'
            ELSE 'Lendário'
        END as rank;
END;
$$ LANGUAGE plpgsql;
