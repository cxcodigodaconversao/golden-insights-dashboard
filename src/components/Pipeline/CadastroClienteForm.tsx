import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UserPlus, ChevronDown, ChevronUp, Loader2, CalendarIcon, AlertCircle, CheckCircle2, Calendar as CalendarCheck, CreditCard, DollarSign } from "lucide-react";
import {
  useCreateClientePipeline,
  TIPOS_NEGOCIACAO,
} from "@/hooks/usePipeline";
import { useStatusAtendimento } from "@/hooks/useStatusAtendimento";
import { useClosers, useSdrs, useOrigens, useTimes } from "@/hooks/useAtendimentos";
import { useClientes } from "@/hooks/useClientes";
import { useCheckCloserAvailability, useCreateCloserCalendarEvent } from "@/hooks/useCloserGoogleCalendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CloserCalendarView } from "./CloserCalendarView";

const formSchema = z.object({
  // Dados do Cliente
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  empresa: z.string().optional(),
  cliente_id: z.string().optional(),
  
  // Dados do Atendimento
  time_id: z.string().optional().or(z.literal("")),
  data_call: z.date().optional(),
  hora_call: z.string().optional(),
  sdr_id: z.string().min(1, "SDR é obrigatório"),
  sdr_nome: z.string().optional(),
  closer_id: z.string().min(1, "Closer é obrigatório"),
  closer_nome: z.string().optional(),
  origem_id: z.string().optional(),
  origem_nome: z.string().optional(),
  status: z.string().default("Em negociação"),
  
  // Dados da Negociação
  origem_lead: z.string().optional(),
  etapa_atual: z.string().default("primeiro_contato"),
  temperatura: z.string().default("morno"),
  valor_potencial: z.coerce.number().optional(),
  proximo_passo: z.string().optional(),
  data_proximo_contato: z.string().optional(),
  
  // Dados de Pagamento/Fechamento
  tipo_negociacao: z.string().optional(),
  valor_venda: z.coerce.number().optional(),
  valor_pendente: z.coerce.number().optional(),
  forma_pagamento: z.string().optional(),
  
  // Informações Adicionais
  info_sdr: z.string().optional(),
  gravacao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CadastroClienteFormProps {
  onSuccess?: () => void;
}

interface CloserWithEmail {
  id: string;
  nome: string;
  ativo: boolean;
  time_id?: string | null;
  email?: string | null;
  google_calendar_connected?: boolean;
}

export function CadastroClienteForm({ onSuccess }: CadastroClienteFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<{
    available: boolean;
    reason?: string;
    message?: string;
    conflictingEvents?: Array<{ summary: string; start: string; end: string }>;
  } | null>(null);
  
  const createCliente = useCreateClientePipeline();
  const checkAvailability = useCheckCloserAvailability();
  const createCalendarEvent = useCreateCloserCalendarEvent();
  
  const { data: statusList = [] } = useStatusAtendimento();
  
  
  const { data: closers = [] } = useClosers();
  const { data: sdrs = [] } = useSdrs();
  const { data: origens = [] } = useOrigens();
  const { data: times = [] } = useTimes();
  const { data: clientes = [] } = useClientes();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      whatsapp: "",
      email: "",
      empresa: "",
      cliente_id: "",
      time_id: "",
      data_call: new Date(),
      hora_call: "",
      sdr_id: "",
      sdr_nome: "",
      closer_id: "",
      closer_nome: "",
      origem_id: "",
      origem_nome: "",
      status: "Em negociação",
      origem_lead: "",
      etapa_atual: "primeiro_contato",
      temperatura: "morno",
      valor_potencial: undefined,
      proximo_passo: "",
      data_proximo_contato: "",
      info_sdr: "",
      gravacao: "",
      observacoes: "",
    },
  });

  const selectedTeamId = useWatch({ control: form.control, name: "time_id" });
  const selectedCloserId = useWatch({ control: form.control, name: "closer_id" });
  const selectedDate = useWatch({ control: form.control, name: "data_call" });
  const selectedHora = useWatch({ control: form.control, name: "hora_call" });

  const filteredSdrs = useMemo(() => {
    if (!selectedTeamId) return sdrs;
    return sdrs.filter((s) => s.time_id === selectedTeamId);
  }, [sdrs, selectedTeamId]);

  const filteredClosers = useMemo(() => {
    if (!selectedTeamId) return closers;
    return closers.filter((c) => c.time_id === selectedTeamId);
  }, [closers, selectedTeamId]);

  // Reset selections when team changes
  useEffect(() => {
    const currentSdrId = form.getValues("sdr_id");
    if (currentSdrId && !filteredSdrs.some((s) => s.id === currentSdrId)) {
      form.setValue("sdr_id", "");
    }

    const currentCloserId = form.getValues("closer_id");
    if (currentCloserId && !filteredClosers.some((c) => c.id === currentCloserId)) {
      form.setValue("closer_id", "");
      setAvailabilityStatus(null);
    }
  }, [selectedTeamId, filteredSdrs, filteredClosers, form]);

  // Check availability when closer, date and time are selected
  useEffect(() => {
    const checkCloserAvailability = async () => {
      if (!selectedCloserId || !selectedDate || !selectedHora) {
        setAvailabilityStatus(null);
        return;
      }

      // Find closer to check if has google calendar connected
      const closer = closers.find(c => c.id === selectedCloserId) as CloserWithEmail | undefined;
      if (!closer?.google_calendar_connected) {
        setAvailabilityStatus(null);
        return;
      }

      setIsCheckingAvailability(true);

      try {
        // Create datetime of start
        const [hours, minutes] = selectedHora.split(":").map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes, 0, 0);
        
        // Create datetime of end (1 hour later)
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        const result = await checkAvailability.mutateAsync({
          closerId: selectedCloserId,
          startDateTime: startDate.toISOString(),
          endDateTime: endDate.toISOString(),
        });

        setAvailabilityStatus(result);
      } catch (error) {
        console.error("Erro ao verificar disponibilidade:", error);
        setAvailabilityStatus(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    // Debounce the check
    const timeoutId = setTimeout(checkCloserAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedCloserId, selectedDate, selectedHora, closers]);

  const onSubmit = async (data: FormData) => {
    // Check if blocked due to unavailability
    const closer = closers.find(c => c.id === data.closer_id) as CloserWithEmail | undefined;
    if (closer?.google_calendar_connected && availabilityStatus && !availabilityStatus.available) {
      toast.error("Este horário está ocupado. Escolha outro horário.");
      return;
    }

    // Find names by IDs
    const sdrSelecionado = sdrs.find(s => s.id === data.sdr_id);
    const closerSelecionado = closers.find(c => c.id === data.closer_id) as CloserWithEmail | undefined;
    const origemSelecionada = origens.find(o => o.id === data.origem_id);

    createCliente.mutate(
      {
        nome: data.nome,
        whatsapp: data.whatsapp,
        email: data.email || undefined,
        empresa: data.empresa || undefined,
        cliente_id: data.cliente_id || undefined,
        data_call: data.data_call?.toISOString() || undefined,
        hora_call: data.hora_call || undefined,
        sdr_id: data.sdr_id || undefined,
        sdr_nome: sdrSelecionado?.nome || undefined,
        closer_id: data.closer_id || undefined,
        closer_nome: closerSelecionado?.nome || undefined,
        origem_id: data.origem_id || undefined,
        origem_nome: origemSelecionada?.nome || undefined,
        status: data.status || undefined,
        origem_lead: data.origem_lead || undefined,
        // Sincronizar etapa com status usando dados do banco
        etapa_atual: (() => {
          const statusConfig = statusList.find(s => s.nome === data.status);
          if (statusConfig?.sincroniza_etapa) return statusConfig.sincroniza_etapa;
          return data.etapa_atual;
        })(),
        temperatura: data.temperatura,
        valor_potencial: data.valor_potencial || undefined,
        proximo_passo: data.proximo_passo || undefined,
        data_proximo_contato: data.data_proximo_contato || undefined,
        tipo_negociacao: data.tipo_negociacao || undefined,
        valor_venda: data.valor_venda || undefined,
        valor_pendente: data.valor_pendente || undefined,
        forma_pagamento: data.forma_pagamento || undefined,
        info_sdr: data.info_sdr || undefined,
        gravacao: data.gravacao || undefined,
        observacoes: data.observacoes || undefined,
      },
      {
        onSuccess: async (createdClient) => {
          // Create Google Calendar event if closer has calendar connected and date/time is set
          if (
            closerSelecionado?.google_calendar_connected && 
            data.data_call && 
            data.hora_call
          ) {
            try {
              const [hours, minutes] = data.hora_call.split(":").map(Number);
              const startDate = new Date(data.data_call);
              startDate.setHours(hours, minutes, 0, 0);
              
              const endDate = new Date(startDate);
              endDate.setHours(endDate.getHours() + 1);

              const attendees = [
                closerSelecionado.email,
                data.email,
              ].filter(Boolean) as string[];

              const eventResult = await createCalendarEvent.mutateAsync({
                closerId: data.closer_id,
                title: `Call - ${data.nome}`,
                description: `Lead: ${data.nome}\nWhatsApp: ${data.whatsapp}\nEmpresa: ${data.empresa || '-'}\n\nInfo SDR: ${data.info_sdr || '-'}`,
                startDateTime: startDate.toISOString(),
                endDateTime: endDate.toISOString(),
                attendees,
              });

              // If event was created, update the lead with the meet link
              if (eventResult.success && eventResult.meetLink && createdClient?.id) {
                await supabase
                  .from("clientes_pipeline")
                  .update({ 
                    gravacao: eventResult.meetLink,
                  })
                  .eq("id", createdClient.id);
                
                toast.success("Evento criado no Google Calendar com link do Meet!");
              }
            } catch (error) {
              console.error("Erro ao criar evento no calendário:", error);
              // Don't block the success - lead was created
            }
          }

          form.reset();
          setAvailabilityStatus(null);
          onSuccess?.();
        },
      }
    );
  };

  // WhatsApp mask
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const selectedCloser = closers.find(c => c.id === selectedCloserId) as CloserWithEmail | undefined;
  const showAvailabilityCheck = selectedCloser?.google_calendar_connected && selectedDate && selectedHora;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-secondary/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Cadastrar Novo Lead</CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Dados do Cliente */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                    Dados do Cliente
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              {...field}
                              onChange={(e) =>
                                field.onChange(formatWhatsApp(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@exemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="empresa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa/Negócio</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cliente_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente/Projeto</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente/projeto" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clientes.map((cliente) => (
                                <SelectItem key={cliente.id} value={cliente.id}>
                                  {cliente.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </div>
                </div>

                {/* Dados do Atendimento */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                    Dados do Atendimento
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="data_call"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Call</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Selecione a data</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                locale={ptBR}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hora_call"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora da Call</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o time (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {times
                                .filter((t) => t.ativo)
                                .map((time) => (
                                  <SelectItem key={time.id} value={time.id}>
                                    {time.nome}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sdr_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            SDR <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o SDR" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredSdrs.map((sdr) => (
                                <SelectItem key={sdr.id} value={sdr.id}>
                                  {sdr.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="closer_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Closer <span className="text-destructive">*</span>
                          </FormLabel>
                          <div className="flex gap-2">
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Selecione o Closer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {filteredClosers.map((closer) => {
                                  const closerWithEmail = closer as CloserWithEmail;
                                  return (
                                    <SelectItem key={closer.id} value={closer.id}>
                                      <div className="flex items-center gap-2">
                                        {closer.nome}
                                        {closerWithEmail.google_calendar_connected && (
                                          <CalendarCheck className="h-3 w-3 text-green-500" />
                                        )}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            {selectedCloser?.google_calendar_connected && (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => setShowCalendarModal(true)}
                                title="Ver agenda do closer"
                              >
                                <CalendarCheck className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusList.map((status) => (
                                <SelectItem key={status.id} value={status.nome}>
                                  {status.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Availability Status */}
                  {showAvailabilityCheck && (
                    <div className="mt-4">
                      {isCheckingAvailability ? (
                        <Alert>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <AlertDescription>
                            Verificando disponibilidade do closer...
                          </AlertDescription>
                        </Alert>
                      ) : availabilityStatus ? (
                        availabilityStatus.available ? (
                          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-700 dark:text-green-400">
                              Horário disponível! O evento será criado automaticamente no Google Calendar do closer.
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <p className="font-semibold">Este horário está ocupado!</p>
                              {availabilityStatus.conflictingEvents && availabilityStatus.conflictingEvents.length > 0 && (
                                <ul className="mt-2 text-sm">
                                  {availabilityStatus.conflictingEvents.map((event, index) => (
                                    <li key={index}>
                                      • {event.summary || "Evento sem título"} - {new Date(event.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <p className="mt-2">Escolha outro horário para continuar.</p>
                            </AlertDescription>
                          </Alert>
                        )
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Dados da Negociação */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                    Dados da Negociação
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="valor_potencial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Potencial (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0,00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="proximo_passo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Próximo Passo</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Enviar proposta"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="data_proximo_contato"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Próximo Contato</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Dados de Pagamento/Fechamento */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Dados de Pagamento (opcional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="tipo_negociacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Negociação</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {TIPOS_NEGOCIACAO.map((tipo) => (
                                <SelectItem key={tipo.id} value={tipo.id}>
                                  {tipo.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_venda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor da Venda (R$)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="pl-10"
                                min="0"
                                step="0.01"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_pendente"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Pendente (R$)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="0,00"
                                className="pl-10"
                                min="0"
                                step="0.01"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="forma_pagamento"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 lg:col-span-1">
                          <FormLabel>Forma de Pagamento</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 3x no cartão"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Informações Adicionais */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                    Informações Adicionais
                  </h4>
                  
                  <FormField
                    control={form.control}
                    name="info_sdr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Informações do SDR</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Observações do SDR sobre o lead..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gravacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link da Gravação</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Gerais</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anotações adicionais sobre o cliente..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setAvailabilityStatus(null);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      createCliente.isPending || 
                      (selectedCloser?.google_calendar_connected && availabilityStatus && !availabilityStatus.available)
                    }
                  >
                    {createCliente.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Cadastrar Cliente
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Dialog do Calendário Visual */}
      <Dialog open={showCalendarModal} onOpenChange={setShowCalendarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agenda do Closer</DialogTitle>
          </DialogHeader>
          {selectedCloser && (
            <CloserCalendarView
              closerId={selectedCloser.id}
              closerNome={selectedCloser.nome}
              onSelectSlot={(date, hora) => {
                form.setValue("data_call", date);
                form.setValue("hora_call", hora);
                setShowCalendarModal(false);
                toast.success(`Horário selecionado: ${format(date, "dd/MM/yyyy", { locale: ptBR })} às ${hora}`);
              }}
              onClose={() => setShowCalendarModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Collapsible>
  );
}
