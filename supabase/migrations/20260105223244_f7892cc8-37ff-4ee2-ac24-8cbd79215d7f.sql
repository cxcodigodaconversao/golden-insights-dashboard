-- Criar tabela de segmentos para dropdown personalizável
CREATE TABLE public.segmentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir segmentos iniciais
INSERT INTO public.segmentos (nome) VALUES
  ('E-commerce'),
  ('Serviços'),
  ('Infoprodutos'),
  ('SaaS'),
  ('Varejo'),
  ('Indústria'),
  ('Consultoria'),
  ('Agência'),
  ('Outro');

-- Criar tabela principal de clientes do pipeline
CREATE TABLE public.clientes_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  empresa TEXT,
  segmento TEXT,
  origem_lead TEXT,
  observacoes TEXT,
  etapa_atual TEXT NOT NULL DEFAULT 'primeiro_contato',
  temperatura TEXT DEFAULT 'morno',
  valor_potencial NUMERIC DEFAULT 0,
  proximo_passo TEXT,
  data_proximo_contato DATE,
  str_responsavel_id UUID NOT NULL,
  str_responsavel_nome TEXT NOT NULL,
  closer_responsavel_id UUID,
  closer_responsavel_nome TEXT,
  etapa_atualizada_em TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_clientes_pipeline_etapa ON public.clientes_pipeline(etapa_atual);
CREATE INDEX idx_clientes_pipeline_str ON public.clientes_pipeline(str_responsavel_id);
CREATE INDEX idx_clientes_pipeline_closer ON public.clientes_pipeline(closer_responsavel_id);
CREATE INDEX idx_clientes_pipeline_data ON public.clientes_pipeline(created_at DESC);

-- Criar tabela de histórico do pipeline
CREATE TABLE public.historico_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes_pipeline(id) ON DELETE CASCADE,
  etapa_anterior TEXT,
  etapa_nova TEXT,
  usuario_id UUID NOT NULL,
  usuario_nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'mudanca_etapa', 'nota', 'edicao', 'criacao'
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_historico_pipeline_cliente ON public.historico_pipeline(cliente_id);
CREATE INDEX idx_historico_pipeline_data ON public.historico_pipeline(created_at DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_clientes_pipeline_updated_at
BEFORE UPDATE ON public.clientes_pipeline
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.segmentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies para segmentos (público para leitura, admin para escrita)
CREATE POLICY "Todos podem ver segmentos ativos"
ON public.segmentos FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins podem gerenciar segmentos"
ON public.segmentos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies para clientes_pipeline
CREATE POLICY "Admins acesso total clientes_pipeline"
ON public.clientes_pipeline FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Líderes podem ver clientes da equipe"
ON public.clientes_pipeline FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "Líderes podem atualizar clientes"
ON public.clientes_pipeline FOR UPDATE
USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "SDRs podem ver próprios clientes"
ON public.clientes_pipeline FOR SELECT
USING (has_role(auth.uid(), 'sdr'::app_role) AND str_responsavel_id = auth.uid());

CREATE POLICY "SDRs podem inserir clientes"
ON public.clientes_pipeline FOR INSERT
WITH CHECK (has_role(auth.uid(), 'sdr'::app_role) AND str_responsavel_id = auth.uid());

CREATE POLICY "SDRs podem atualizar próprios clientes"
ON public.clientes_pipeline FOR UPDATE
USING (has_role(auth.uid(), 'sdr'::app_role) AND str_responsavel_id = auth.uid());

CREATE POLICY "Closers podem ver clientes em etapas avançadas"
ON public.clientes_pipeline FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND
  etapa_atual IN ('proposta_enviada', 'em_negociacao', 'fechamento_pendente', 'ganho', 'perdido')
);

CREATE POLICY "Closers podem atualizar clientes avançados"
ON public.clientes_pipeline FOR UPDATE
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND
  etapa_atual IN ('proposta_enviada', 'em_negociacao', 'fechamento_pendente')
);

-- RLS Policies para historico_pipeline
CREATE POLICY "Admins podem ver todo histórico"
ON public.historico_pipeline FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Líderes podem ver histórico da equipe"
ON public.historico_pipeline FOR SELECT
USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "Usuários podem ver histórico de seus clientes"
ON public.historico_pipeline FOR SELECT
USING (
  cliente_id IN (
    SELECT id FROM public.clientes_pipeline WHERE str_responsavel_id = auth.uid()
  )
);

CREATE POLICY "Usuários autenticados podem inserir histórico"
ON public.historico_pipeline FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);