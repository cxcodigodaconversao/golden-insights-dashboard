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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("atendimentos")
        .update({
          nome: editingItem.nome,
          telefone: editingItem.telefone || null,
          email: editingItem.email || null,
          sdr: editingItem.sdr,
          closer: editingItem.closer,
          origem: editingItem.origem,
          status: editingItem.status,
          valor: editingItem.valor || null,
          data_call: editingItem.dataCall.toISOString(),
          info_sdr: editingItem.info_sdr || null,
          gravacao: editingItem.gravacao || null,
        })
        .eq("id", editingItem.id);

      if (error) throw error;

      toast.success("Atendimento atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar atendimento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("atendimentos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Atendimento excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir atendimento");
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
    </div>
  );
}
