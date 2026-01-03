-- Create metas table for monthly goals
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('closer', 'sdr')),
  referencia_id UUID NOT NULL,
  mes DATE NOT NULL,
  meta_vendas INTEGER DEFAULT 0,
  meta_receita NUMERIC DEFAULT 0,
  meta_agendamentos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tipo, referencia_id, mes)
);

-- Create notificacoes_config table
CREATE TABLE public.notificacoes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('meta_atingida', 'queda_performance')),
  ativo BOOLEAN DEFAULT true,
  emails_destino TEXT[] DEFAULT '{}',
  threshold_queda INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create notificacoes_historico table
CREATE TABLE public.notificacoes_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL,
  destinatario TEXT NOT NULL,
  assunto TEXT NOT NULL,
  conteudo TEXT,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'enviado'
);

-- Enable RLS
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes_historico ENABLE ROW LEVEL SECURITY;

-- RLS policies for metas
CREATE POLICY "Admins and leaders can view metas"
ON public.metas FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "Admins can insert metas"
ON public.metas FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update metas"
ON public.metas FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete metas"
ON public.metas FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for notificacoes_config
CREATE POLICY "Admins can view notificacoes_config"
ON public.notificacoes_config FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert notificacoes_config"
ON public.notificacoes_config FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notificacoes_config"
ON public.notificacoes_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notificacoes_config"
ON public.notificacoes_config FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for notificacoes_historico
CREATE POLICY "Admins can view notificacoes_historico"
ON public.notificacoes_historico FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notificacoes_historico"
ON public.notificacoes_historico FOR INSERT
WITH CHECK (true);

-- Create trigger for updated_at on metas
CREATE TRIGGER update_metas_updated_at
BEFORE UPDATE ON public.metas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on notificacoes_config
CREATE TRIGGER update_notificacoes_config_updated_at
BEFORE UPDATE ON public.notificacoes_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();