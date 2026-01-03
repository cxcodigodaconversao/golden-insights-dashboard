import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Phone, 
  Mail, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw,
  AlertCircle,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLeadById, useHistoricoByLeadId, useAtendimentosByLeadId } from "@/hooks/useLeads";
import { statusColors } from "@/hooks/useAtendimentos";

interface LeadHistoricoProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  agendamento: <Calendar className="h-4 w-4 text-blue-500" />,
  no_show: <XCircle className="h-4 w-4 text-orange-500" />,
  reagendamento: <RefreshCcw className="h-4 w-4 text-purple-500" />,
  call_realizada: <Phone className="h-4 w-4 text-green-500" />,
  venda: <DollarSign className="h-4 w-4 text-emerald-500" />,
  perda: <XCircle className="h-4 w-4 text-red-500" />,
  status_change: <ArrowRight className="h-4 w-4 text-gray-500" />,
};

const TIPO_LABELS: Record<string, string> = {
  agendamento: "Agendamento",
  no_show: "Não Compareceu",
  reagendamento: "Reagendamento",
  call_realizada: "Call Realizada",
  venda: "Venda",
  perda: "Perda",
  status_change: "Mudança de Status",
};

export function LeadHistorico({ leadId, open, onOpenChange }: LeadHistoricoProps) {
  const { data: lead } = useLeadById(leadId);
  const { data: historico } = useHistoricoByLeadId(leadId);
  const { data: atendimentos } = useAtendimentosByLeadId(leadId);

  const totalAtendimentos = atendimentos?.length || 0;
  const noShows = historico?.filter(h => h.tipo === "no_show").length || 0;
  const reagendamentos = historico?.filter(h => h.tipo === "reagendamento").length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Histórico do Lead
          </DialogTitle>
        </DialogHeader>

        {lead && (
          <div className="space-y-4">
            {/* Informações do Lead */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">{lead.nome}</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                {lead.telefone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{lead.telefone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.origem_primeira && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>Origem: {lead.origem_primeira}</span>
                  </div>
                )}
                {lead.sdr_primeiro && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>SDR: {lead.sdr_primeiro}</span>
                  </div>
                )}
              </div>

              {/* Estatísticas */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{totalAtendimentos}</p>
                  <p className="text-xs text-muted-foreground">Atendimentos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{noShows}</p>
                  <p className="text-xs text-muted-foreground">No-shows</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">{reagendamentos}</p>
                  <p className="text-xs text-muted-foreground">Reagendamentos</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline de Interações */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Timeline de Interações</h4>
              
              <ScrollArea className="h-[300px] pr-4">
                {historico && historico.length > 0 ? (
                  <div className="relative">
                    {/* Linha vertical da timeline */}
                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="space-y-4">
                      {historico.map((item, index) => (
                        <div key={item.id} className="relative flex gap-4 pl-10">
                          {/* Ícone do tipo */}
                          <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border">
                            {TIPO_ICONS[item.tipo] || <Clock className="h-4 w-4 text-gray-500" />}
                          </div>
                          
                          <div className="flex-1 rounded-lg border border-border bg-card p-3">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="text-xs">
                                {TIPO_LABELS[item.tipo] || item.tipo}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.data_interacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            
                            {item.descricao && (
                              <p className="text-sm text-foreground mt-1">{item.descricao}</p>
                            )}
                            
                            {item.status_anterior && item.status_novo && (
                              <div className="flex items-center gap-2 mt-2 text-xs">
                                <span className={`px-2 py-0.5 rounded ${statusColors[item.status_anterior]?.bg || "bg-gray-500"} ${statusColors[item.status_anterior]?.text || "text-white"}`}>
                                  {item.status_anterior}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                <span className={`px-2 py-0.5 rounded ${statusColors[item.status_novo]?.bg || "bg-gray-500"} ${statusColors[item.status_novo]?.text || "text-white"}`}>
                                  {item.status_novo}
                                </span>
                              </div>
                            )}
                            
                            {item.usuario_nome && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Por: {item.usuario_nome}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Clock className="h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhuma interação registrada</p>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Lista de Atendimentos */}
            {atendimentos && atendimentos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Atendimentos</h4>
                  <div className="space-y-2">
                    {atendimentos.map((atendimento) => (
                      <div 
                        key={atendimento.id} 
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-sm">
                            <p className="font-medium text-foreground">
                              {format(new Date(atendimento.data_call), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              Closer: {atendimento.closer}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${statusColors[atendimento.status]?.bg || "bg-gray-500"} ${statusColors[atendimento.status]?.text || "text-white"}`}>
                          {atendimento.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
