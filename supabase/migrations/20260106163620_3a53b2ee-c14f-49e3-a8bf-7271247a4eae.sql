-- Adicionar política DELETE para SDRs poderem excluir próprios clientes
CREATE POLICY "SDRs podem excluir próprios clientes" 
  ON public.clientes_pipeline
  FOR DELETE
  TO public
  USING (
    has_role(auth.uid(), 'sdr'::app_role) 
    AND str_responsavel_id = auth.uid()
  );

-- Adicionar política DELETE para Líderes poderem excluir clientes
CREATE POLICY "Líderes podem excluir clientes" 
  ON public.clientes_pipeline
  FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'lider'::app_role));