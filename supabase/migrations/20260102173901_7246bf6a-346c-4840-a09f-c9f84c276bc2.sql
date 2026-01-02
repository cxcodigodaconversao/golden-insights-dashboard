-- Add RLS policies for closers, sdrs and origens tables to allow insert and update

-- Closers
CREATE POLICY "Allow public insert to closers" 
ON public.closers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to closers" 
ON public.closers 
FOR UPDATE 
USING (true);

-- SDRs
CREATE POLICY "Allow public insert to sdrs" 
ON public.sdrs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to sdrs" 
ON public.sdrs 
FOR UPDATE 
USING (true);

-- Origens
CREATE POLICY "Allow public insert to origens" 
ON public.origens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to origens" 
ON public.origens 
FOR UPDATE 
USING (true);