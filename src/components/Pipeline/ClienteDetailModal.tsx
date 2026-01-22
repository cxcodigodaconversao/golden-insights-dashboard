import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Mail,
  Building2,
  Calendar,
  DollarSign,
  User,
  Clock,
  MessageSquare,
  ArrowRight,
  Edit2,
  Send,
  Video,
  ExternalLink,
  Briefcase,
  CreditCard,
  CheckCircle,
  Receipt,
} from "lucide-react";
import {
  ClientePipeline,
  ETAPAS_PIPELINE,
  TEMPERATURAS,
  TIPOS_NEGOCIACAO,
  useHistoricoPipeline,
  useAddNotaPipeline,
  useUpdateClientePipeline,
} from "@/hooks/usePipeline";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ClienteDetailModalProps {
  cliente: ClientePipeline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClienteDetailModal({
  cliente,
  open,
  onOpenChange,
}: ClienteDetailModalProps) {
  const [novaNota, setNovaNota] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ClientePipeline>>({});
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const { user, profile } = useAuth();
  const { data: historico = [], isLoading: isLoadingHistorico } =
    useHistoricoPipeline(cliente?.id || "");
  const addNota = useAddNotaPipeline();
  const updateCliente = useUpdateClientePipeline();

  if (!cliente) return null;

  const temperatura = TEMPERATURAS.find((t) => t.id === cliente.temperatura);
  const etapaAtual = ETAPAS_PIPELINE.find((e) => e.id === cliente.etapa_atual);
  const tipoNegociacao = TIPOS_NEGOCIACAO.find((t) => t.id === cliente.tipo_negociacao);

  const diasNaEtapa = cliente.etapa_atualizada_em
    ? differenceInDays(new Date(), parseISO(cliente.etapa_atualizada_em))
    : 0;

  const isEmAplicacao = cliente.etapa_atual === "aplicacao";
  const pagamentoConfirmado = cliente.pagamento_confirmado;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatWhatsAppLink = (whatsapp: string) => {
    const numbers = whatsapp.replace(/\D/g, "");
    const withCountry = numbers.startsWith("55") ? numbers : `55${numbers}`;
    return `https://wa.me/${withCountry}`;
  };

  const handleAddNota = () => {
    if (!novaNota.trim()) return;
    addNota.mutate(
      { clienteId: cliente.id, nota: novaNota },
      {
        onSuccess: () => setNovaNota(""),
      }
    );
  };

  const handleSaveEdit = () => {
    if (Object.keys(editData).length === 0) {
      setIsEditing(false);
      return;
    }
    updateCliente.mutate(
      { id: cliente.id, data: editData },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditData({});
        },
      }
    );
  };

  const handleConfirmPayment = async () => {
    if (!user || !profile) return;

    setIsConfirmingPayment(true);
    try {
      // Atualizar cliente para ganho e confirmar pagamento
      await supabase
        .from("clientes_pipeline")
        .update({
          pagamento_confirmado: true,
          data_pagamento_confirmado: new Date().toISOString(),
          etapa_atual: "ganho",
          etapa_atualizada_em: new Date().toISOString(),
        })
        .eq("id", cliente.id);

      // Registrar no histórico
      await supabase.from("historico_pipeline").insert({
        cliente_id: cliente.id,
        etapa_anterior: "aplicacao",
        etapa_nova: "ganho",
        usuario_id: user.id,
        usuario_nome: profile.nome,
        tipo: "pagamento_confirmado",
        nota: `Pagamento confirmado - ${tipoNegociacao?.nome || cliente.tipo_negociacao} - ${formatCurrency(cliente.valor_venda || 0)}`,
      });

      toast.success("Pagamento confirmado! Cliente movido para Ganho.");
      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      toast.error("Erro ao confirmar pagamento");
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const getHistoricoIcon = (tipo: string) => {
    switch (tipo) {
      case "mudanca_etapa":
        return <ArrowRight className="h-4 w-4" />;
      case "nota":
        return <MessageSquare className="h-4 w-4" />;
      case "edicao":
        return <Edit2 className="h-4 w-4" />;
      case "pagamento_confirmado":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getHistoricoLabel = (tipo: string) => {
    switch (tipo) {
      case "mudanca_etapa":
        return "Mudança de etapa";
      case "nota":
        return "Nota";
      case "edicao":
        return "Edição";
      case "criacao":
        return "Criação";
      case "pagamento_confirmado":
        return "Pagamento Confirmado";
      default:
        return tipo;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{cliente.nome}</DialogTitle>
            <div className="flex items-center gap-2">
              {temperatura && (
                <Badge variant="outline">
                  {temperatura.emoji} {temperatura.nome}
                </Badge>
              )}
              {etapaAtual && (
                <Badge style={{ backgroundColor: etapaAtual.cor }}>
                  {etapaAtual.nome}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="detalhes" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({historico.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detalhes" className="space-y-4 mt-4">
            <ScrollArea className="max-h-[400px] pr-4">
              {/* Dados de contato */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Contato
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={formatWhatsAppLink(cliente.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm">{cliente.whatsapp}</span>
                  </a>
                  {cliente.email && (
                    <a
                      href={`mailto:${cliente.email}`}
                      className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <Mail className="h-4 w-4 text-primary" />
                      <span className="text-sm truncate">{cliente.email}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Empresa */}
              {cliente.empresa && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 mt-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{cliente.empresa}</span>
                </div>
              )}

              {/* Dados do Atendimento */}
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Atendimento
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {cliente.data_call && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Call: {format(parseISO(cliente.data_call), "dd/MM/yyyy", { locale: ptBR })}
                        {cliente.hora_call && ` às ${cliente.hora_call.slice(0, 5)}`}
                      </span>
                    </div>
                  )}
                  {cliente.status && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Status: {cliente.status}</span>
                    </div>
                  )}
                  {cliente.sdr_nome && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">SDR: {cliente.sdr_nome}</span>
                    </div>
                  )}
                  {cliente.closer_nome && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Closer: {cliente.closer_nome}</span>
                    </div>
                  )}
                  {cliente.origem_nome && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Origem: {cliente.origem_nome}</span>
                    </div>
                  )}
                </div>
                
                {/* Link da Gravação */}
                {cliente.gravacao && (
                  <a
                    href={cliente.gravacao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">Ver Gravação</span>
                    <ExternalLink className="h-3 w-3 text-primary ml-auto" />
                  </a>
                )}

                {/* Informações do SDR */}
                {cliente.info_sdr && (
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      Informações do SDR:
                    </p>
                    <p className="text-sm">{cliente.info_sdr}</p>
                  </div>
                )}
              </div>

              {/* Dados da negociação */}
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Negociação
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {cliente.valor_potencial && cliente.valor_potencial > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {formatCurrency(cliente.valor_potencial)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {diasNaEtapa} dias na etapa atual
                    </span>
                  </div>
                </div>
                {cliente.data_proximo_contato && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Próximo contato:{" "}
                      {format(
                        parseISO(cliente.data_proximo_contato),
                        "dd/MM/yyyy",
                        { locale: ptBR }
                      )}
                    </span>
                  </div>
                )}
                {cliente.proximo_passo && (
                  <div className="p-2 rounded-lg bg-secondary/50">
                    <p className="text-xs text-muted-foreground mb-1">
                      Próximo passo:
                    </p>
                    <p className="text-sm">{cliente.proximo_passo}</p>
                  </div>
                )}
              </div>

              {/* Dados de Pagamento - sempre visível para edição */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Pagamento
                    {pagamentoConfirmado && (
                      <Badge variant="default" className="bg-green-500 ml-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmado
                      </Badge>
                    )}
                  </h4>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditData({
                          tipo_negociacao: cliente.tipo_negociacao || "",
                          valor_venda: cliente.valor_venda || 0,
                          valor_pendente: cliente.valor_pendente || 0,
                          forma_pagamento: cliente.forma_pagamento || "",
                        });
                        setIsEditing(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 p-3 border rounded-lg bg-secondary/30">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Tipo de Negociação</label>
                        <Select
                          value={editData.tipo_negociacao as string || ""}
                          onValueChange={(value) => setEditData(prev => ({ ...prev, tipo_negociacao: value }))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_NEGOCIACAO.map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>
                                {tipo.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Valor da Venda (R$)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.valor_venda || ""}
                          onChange={(e) => setEditData(prev => ({ ...prev, valor_venda: parseFloat(e.target.value) || 0 }))}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Valor Pendente (R$)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editData.valor_pendente || ""}
                          onChange={(e) => setEditData(prev => ({ ...prev, valor_pendente: parseFloat(e.target.value) || 0 }))}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Forma de Pagamento</label>
                        <Input
                          value={editData.forma_pagamento as string || ""}
                          onChange={(e) => setEditData(prev => ({ ...prev, forma_pagamento: e.target.value }))}
                          placeholder="Ex: 3x no cartão"
                          className="h-9"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setEditData({});
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={updateCliente.isPending}
                      >
                        {updateCliente.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {cliente.valor_venda && cliente.valor_venda > 0 ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Valor da Venda</p>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(cliente.valor_venda)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-dashed">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Sem valor definido</span>
                        </div>
                      )}
                      {cliente.valor_pendente !== null && cliente.valor_pendente > 0 ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Valor Pendente</p>
                            <span className="text-sm font-semibold text-yellow-600">
                              {formatCurrency(cliente.valor_pendente)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-dashed">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Sem pendência</span>
                        </div>
                      )}
                    </div>
                    {tipoNegociacao ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Receipt className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tipo de Negociação</p>
                          <span className="text-sm font-medium text-primary">
                            {tipoNegociacao.nome}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-dashed">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Tipo de negociação não definido</span>
                      </div>
                    )}
                    {cliente.forma_pagamento && (
                      <div className="p-2 rounded-lg bg-secondary/50">
                        <p className="text-xs text-muted-foreground mb-1">
                          Forma de Pagamento Negociada:
                        </p>
                        <p className="text-sm">{cliente.forma_pagamento}</p>
                      </div>
                    )}
                    {cliente.data_pagamento_confirmado && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                        <Calendar className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">
                          Confirmado em:{" "}
                          {format(
                            parseISO(cliente.data_pagamento_confirmado),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    )}
                    {/* Botão de confirmar pagamento */}
                    {isEmAplicacao && !pagamentoConfirmado && (
                      <Button
                        onClick={handleConfirmPayment}
                        disabled={isConfirmingPayment}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isConfirmingPayment ? "Confirmando..." : "Confirmar Pagamento e Mover para Ganho"}
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Responsáveis */}
              <div className="space-y-3 mt-6">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Responsáveis
                </h4>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    STR Responsável: {cliente.str_responsavel_nome}
                  </span>
                </div>
                {cliente.closer_responsavel_nome && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Closer Responsável: {cliente.closer_responsavel_nome}
                    </span>
                  </div>
                )}
              </div>

              {/* Observações */}
              {cliente.observacoes && (
                <div className="space-y-2 mt-6">
                  <h4 className="font-semibold text-sm text-muted-foreground">
                    Observações
                  </h4>
                  <p className="text-sm bg-secondary/50 p-3 rounded-lg">
                    {cliente.observacoes}
                  </p>
                </div>
              )}

              {/* Origem */}
              {cliente.origem_lead && (
                <div className="mt-6">
                  <Badge variant="outline">
                    Origem Lead: {cliente.origem_lead}
                  </Badge>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="historico" className="mt-4">
            {/* Adicionar nota */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Adicionar nota..."
                value={novaNota}
                onChange={(e) => setNovaNota(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNota()}
              />
              <Button
                size="icon"
                onClick={handleAddNota}
                disabled={!novaNota.trim() || addNota.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Timeline */}
            <ScrollArea className="max-h-[350px] pr-4">
              <div className="space-y-3">
                {historico.map((item) => {
                  const etapaAnterior = ETAPAS_PIPELINE.find(
                    (e) => e.id === item.etapa_anterior
                  );
                  const etapaNova = ETAPAS_PIPELINE.find(
                    (e) => e.id === item.etapa_nova
                  );

                  return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {getHistoricoIcon(item.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {getHistoricoLabel(item.tipo)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(
                              parseISO(item.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>

                        {item.tipo === "mudanca_etapa" && (
                          <div className="flex items-center gap-2 text-sm">
                            {etapaAnterior && (
                              <Badge
                                variant="outline"
                                style={{ borderColor: etapaAnterior.cor }}
                              >
                                {etapaAnterior.nome}
                              </Badge>
                            )}
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            {etapaNova && (
                              <Badge
                                style={{ backgroundColor: etapaNova.cor }}
                              >
                                {etapaNova.nome}
                              </Badge>
                            )}
                          </div>
                        )}

                        {item.nota && (
                          <p className="text-sm mt-1">{item.nota}</p>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">
                          por {item.usuario_nome}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {historico.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    Nenhum histórico encontrado
                  </p>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}