-- Adicionar campos de email e status do Google Calendar na tabela closers
ALTER TABLE closers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE closers ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT FALSE;

-- Criar tabela de tokens Google por closer
CREATE TABLE IF NOT EXISTS google_tokens_closers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  closer_id UUID NOT NULL REFERENCES closers(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(closer_id)
);

-- Habilitar RLS
ALTER TABLE google_tokens_closers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tokens de closers
CREATE POLICY "Admins podem gerenciar tokens de closers"
  ON google_tokens_closers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Líderes podem ver tokens de closers"
  ON google_tokens_closers FOR SELECT
  USING (public.has_role(auth.uid(), 'lider'));