-- Criar tabela de leads para consolidar informações únicas de cada pessoa
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  origem_primeira TEXT,
  sdr_primeiro TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para busca por telefone e email
CREATE INDEX idx_leads_telefone ON public.leads(telefone);
CREATE INDEX idx_leads_email ON public.leads(email);

-- Adicionar coluna lead_id na tabela atendimentos
ALTER TABLE public.atendimentos 
ADD COLUMN lead_id UUID REFERENCES public.leads(id);

-- Criar tabela de histórico de interações
CREATE TABLE public.historico_interacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  atendimento_id UUID REFERENCES public.atendimentos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL, -- 'agendamento', 'no_show', 'reagendamento', 'call_realizada', 'venda', 'perda', 'status_change'
  descricao TEXT,
  status_anterior TEXT,
  status_novo TEXT,
  data_interacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  usuario_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para busca por lead_id
CREATE INDEX idx_historico_lead_id ON public.historico_interacoes(lead_id);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_interacoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para leads (acesso público para leitura/escrita como atendimentos)
CREATE POLICY "Allow public read access to leads"
ON public.leads FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to leads"
ON public.leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update to leads"
ON public.leads FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete to leads"
ON public.leads FOR DELETE
USING (true);

-- Políticas RLS para historico_interacoes
CREATE POLICY "Allow public read access to historico_interacoes"
ON public.historico_interacoes FOR SELECT
USING (true);

CREATE POLICY "Allow public insert to historico_interacoes"
ON public.historico_interacoes FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update to historico_interacoes"
ON public.historico_interacoes FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete to historico_interacoes"
ON public.historico_interacoes FOR DELETE
USING (true);

-- Trigger para atualizar updated_at em leads
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();