-- Adicionar campos de comissão e bônus extra na tabela closers
ALTER TABLE public.closers 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_extra DECIMAL(10,2) DEFAULT 0;

-- Adicionar campos de comissão e bônus extra na tabela sdrs
ALTER TABLE public.sdrs 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_extra DECIMAL(10,2) DEFAULT 0;

-- Adicionar campos de comissão e bônus extra na tabela lideres_comerciais
ALTER TABLE public.lideres_comerciais 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_extra DECIMAL(10,2) DEFAULT 0;