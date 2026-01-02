-- Create table for atendimentos (leads/attendances)
CREATE TABLE public.atendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'Em negociação',
  closer TEXT NOT NULL,
  gravacao TEXT,
  data_call TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sdr TEXT NOT NULL,
  info_sdr TEXT,
  origem TEXT NOT NULL,
  valor DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for closers
CREATE TABLE public.closers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for SDRs
CREATE TABLE public.sdrs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for origens (lead sources)
CREATE TABLE public.origens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read for now, will add auth later)
ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sdrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.origens ENABLE ROW LEVEL SECURITY;

-- Create public read policies (temporary - will add auth later)
CREATE POLICY "Allow public read access to atendimentos" 
ON public.atendimentos FOR SELECT USING (true);

CREATE POLICY "Allow public insert to atendimentos" 
ON public.atendimentos FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to atendimentos" 
ON public.atendimentos FOR UPDATE USING (true);

CREATE POLICY "Allow public delete to atendimentos" 
ON public.atendimentos FOR DELETE USING (true);

CREATE POLICY "Allow public read access to closers" 
ON public.closers FOR SELECT USING (true);

CREATE POLICY "Allow public read access to sdrs" 
ON public.sdrs FOR SELECT USING (true);

CREATE POLICY "Allow public read access to origens" 
ON public.origens FOR SELECT USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_atendimentos_updated_at
BEFORE UPDATE ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default closers
INSERT INTO public.closers (nome) VALUES 
  ('Vitor'), ('Gabriel'), ('Karine'), ('Rodrigo'), ('Jez');

-- Insert default SDRs
INSERT INTO public.sdrs (nome) VALUES 
  ('Vitor'), ('Jez'), ('Ester'), ('Gabriel'), ('Karine'), ('Pedro'), ('Matheus');

-- Insert default origens
INSERT INTO public.origens (nome) VALUES 
  ('Social Selling'), ('Microondas'), ('Diagnóstico'), ('WhatsApp'), ('Webnário'), ('VSL');