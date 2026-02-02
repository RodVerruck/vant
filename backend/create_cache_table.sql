-- Tabela para cache inteligente de análises
-- Reduz custos em 60-80% mantendo UX fluida

create table cached_analyses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users,
  input_hash text not null,
  cv_text_original text,
  job_description text,
  result_json jsonb,
  model_version text,
  hit_count integer default 1,
  created_at timestamp with time zone default now(),
  last_used timestamp with time zone default now()
);

-- Índice para buscas rápidas por hash
create index idx_cached_analyses_input_hash on cached_analyses(input_hash);

-- Índice para histórico do usuário
create index idx_cached_analyses_user_id on cached_analyses(user_id);

-- Índice para limpeza de cache antigo
create index idx_cached_analyses_last_used on cached_analyses(last_used);

-- Comentários para documentação
comment on table cached_analyses is 'Cache inteligente para evitar reprocessamento de CVs idênticos';
comment on column cached_analyses.input_hash is 'SHA256 de (cv_text + job_description + model_version)';
comment on column cached_analyses.hit_count is 'Número de vezes que este cache foi reutilizado';
