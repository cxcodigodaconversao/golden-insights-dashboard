-- Add commission fields to metas table
ALTER TABLE metas 
ADD COLUMN IF NOT EXISTS comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_extra DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS campanha_nome TEXT,
ADD COLUMN IF NOT EXISTS campanha_ativa BOOLEAN DEFAULT false;