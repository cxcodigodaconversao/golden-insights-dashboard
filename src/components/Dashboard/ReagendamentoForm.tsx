import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Video, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClosers } from "@/hooks/useAtendimentos";
import { useAddHistoricoInteracao, useFindOrCreateLead, useUpdateAtendimentoLeadId } from "@/hooks/useLeads";
import { Atendimento } from "@/hooks/useAtendimentos";

interface ReagendamentoFormProps {
  atendimento: Atendimento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HORAS_DISPONIVEIS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00"
];

export function ReagendamentoForm({ atendimento, open, onOpenChange }: ReagendamentoFormProps) {
  const queryClient = useQueryClient();
  const { data: closersData = [] } = useClosers();
  const addHistoricoInteracao = useAddHistoricoInteracao();
  const findOrCreateLead = useFindOrCreateLead();
  const updateAtendimentoLeadId = useUpdateAtendimentoLeadId();

  const [novaData, setNovaData] = useState<Date>(new Date());
  const [novaHora, setNovaHora] = useState("10:00");
  const [novoCloser, setNovoCloser] = useState(atendimento?.closer || "");
  const [observacoes, setObservacoes] = useState("");
  const [criarEventoCalendar, setCriarEventoCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closers = closersData.filter(c => c.ativo);

  const handleSubmit = async () => {
    if (!atendimento) return;
    if (!novoCloser) {
      toast.error("Selecione um closer para o reagendamento");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Garantir que existe um lead vinculado
      let leadId = atendimento.lead_id;
      
      if (!leadId) {
        const lead = await findOrCreateLead.mutateAsync({
          nome: atendimento.nome,
          telefone: atendimento.telefone,
          email: atendimento.email,
          origem: atendimento.origem,
          sdr: atendimento.sdr,
        });
        leadId = lead.id;

        // Atualizar atendimento original com o lead_id
        await updateAtendimentoLeadId.mutateAsync({
          atendimentoId: atendimento.id,
          leadId: leadId,
        });
      }

      // 2. Atualizar status do atendimento original para "Remarcado"
      await supabase
        .from("atendimentos")
        .update({ status: "Remarcado" })
        .eq("id", atendimento.id);

      // 3. Criar novo atendimento com a nova data/hora
      const novaDataCall = new Date(novaData);
      const [hora, minuto] = novaHora.split(":");
      novaDataCall.setHours(parseInt(hora), parseInt(minuto), 0, 0);

      let googleMeetLink = null;
      let googleEventId = null;

      // Se solicitou criar evento no Google Calendar
      if (criarEventoCalendar) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            const response = await supabase.functions.invoke("google-calendar", {
              body: {
                action: "create_event",
                title: `Call Comercial - ${atendimento.nome}`,
                description: `Reagendamento de call comercial.\n\nLead: ${atendimento.nome}\nTelefone: ${atendimento.telefone || "N/A"}\nEmail: ${atendimento.email || "N/A"}\nCloser: ${novoCloser}\n\nObservações: ${observacoes || "N/A"}`,
                startDateTime: novaDataCall.toISOString(),
                endDateTime: new Date(novaDataCall.getTime() + 60 * 60 * 1000).toISOString(), // +1 hora
                attendees: atendimento.email ? [atendimento.email] : [],
              },
            });

            if (response.data?.meetLink) {
              googleMeetLink = response.data.meetLink;
              googleEventId = response.data.eventId;
            }
          }
        } catch (calendarError) {
          console.error("Erro ao criar evento no Google Calendar:", calendarError);
          toast.warning("Reagendamento criado, mas não foi possível criar evento no Google Calendar");
        }
      }

      const { data: novoAtendimento, error: insertError } = await supabase
        .from("atendimentos")
        .insert({
          nome: atendimento.nome,
          telefone: atendimento.telefone,
          email: atendimento.email,
          sdr: atendimento.sdr,
          closer: novoCloser,
          origem: atendimento.origem,
          status: "Em negociação",
          data_call: novaDataCall.toISOString(),
          hora_call: novaHora,
          lead_id: leadId,
          info_sdr: observacoes || atendimento.info_sdr,
          google_meet_link: googleMeetLink,
          google_event_id: googleEventId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Registrar no histórico de interações
      await addHistoricoInteracao.mutateAsync({
        lead_id: leadId,
        atendimento_id: novoAtendimento.id,
        tipo: "reagendamento",
        descricao: `Reagendado para ${format(novaDataCall, "dd/MM/yyyy")} às ${novaHora} com ${novoCloser}${observacoes ? `. Obs: ${observacoes}` : ""}`,
        status_anterior: atendimento.status,
        status_novo: "Em negociação",
        usuario_nome: novoCloser,
      });

      toast.success("Reagendamento criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["historico_interacoes", leadId] });
      
      // Resetar formulário
      setNovaData(new Date());
      setNovaHora("10:00");
      setObservacoes("");
      setCriarEventoCalendar(false);
      onOpenChange(false);

    } catch (error) {
      console.error("Erro ao reagendar:", error);
      toast.error("Erro ao criar reagendamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar closer quando atendimento muda
  if (atendimento && !novoCloser) {
    setNovoCloser(atendimento.closer);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reagendar Atendimento
          </DialogTitle>
        </DialogHeader>

        {atendimento && (
          <div className="space-y-4">
            {/* Info do Lead */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="font-medium text-foreground">{atendimento.nome}</p>
              <p className="text-sm text-muted-foreground">
                {atendimento.telefone || atendimento.email || "Sem contato"}
              </p>
            </div>

            {/* Nova Data */}
            <div className="space-y-2">
              <Label>Nova Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(novaData, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={novaData}
                    onSelect={(date) => date && setNovaData(date)}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label>Horário</Label>
              <Select value={novaHora} onValueChange={setNovaHora}>
                <SelectTrigger>
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {HORAS_DISPONIVEIS.map((hora) => (
                    <SelectItem key={hora} value={hora}>
                      {hora}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Closer */}
            <div className="space-y-2">
              <Label>Closer Responsável</Label>
              <Select value={novoCloser} onValueChange={setNovoCloser}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o closer" />
                </SelectTrigger>
                <SelectContent>
                  {closers.map((closer) => (
                    <SelectItem key={closer.id} value={closer.nome}>
                      {closer.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Motivo do reagendamento, notas adicionais..."
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Google Calendar */}
            <div className="flex items-center space-x-2 rounded-lg border border-border p-3">
              <Checkbox
                id="calendar"
                checked={criarEventoCalendar}
                onCheckedChange={(checked) => setCriarEventoCalendar(checked === true)}
              />
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-blue-500" />
                <label
                  htmlFor="calendar"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Criar evento no Google Calendar com link do Meet
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reagendando...
              </>
            ) : (
              "Confirmar Reagendamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
