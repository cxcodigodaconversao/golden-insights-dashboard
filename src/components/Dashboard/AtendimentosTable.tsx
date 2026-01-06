import { useState } from "react";
import { Atendimento, statusColors, useClosers, useOrigens, useSdrs } from "@/hooks/useAtendimentos";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, Pencil, Trash2, CalendarIcon, History, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useFindOrCreateLead, useAddHistoricoInteracao, useUpdateAtendimentoLeadId } from "@/hooks/useLeads";
import { LeadHistorico } from "./LeadHistorico";
import { ReagendamentoForm } from "./ReagendamentoForm";

interface AtendimentosTableProps {
  data: Atendimento[];
}

const statusOptions = [
  "Em negociação",
  "Venda Confirmada",
  "Venda Reembolsada",
  "Não fechou",
  "Não compareceu",
  "Remarcado",
];

export function AtendimentosTable({ data }: AtendimentosTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");
  const [closerFilter, setCloserFilter] = useState<string>("all");
  
  const [editingItem, setEditingItem] = useState<Atendimento | null>(null);
  const [originalStatus, setOriginalStatus] = useState<string>("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para histórico do lead
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);
  
  // Estado para reagendamento
  const [reagendamentoItem, setReagendamentoItem] = useState<Atendimento | null>(null);
  const [isReagendamentoOpen, setIsReagendamentoOpen] = useState(false);

  // Hooks para leads
  const findOrCreateLead = useFindOrCreateLead();
  const addHistoricoInteracao = useAddHistoricoInteracao();
  const updateAtendimentoLeadId = useUpdateAtendimentoLeadId();

  const { data: closersData = [] } = useClosers();
  const { data: origensData = [] } = useOrigens();
  const { data: sdrsData = [] } = useSdrs();

  const closers = closersData.filter(c => c.ativo).map(c => c.nome);
  const origens = origensData.filter(o => o.ativo).map(o => o.nome);
  const sdrs = sdrsData.filter(s => s.ativo).map(s => s.nome);

  const uniqueStatuses = [...new Set(data.map(a => {
    if (a.status.includes("Venda")) return "Venda";
    return a.status;
  }))];

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      (item.email || "").toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "Venda" && item.status.includes("Venda")) ||
      item.status === statusFilter;
    
    const matchesOrigem = origemFilter === "all" || item.origem === origemFilter;
    const matchesCloser = closerFilter === "all" || item.closer === closerFilter;

    return matchesSearch && matchesStatus && matchesOrigem && matchesCloser;
  });

  const getStatusStyle = (status: string) => {
    for (const [key, style] of Object.entries(statusColors)) {
      if (status.includes(key) || key.includes(status.split(" ")[0])) {
        return style;
      }
    }
    return { bg: "bg-secondary", text: "text-secondary-foreground" };
  };

  const formatCurrency = (value?: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEdit = (item: Atendimento) => {
    setEditingItem({ ...item });
    setOriginalStatus(item.status);
    setIsEditDialogOpen(true);
  };

  const handleViewHistorico = async (item: Atendimento) => {
    // Se o atendimento já tem lead_id, abre direto
    if (item.lead_id) {
      setSelectedLeadId(item.lead_id);
      setIsHistoricoOpen(true);
      return;
    }

    // Caso contrário, busca ou cria o lead
    try {
      const lead = await findOrCreateLead.mutateAsync({
        nome: item.nome,
        telefone: item.telefone,
        email: item.email,
        origem: item.origem,
        sdr: item.sdr,
      });

      // Atualiza o atendimento com o lead_id
      await updateAtendimentoLeadId.mutateAsync({
        atendimentoId: item.id,
        leadId: lead.id,
      });

      // Registra a interação inicial
      await addHistoricoInteracao.mutateAsync({
        lead_id: lead.id,
        atendimento_id: item.id,
        tipo: "agendamento",
        descricao: `Atendimento agendado com closer ${item.closer}`,
        status_novo: item.status,
        usuario_nome: item.sdr,
      });

      setSelectedLeadId(lead.id);
      setIsHistoricoOpen(true);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      toast.error("Erro ao carregar histórico do lead");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    setIsSubmitting(true);
    try {
      const statusChanged = originalStatus !== editingItem.status;

      // Buscar IDs correspondentes aos nomes selecionados
      const selectedSdr = sdrsData.find(s => s.nome === editingItem.sdr);
      const selectedCloser = closersData.find(c => c.nome === editingItem.closer);
      const selectedOrigem = origensData.find(o => o.nome === editingItem.origem);

      // Determinar etapa_atual baseado no status
      let etapa_atual: string | undefined;
      if (editingItem.status === "Venda Confirmada") {
        etapa_atual = "ganho";
      } else if (["Não fechou", "Sem interesse", "Sem dinheiro", "Venda Reembolsada"].includes(editingItem.status)) {
        etapa_atual = "perdido";
      } else if (editingItem.status === "Não compareceu") {
        etapa_atual = "no_show";
      } else if (editingItem.status === "Remarcado") {
        etapa_atual = "reagendado";
      } else {
        etapa_atual = "negociacao";
      }

      const { error } = await supabase
        .from("clientes_pipeline")
        .update({
          nome: editingItem.nome,
          whatsapp: editingItem.telefone || null,
          email: editingItem.email || null,
          sdr_nome: editingItem.sdr,
          sdr_id: selectedSdr?.id || null,
          closer_nome: editingItem.closer,
          closer_id: selectedCloser?.id || null,
          origem_nome: editingItem.origem,
          origem_id: selectedOrigem?.id || null,
          status: editingItem.status,
          etapa_atual: etapa_atual,
          etapa_atualizada_em: new Date().toISOString(),
          valor_potencial: editingItem.valor || null,
          data_call: editingItem.dataCall.toISOString(),
          info_sdr: editingItem.info_sdr || null,
          gravacao: editingItem.gravacao || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      // Se o status mudou, registra no histórico
      if (statusChanged && editingItem.lead_id) {
        let tipo = "status_change";
        let descricao = `Status alterado de "${originalStatus}" para "${editingItem.status}"`;
        
        if (editingItem.status === "Não compareceu") {
          tipo = "no_show";
          descricao = "Cliente não compareceu à call";
        } else if (editingItem.status.includes("Venda")) {
          tipo = "venda";
          descricao = `Venda realizada - ${editingItem.status}`;
        } else if (["Não fechou", "Sem interesse", "Sem dinheiro"].includes(editingItem.status)) {
          tipo = "perda";
          descricao = `Venda perdida - ${editingItem.status}`;
        }

        await addHistoricoInteracao.mutateAsync({
          lead_id: editingItem.lead_id,
          atendimento_id: editingItem.id,
          tipo,
          descricao,
          status_anterior: originalStatus,
          status_novo: editingItem.status,
          usuario_nome: editingItem.closer,
        });
      }

      toast.success("Lead atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clientes-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-dashboard"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clientes_pipeline")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Registro excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["clientes-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline-dashboard"] });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir registro");
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border focus:border-primary"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os status</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={origemFilter} onValueChange={setOrigemFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas as origens</SelectItem>
            {origensData.map(origem => (
              <SelectItem key={origem.id} value={origem.nome}>{origem.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={closerFilter} onValueChange={setCloserFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os closers</SelectItem>
            {closersData.map(closer => (
              <SelectItem key={closer.id} value={closer.nome}>{closer.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>{filteredData.length} atendimentos encontrados</span>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-primary font-semibold">Nome</TableHead>
              <TableHead className="text-primary font-semibold">Status</TableHead>
              <TableHead className="text-primary font-semibold">Closer</TableHead>
              <TableHead className="text-primary font-semibold">SDR</TableHead>
              <TableHead className="text-primary font-semibold">Data</TableHead>
              <TableHead className="text-primary font-semibold">Origem</TableHead>
              <TableHead className="text-primary font-semibold text-right">Valor</TableHead>
              <TableHead className="text-primary font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => {
              const style = getStatusStyle(item.status);
              return (
                <TableRow 
                  key={item.id} 
                  className="border-border hover:bg-secondary/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{item.nome}</p>
                      <p className="text-sm text-muted-foreground">{item.email || "-"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(style.bg, style.text, "border-0")}>
                      {item.status.length > 25 ? item.status.substring(0, 25) + "..." : item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{item.closer}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sdr}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(item.dataCall, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {item.origem}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    item.valor ? "text-primary" : "text-muted-foreground"
                  )}>
                    {formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewHistorico(item)}
                              className="hover:bg-secondary"
                            >
                              <History className="h-4 w-4 text-purple-500" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver histórico do lead</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Botão Reagendar - só aparece para "Não compareceu" */}
                      {item.status === "Não compareceu" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setReagendamentoItem(item);
                                  setIsReagendamentoOpen(true);
                                }}
                                className="hover:bg-secondary"
                              >
                                <RefreshCcw className="h-4 w-4 text-orange-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reagendar atendimento</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="hover:bg-secondary"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-secondary">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o atendimento de "{item.nome}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Atendimento</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">Nome</Label>
                  <Input
                    value={editingItem.nome}
                    onChange={(e) => setEditingItem({ ...editingItem, nome: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Telefone</Label>
                  <Input
                    value={editingItem.telefone || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, telefone: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <Input
                    value={editingItem.email || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Data da Call</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-secondary border-border"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(editingItem.dataCall, "dd/MM/yyyy", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border">
                      <Calendar
                        mode="single"
                        selected={editingItem.dataCall}
                        onSelect={(date) => date && setEditingItem({ ...editingItem, dataCall: date })}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">SDR</Label>
                  <Select
                    value={editingItem.sdr}
                    onValueChange={(value) => setEditingItem({ ...editingItem, sdr: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {sdrs.map((sdr) => (
                        <SelectItem key={sdr} value={sdr}>{sdr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Closer</Label>
                  <Select
                    value={editingItem.closer}
                    onValueChange={(value) => setEditingItem({ ...editingItem, closer: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {closers.map((closer) => (
                        <SelectItem key={closer} value={closer}>{closer}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Origem</Label>
                  <Select
                    value={editingItem.origem}
                    onValueChange={(value) => setEditingItem({ ...editingItem, origem: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {origens.map((origem) => (
                        <SelectItem key={origem} value={origem}>{origem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Status</Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(value) => setEditingItem({ ...editingItem, status: value })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingItem.valor || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, valor: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Link da Gravação</Label>
                  <Input
                    value={editingItem.gravacao || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, gravacao: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Informações do SDR</Label>
                <Textarea
                  value={editingItem.info_sdr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, info_sdr: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border">
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting} className="bg-primary text-primary-foreground">
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico do Lead */}
      <LeadHistorico 
        leadId={selectedLeadId} 
        open={isHistoricoOpen} 
        onOpenChange={setIsHistoricoOpen} 
      />

      {/* Modal de Reagendamento */}
      <ReagendamentoForm
        atendimento={reagendamentoItem}
        open={isReagendamentoOpen}
        onOpenChange={setIsReagendamentoOpen}
      />
    </div>
  );
}
