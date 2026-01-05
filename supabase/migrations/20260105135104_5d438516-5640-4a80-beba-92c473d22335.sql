-- Criar tabela de histórico de alterações de comissão
CREATE TABLE public.comissao_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_tipo TEXT NOT NULL, -- 'closer', 'sdr', 'lider'
  entidade_id UUID NOT NULL,
  entidade_nome TEXT NOT NULL,
  campo_alterado TEXT NOT NULL, -- 'comissao_percentual' ou 'bonus_extra'
  valor_anterior NUMERIC,
  valor_novo NUMERIC,
  alterado_por UUID NOT NULL,
  alterado_por_nome TEXT NOT NULL,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX idx_comissao_historico_entidade ON public.comissao_historico(entidade_tipo, entidade_id);
CREATE INDEX idx_comissao_historico_data ON public.comissao_historico(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.comissao_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver histórico de comissões"
ON public.comissao_historico FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Líderes podem ver histórico de comissões"
ON public.comissao_historico FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "Sistema pode inserir histórico de comissões"
ON public.comissao_historico FOR INSERT
WITH CHECK (true);