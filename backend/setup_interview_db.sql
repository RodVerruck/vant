-- Schema do Simulador de Entrevista WOW
-- Versão: 1.0
-- Data: 4 de fevereiro de 2026

-- ============================================================
-- TABELA: PERFIS DE ENTREVISTA (Gamification)
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    current_rank VARCHAR(50) DEFAULT 'Iniciante',
    badges JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    total_interviews INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    highest_score INTEGER DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interview_profiles_user_id ON interview_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_profiles_level ON interview_profiles(level);
CREATE INDEX IF NOT EXISTS idx_interview_profiles_xp ON interview_profiles(xp);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_interview_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER interview_profiles_updated_at
    BEFORE UPDATE ON interview_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_interview_profiles_updated_at();

-- ============================================================
-- TABELA: SESSÕES DE ENTREVISTA ENHANCED (WOW)
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_sessions_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cv_analysis_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    mode VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    questions JSONB NOT NULL,
    responses JSONB NOT NULL,
    feedback_enhanced JSONB NOT NULL,
    action_plan JSONB,
    xp_gained INTEGER DEFAULT 0,
    badges_earned JSONB DEFAULT '[]',
    final_score INTEGER NOT NULL,
    readiness_score_before INTEGER,
    readiness_score_after INTEGER,
    improvement_areas JSONB DEFAULT '[]',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_enhanced_user_id ON interview_sessions_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_enhanced_mode ON interview_sessions_enhanced(mode);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_enhanced_final_score ON interview_sessions_enhanced(final_score);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_enhanced_completed_at ON interview_sessions_enhanced(completed_at);

-- ============================================================
-- TABELA: CONQUISTAS E BADGES
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    category VARCHAR(30) NOT NULL,
    unlock_criteria JSONB NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges pré-definidas
INSERT INTO interview_badges (badge_id, name, description, icon, rarity, category, unlock_criteria, xp_reward) VALUES
('first_interview', 'Primeira Entrevista', 'Completou sua primeira simulação', '🎯', 'common', 'milestone', '{"interviews_completed": 1}', 10),
('perfect_score', 'Pontuação Perfeita', 'Alcançou 100 pontos em uma entrevista', '💯', 'epic', 'performance', '{"score": 100}', 50),
('streak_3', 'Sequência 3', 'Completou 3 entrevistas seguidas', '🔥', 'rare', 'consistency', '{"streak": 3}', 25),
('technical_master', 'Mestre Técnico', 'Excelente no modo técnico', '⚡', 'rare', 'specialization', '{"mode": "technical", "average_score": 85}', 30),
('behavioral_pro', 'Comportamental Pro', 'Dominou o método STAR', '🌟', 'rare', 'specialization', '{"mode": "behavioral", "average_score": 85}', 30),
('pressure_cool', 'Calmo sob Pressão', 'Excelente no modo pressão', '🧊', 'epic', 'specialization', '{"mode": "pressure", "average_score": 80}', 40),
('level_5', 'Nível 5', 'Alcançou o nível 5', '🏆', 'rare', 'level', '{"level": 5}', 100),
('interview_veteran', 'Veterano', 'Completou 20 entrevistas', '🎖️', 'legendary', 'milestone', '{"interviews_completed": 20}', 200)
ON CONFLICT (badge_id) DO NOTHING;

-- ============================================================
-- TABELA: USUÁRIO BADGES (Relacionamento)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES interview_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interview_session_id UUID REFERENCES interview_sessions_enhanced(id) ON DELETE SET NULL,
    UNIQUE(user_id, badge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_unlocked_at ON user_badges(unlocked_at);

-- ============================================================
-- TABELA: LEADERBOARDS
-- ============================================================

CREATE TABLE IF NOT EXISTS interview_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(30) NOT NULL CHECK (leaderboard_type IN ('weekly', 'monthly', 'all_time')),
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    entries JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leaderboard_type, period_start)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE interview_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_leaderboards ENABLE ROW LEVEL SECURITY;

