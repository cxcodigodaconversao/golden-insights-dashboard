-- Criar tabela de status de atendimento dinâmico
CREATE TABLE public.status_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  sincroniza_etapa TEXT DEFAULT NULL,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir status existentes
INSERT INTO public.status_atendimento (nome, sincroniza_etapa, ordem) VALUES
  ('Em negociação', null, 1),
  ('Venda Confirmada', 'ganho', 2),
  ('Venda Reembolsada', null, 3),
  ('Não fechou', 'perdido', 4),
  ('Não compareceu', null, 5),
  ('Remarcado', null, 6);

-- Habilitar RLS
ALTER TABLE public.status_atendimento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Todos podem ver status ativos"
  ON public.status_atendimento FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admins gerenciam status"
  ON public.status_atendimento FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));