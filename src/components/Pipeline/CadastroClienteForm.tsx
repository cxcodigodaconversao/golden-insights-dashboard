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
import { UserPlus, ChevronDown, ChevronUp, Loader2, CalendarIcon } from "lucide-react";
import {
  useCreateClientePipeline,
  STATUS_ATENDIMENTO,
} from "@/hooks/usePipeline";
import { useSegmentos } from "@/hooks/useSegmentos";
import { useClosers, useSdrs, useOrigens, useTimes } from "@/hooks/useAtendimentos";
import { useClientes } from "@/hooks/useClientes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  origem_id: z.string().min(1, "Origem é obrigatória"),
  origem_nome: z.string().optional(),
  status: z.string().default("Em negociação"),
  
  // Dados da Negociação
  segmento: z.string().optional(),
  origem_lead: z.string().optional(),
  etapa_atual: z.string().default("primeiro_contato"),
  temperatura: z.string().default("morno"),
  valor_potencial: z.coerce.number().optional(),
  proximo_passo: z.string().optional(),
  data_proximo_contato: z.string().optional(),
  
  // Informações Adicionais
  info_sdr: z.string().optional(),
  gravacao: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CadastroClienteFormProps {
  onSuccess?: () => void;
}

export function CadastroClienteForm({ onSuccess }: CadastroClienteFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const createCliente = useCreateClientePipeline();
  const { data: segmentos = [] } = useSegmentos();
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
      segmento: "",
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

  const filteredSdrs = useMemo(() => {
    if (!selectedTeamId) return sdrs;
    return sdrs.filter((s) => s.time_id === selectedTeamId);
  }, [sdrs, selectedTeamId]);

  const filteredClosers = useMemo(() => {
    if (!selectedTeamId) return closers;
    return closers.filter((c) => c.time_id === selectedTeamId);
  }, [closers, selectedTeamId]);

  useEffect(() => {
    const currentSdrId = form.getValues("sdr_id");
    if (currentSdrId && !filteredSdrs.some((s) => s.id === currentSdrId)) {
      form.setValue("sdr_id", "");
    }

    const currentCloserId = form.getValues("closer_id");
    if (currentCloserId && !filteredClosers.some((c) => c.id === currentCloserId)) {
      form.setValue("closer_id", "");
    }
  }, [selectedTeamId, filteredSdrs, filteredClosers, form]);

  const onSubmit = (data: FormData) => {
    // Buscar nomes pelos IDs
    const sdrSelecionado = sdrs.find(s => s.id === data.sdr_id);
    const closerSelecionado = closers.find(c => c.id === data.closer_id);
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
        segmento: data.segmento || undefined,
        origem_lead: data.origem_lead || undefined,
        etapa_atual: data.etapa_atual,
        temperatura: data.temperatura,
        valor_potencial: data.valor_potencial || undefined,
        proximo_passo: data.proximo_passo || undefined,
        data_proximo_contato: data.data_proximo_contato || undefined,
        info_sdr: data.info_sdr || undefined,
        gravacao: data.gravacao || undefined,
        observacoes: data.observacoes || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onSuccess?.();
        },
      }
    );
  };

  // Máscara de WhatsApp
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

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

                    <FormField
                      control={form.control}
                      name="segmento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segmento</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {segmentos.map((seg) => (
                                <SelectItem key={seg.id} value={seg.nome}>
                                  {seg.nome}
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
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o Closer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {filteredClosers.map((closer) => (
                                <SelectItem key={closer.id} value={closer.id}>
                                  {closer.nome}
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
                      name="origem_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origem <span className="text-destructive">*</span></FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a origem" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {origens.map((origem) => (
                                <SelectItem key={origem.id} value={origem.id}>
                                  {origem.nome}
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
                              {STATUS_ATENDIMENTO.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
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
                    onClick={() => form.reset()}
                  >
                    Limpar
                  </Button>
                  <Button type="submit" disabled={createCliente.isPending}>
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
    </Collapsible>
  );
}