-- Policies para interview_profiles
CREATE POLICY "Users can view own profile" ON interview_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON interview_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON interview_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para interview_sessions_enhanced
CREATE POLICY "Users can view own sessions" ON interview_sessions_enhanced
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON interview_sessions_enhanced
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies para user_badges
CREATE POLICY "Users can view own badges" ON user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can award badges" ON user_badges
    FOR INSERT WITH CHECK (true);

-- Policies para interview_leaderboards (leitura pública para todos)
CREATE POLICY "Anyone can view leaderboards" ON interview_leaderboards
    FOR SELECT USING (true);

-- ============================================================
-- VIEWS ÚTEIS
-- ============================================================

-- View para estatísticas do usuário
CREATE OR REPLACE VIEW user_interview_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(p.level, 1) as current_level,
    COALESCE(p.xp, 0) as total_xp,
    COALESCE(p.streak, 0) as current_streak,
    COALESCE(p.total_interviews, 0) as total_interviews,
    COALESCE(p.success_rate, 0) as success_rate,
    COALESCE(p.highest_score, 0) as highest_score,
    COALESCE(p.average_score, 0) as average_score,
    COALESCE(ub.badge_count, 0) as total_badges,
    p.updated_at as last_activity
FROM auth.users u
LEFT JOIN interview_profiles p ON u.id = p.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as badge_count
    FROM user_badges
    GROUP BY user_id
) ub ON u.id = ub.user_id;

-- View para ranking global
CREATE OR REPLACE VIEW global_ranking AS
SELECT 
    p.user_id,
    p.level,
    p.xp,
    p.highest_score,
    p.average_score,
    p.total_interviews,
    p.success_rate,
    ROW_NUMBER() OVER (ORDER BY p.xp DESC) as xp_rank,
    ROW_NUMBER() OVER (ORDER BY p.highest_score DESC) as score_rank,
    ROW_NUMBER() OVER (ORDER BY p.average_score DESC) as avg_score_rank
