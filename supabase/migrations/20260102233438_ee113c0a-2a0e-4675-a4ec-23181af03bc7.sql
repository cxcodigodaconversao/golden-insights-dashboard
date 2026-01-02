-- Create times table
CREATE TABLE public.times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  cor TEXT DEFAULT '#d2bc8f',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;

-- RLS policies for times
CREATE POLICY "Allow public read access to times" ON public.times FOR SELECT USING (true);
CREATE POLICY "Allow public insert to times" ON public.times FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to times" ON public.times FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to times" ON public.times FOR DELETE USING (true);

-- Create lideres_comerciais table
CREATE TABLE public.lideres_comerciais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  time_id UUID REFERENCES public.times(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lideres_comerciais ENABLE ROW LEVEL SECURITY;

-- RLS policies for lideres_comerciais
CREATE POLICY "Allow public read access to lideres_comerciais" ON public.lideres_comerciais FOR SELECT USING (true);
CREATE POLICY "Allow public insert to lideres_comerciais" ON public.lideres_comerciais FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to lideres_comerciais" ON public.lideres_comerciais FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to lideres_comerciais" ON public.lideres_comerciais FOR DELETE USING (true);

-- Add time_id to closers table
ALTER TABLE public.closers ADD COLUMN time_id UUID REFERENCES public.times(id) ON DELETE SET NULL;

-- Add time_id to sdrs table
ALTER TABLE public.sdrs ADD COLUMN time_id UUID REFERENCES public.times(id) ON DELETE SET NULL;

-- Add DELETE policy to closers (was missing)
CREATE POLICY "Allow public delete to closers" ON public.closers FOR DELETE USING (true);

-- Add DELETE policy to sdrs (was missing)
CREATE POLICY "Allow public delete to sdrs" ON public.sdrs FOR DELETE USING (true);

-- Add DELETE policy to origens (was missing)
CREATE POLICY "Allow public delete to origens" ON public.origens FOR DELETE USING (true);