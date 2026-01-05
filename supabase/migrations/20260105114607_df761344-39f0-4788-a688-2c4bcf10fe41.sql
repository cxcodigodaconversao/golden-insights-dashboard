-- Criar tabela de clientes/contratantes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  empresa TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Adicionar cliente_id nas tabelas existentes
ALTER TABLE public.times ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);
ALTER TABLE public.atendimentos ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);

-- Adicionar campos para soft delete em leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Adicionar campos para ownership tracking
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS owner_type TEXT;

-- Criar tabela de histórico de ownership
CREATE TABLE IF NOT EXISTS public.lead_ownership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  previous_owner_id UUID,
  previous_owner_name TEXT,
  previous_owner_type TEXT,
  new_owner_id UUID,
  new_owner_name TEXT,
  new_owner_type TEXT,
  transferred_by UUID NOT NULL,
  transferred_by_name TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela de logs de acesso detalhados
CREATE TABLE IF NOT EXISTS public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_cliente_id ON public.leads(cliente_id);
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON public.leads(deleted_at);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_cliente_id ON public.atendimentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_times_cliente_id ON public.times(cliente_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON public.access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_resource_id ON public.access_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_ownership_history_lead_id ON public.lead_ownership_history(lead_id);

-- Função para verificar se usuário pertence ao time
CREATE OR REPLACE FUNCTION public.is_in_team(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND time_id = _team_id
  )
$$;

-- Função para obter cliente_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_cliente_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cliente_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Função para verificar se é líder do time
CREATE OR REPLACE FUNCTION public.is_team_leader(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'lider'
  )
$$;

-- Enable RLS nas novas tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_ownership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para clientes
CREATE POLICY "Admins podem gerenciar clientes" ON public.clientes
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clientes podem ver próprio registro" ON public.clientes
FOR SELECT USING (
  has_role(auth.uid(), 'cliente'::app_role) 
  AND id = get_user_cliente_id(auth.uid())
);

CREATE POLICY "Líderes podem visualizar clientes" ON public.clientes
FOR SELECT USING (has_role(auth.uid(), 'lider'::app_role));

-- RLS Policies para lead_ownership_history
CREATE POLICY "Admins acesso total ownership history" ON public.lead_ownership_history
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Líderes podem ver histórico do time" ON public.lead_ownership_history
FOR SELECT USING (has_role(auth.uid(), 'lider'::app_role));

CREATE POLICY "Usuários podem criar histórico" ON public.lead_ownership_history
FOR INSERT WITH CHECK (true);

-- RLS Policies para access_logs
CREATE POLICY "Admins podem ver todos access_logs" ON public.access_logs
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sistema pode inserir access_logs" ON public.access_logs
FOR INSERT WITH CHECK (true);

-- Trigger para updated_at em clientes
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();