FROM interview_profiles p
ORDER BY p.xp DESC;

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Função para calcular XP baseado na performance
CREATE OR REPLACE FUNCTION calculate_interview_xp(
    score INTEGER,
    mode VARCHAR,
    difficulty VARCHAR,
    streak INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    base_xp INTEGER := 10;
    mode_multiplier DECIMAL := 1.0;
    difficulty_multiplier DECIMAL := 1.0;
    score_bonus INTEGER := 0;
    streak_bonus INTEGER := 0;
    total_xp INTEGER;
BEGIN
    -- Multiplicador por modo
    CASE mode
        WHEN 'warmup' THEN mode_multiplier := 0.8;
        WHEN 'technical' THEN mode_multiplier := 1.2;
        WHEN 'behavioral' THEN mode_multiplier := 1.1;
        WHEN 'pressure' THEN mode_multiplier := 1.5;
        WHEN 'company' THEN mode_multiplier := 1.3;
        ELSE mode_multiplier := 1.0;
    END CASE;
    
    -- Multiplicador por dificuldade
    CASE difficulty
        WHEN 'fácil' THEN difficulty_multiplier := 0.8;
        WHEN 'difícil' THEN difficulty_multiplier := 1.3;
        ELSE difficulty_multiplier := 1.0;
    END CASE;
    
    -- Bônus por score
    IF score >= 90 THEN
        score_bonus := 20;
    ELSIF score >= 80 THEN
        score_bonus := 15;
    ELSIF score >= 70 THEN
        score_bonus := 10;
    ELSIF score >= 60 THEN
        score_bonus := 5;
    END IF;
    
    -- Bônus por streak
    IF streak >= 5 THEN
        streak_bonus := 15;
    ELSIF streak >= 3 THEN
        streak_bonus := 10;
    ELSIF streak >= 1 THEN
        streak_bonus := 5;
    END IF;
    
    total_xp := ROUND(base_xp * mode_multiplier * difficulty_multiplier) + score_bonus + streak_bonus;
    
    RETURN GREATEST(total_xp, 5); -- Mínimo 5 XP
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar perfil do usuário após entrevista
CREATE OR REPLACE FUNCTION update_user_profile_after_interview(
    p_user_id UUID,
    p_score INTEGER,
    p_mode VARCHAR,
    p_difficulty VARCHAR,
    p_xp_gained INTEGER
) RETURNS VOID AS $$
DECLARE
    current_level INTEGER;
    current_xp INTEGER;
    new_level INTEGER;
    interviews_count INTEGER;
    new_average DECIMAL;
BEGIN
    -- Buscar dados atuais
    SELECT level, xp, total_interviews INTO current_level, current_xp, interviews_count
    FROM interview_profiles
    WHERE user_id = p_user_id;
    
    -- Se não existir perfil, criar
    IF NOT FOUND THEN
        INSERT INTO interview_profiles (user_id, xp, total_interviews, highest_score, average_score)
        VALUES (p_user_id, p_xp_gained, 1, p_score, p_score);
        RETURN;
    END IF;
    
    -- Atualizar XP e calcular novo nível
    new_level := GREATEST(1, FLOOR(SQRT((current_xp + p_xp_gained) / 100)) + 1);
    
    -- Atualizar média
    new_average := ((current_xp * interviews_count) + p_score) / (interviews_count + 1);
    
    -- Atualizar perfil
    UPDATE interview_profiles SET
        xp = current_xp + p_xp_gained,
        level = new_level,
        total_interviews = total_interviews + 1,
        highest_score = GREATEST(highest_score, p_score),
        average_score = new_average,
        success_rate = CASE 
            WHEN p_score >= 70 THEN (success_rate * interviews_count + 100) / (total_interviews + 1)
            ELSE (success_rate * interviews_count) / (total_interviews + 1)
        END,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS AUTOMÁTICOS
-- ============================================================

-- Trigger para atualizar perfil automaticamente após sessão
CREATE OR REPLACE FUNCTION auto_update_profile_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular XP para esta sessão
    DECLARE xp_earned INTEGER;
    BEGIN
        xp_earned := calculate_interview_xp(
            NEW.final_score,
            NEW.mode,
            NEW.difficulty,
            COALESCE((SELECT streak FROM interview_profiles WHERE user_id = NEW.user_id), 0)
        );
        
        -- Atualizar XP ganho na sessão
        NEW.xp_gained = xp_earned;
        
        -- Atualizar perfil do usuário
        PERFORM update_user_profile_after_interview(
            NEW.user_id,
            NEW.final_score,
            NEW.mode,
            NEW.difficulty,
            xp_earned
        );
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER interview_sessions_enhanced_profile_update
    BEFORE INSERT ON interview_sessions_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_profile_trigger();

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Criar perfil para usuários existentes (se necessário)
-- Esta query deve ser executada manualmente após migrar usuários existentes

-- ============================================================
-- COMENTÁRIOS FINAIS
-- ============================================================

-- Este schema suporta:
-- 1. Gamification completa (níveis, XP, badges, streaks)
-- 2. Múltiplos modos de entrevista
-- 3. Análise avançada com benchmarks
-- 4. Leaderboards e rankings
-- 5. RLS para segurança
-- 6. Performance com índices otimizados
-- 7. Automatização com triggers

-- Espaço estimado no Supabase:
-- - Cada registro de interview_sessions_enhanced: ~2-5KB
-- - Cada registro de interview_profiles: ~1KB
-- - Badges e conquistas: ~500B por badge
-- 
-- Para 1000 usuários com 10 entrevistas cada:
-- - ~10MB de dados (muito abaixo do limite de 500MB)

-- Não armazenamos áudios no banco, apenas transcrições e metadados
