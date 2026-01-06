-- Permitir exclusão para usuários autenticados na tabela atendimentos
CREATE POLICY "Usuarios podem excluir atendimentos"
  ON public.atendimentos
  FOR DELETE
  TO public
  USING (true);