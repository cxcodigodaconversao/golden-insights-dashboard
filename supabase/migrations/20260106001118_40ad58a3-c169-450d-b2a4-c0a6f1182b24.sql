-- Adicionar novos campos na tabela clientes_pipeline para unificar com o formulário de atendimentos

-- Campo de vinculação com Cliente/Projeto
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id);

-- Campos do Atendimento
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS data_call TIMESTAMPTZ;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS hora_call TIME;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS sdr_id UUID;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS sdr_nome TEXT;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS closer_id UUID;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS closer_nome TEXT;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS origem_id UUID;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS origem_nome TEXT;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Em negociação';
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS info_sdr TEXT;
ALTER TABLE public.clientes_pipeline ADD COLUMN IF NOT EXISTS gravacao TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.clientes_pipeline.cliente_id IS 'Vinculação com Cliente/Projeto existente';
COMMENT ON COLUMN public.clientes_pipeline.data_call IS 'Data da Call/Reunião';
COMMENT ON COLUMN public.clientes_pipeline.hora_call IS 'Hora da Call';
COMMENT ON COLUMN public.clientes_pipeline.sdr_id IS 'ID do SDR responsável pelo atendimento';
COMMENT ON COLUMN public.clientes_pipeline.sdr_nome IS 'Nome do SDR';
COMMENT ON COLUMN public.clientes_pipeline.closer_id IS 'ID do Closer responsável';
COMMENT ON COLUMN public.clientes_pipeline.closer_nome IS 'Nome do Closer';
COMMENT ON COLUMN public.clientes_pipeline.origem_id IS 'ID da Origem do lead';
COMMENT ON COLUMN public.clientes_pipeline.origem_nome IS 'Nome da Origem';
COMMENT ON COLUMN public.clientes_pipeline.status IS 'Status do atendimento (Em negociação, Venda Confirmada, etc)';
COMMENT ON COLUMN public.clientes_pipeline.info_sdr IS 'Informações adicionais do SDR';
COMMENT ON COLUMN public.clientes_pipeline.gravacao IS 'Link da gravação da call';