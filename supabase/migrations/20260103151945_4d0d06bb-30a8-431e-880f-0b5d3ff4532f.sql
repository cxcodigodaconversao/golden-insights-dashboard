-- 1. Atualizar enum app_role para incluir todos os níveis
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendedor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sdr';

-- 2. Adicionar coluna para vincular profiles a closers/sdrs (para saber "quem é quem")
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS closer_id UUID REFERENCES public.closers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sdr_id UUID REFERENCES public.sdrs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS time_id UUID REFERENCES public.times(id) ON DELETE SET NULL;

-- 3. Criar tabela de auditoria para rastrear alterações
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Habilitar RLS na tabela de auditoria
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para audit_logs - apenas admins podem ver
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 6. Política para inserção de logs (qualquer usuário autenticado pode criar logs)
CREATE POLICY "Authenticated users can create audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 7. Atualizar função handle_new_user para suportar novos roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  
  IF NEW.email IN ('cxcodigodaconversao@gmail.com', 'cxcomercial10x@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 8. Criar função para obter o role do usuário (retorna text para evitar problemas com enum)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 9. Criar função para obter o time do usuário
CREATE OR REPLACE FUNCTION public.get_user_team_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT time_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;