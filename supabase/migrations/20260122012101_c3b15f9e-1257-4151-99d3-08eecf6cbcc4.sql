-- Adicionar campos de pagamento à tabela clientes_pipeline
ALTER TABLE public.clientes_pipeline 
ADD COLUMN IF NOT EXISTS valor_venda NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_pendente NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tipo_negociacao TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS forma_pagamento TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pagamento_confirmado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_pagamento_confirmado TIMESTAMPTZ DEFAULT NULL;