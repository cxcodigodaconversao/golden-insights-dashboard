import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { UserPlus, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  useCreateClientePipeline,
  ETAPAS_PIPELINE,
  ORIGENS_LEAD,
  TEMPERATURAS,
} from "@/hooks/usePipeline";
import { useSegmentos } from "@/hooks/useSegmentos";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  whatsapp: z.string().min(10, "WhatsApp inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  empresa: z.string().optional(),
  segmento: z.string().optional(),
  origem_lead: z.string().optional(),
  observacoes: z.string().optional(),
  etapa_atual: z.string().default("primeiro_contato"),
  temperatura: z.string().default("morno"),
  valor_potencial: z.coerce.number().optional(),
  proximo_passo: z.string().optional(),
  data_proximo_contato: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CadastroClienteFormProps {
  onSuccess?: () => void;
}

export function CadastroClienteForm({ onSuccess }: CadastroClienteFormProps) {
  const [isOpen, setIsOpen] = useState(true);
  const createCliente = useCreateClientePipeline();
  const { data: segmentos = [] } = useSegmentos();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      whatsapp: "",
      email: "",
      empresa: "",
      segmento: "",
      origem_lead: "",
      observacoes: "",
      etapa_atual: "primeiro_contato",
      temperatura: "morno",
      valor_potencial: undefined,
      proximo_passo: "",
      data_proximo_contato: "",
    },
  });

  const onSubmit = (data: FormData) => {
    createCliente.mutate(
      {
        nome: data.nome,
        whatsapp: data.whatsapp,
        email: data.email || undefined,
        empresa: data.empresa || undefined,
        segmento: data.segmento || undefined,
        origem_lead: data.origem_lead || undefined,
        observacoes: data.observacoes || undefined,
        etapa_atual: data.etapa_atual,
        temperatura: data.temperatura,
        valor_potencial: data.valor_potencial || undefined,
        proximo_passo: data.proximo_passo || undefined,
        data_proximo_contato: data.data_proximo_contato || undefined,
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
                <CardTitle className="text-lg">Cadastrar Novo Cliente</CardTitle>
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
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Dados do Cliente
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
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
                          <FormLabel>WhatsApp *</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="origem_lead"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Origem do Lead</FormLabel>
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
                              {ORIGENS_LEAD.map((origem) => (
                                <SelectItem key={origem} value={origem}>
                                  {origem}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações Iniciais</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anotações sobre o cliente..."
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

                {/* Dados da Negociação */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Dados da Negociação
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="etapa_atual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etapa do Funil *</FormLabel>
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
                              {ETAPAS_PIPELINE.filter((e) =>
                                ["primeiro_contato", "em_qualificacao", "proposta_enviada"].includes(e.id)
                              ).map((etapa) => (
                                <SelectItem key={etapa.id} value={etapa.id}>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: etapa.cor }}
                                    />
                                    {etapa.nome}
                                  </div>
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
                      name="temperatura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperatura</FormLabel>
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
                              {TEMPERATURAS.map((temp) => (
                                <SelectItem key={temp.id} value={temp.id}>
                                  {temp.emoji} {temp.nome}
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
