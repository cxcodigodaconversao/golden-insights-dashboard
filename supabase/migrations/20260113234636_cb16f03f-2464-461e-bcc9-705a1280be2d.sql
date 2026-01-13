-- Adicionar política INSERT para Líderes na tabela clientes_pipeline
CREATE POLICY "Líderes podem inserir clientes" 
ON public.clientes_pipeline 
FOR INSERT 
TO public 
WITH CHECK (has_role(auth.uid(), 'lider'::app_role));

-- Adicionar política INSERT para Vendedores (Closers) na tabela clientes_pipeline
CREATE POLICY "Vendedores podem inserir clientes" 
ON public.clientes_pipeline 
FOR INSERT 
TO public 
WITH CHECK (has_role(auth.uid(), 'vendedor'::app_role));