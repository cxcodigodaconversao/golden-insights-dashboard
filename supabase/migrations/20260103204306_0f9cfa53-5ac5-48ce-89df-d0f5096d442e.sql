-- Allow vendedores and SDRs to view their own metas
CREATE POLICY "Vendedores can view their own metas"
ON public.metas
FOR SELECT
USING (
  has_role(auth.uid(), 'vendedor'::app_role) AND
  tipo = 'closer' AND
  referencia_id = (SELECT closer_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "SDRs can view their own metas"
ON public.metas
FOR SELECT
USING (
  has_role(auth.uid(), 'sdr'::app_role) AND
  tipo = 'sdr' AND
  referencia_id = (SELECT sdr_id FROM public.profiles WHERE id = auth.uid())
);