import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, UserCheck, UserX, Pencil, Trash2, Percent, Gift, History, Calendar, Mail, Loader2, Unlink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { registrarAlteracoesComissao } from "@/hooks/useComissaoHistorico";
import { HistoricoComissaoDialog } from "./HistoricoComissaoDialog";
import { useConnectCloserGoogleCalendar, useDisconnectCloserGoogleCalendar } from "@/hooks/useCloserGoogleCalendar";

interface Time {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
}

interface Closer {
  id: string;
  nome: string;
  ativo: boolean;
  time_id?: string | null;
  comissao_percentual?: number | null;
  bonus_extra?: number | null;
  email?: string | null;
  google_calendar_connected?: boolean;
}

interface GestaoClosersProps {
  closers: Closer[];
  times?: Time[];
}

export function GestaoClosers({ closers, times = [] }: GestaoClosersProps) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [novoCloser, setNovoCloser] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoTimeId, setNovoTimeId] = useState<string>("");
  const [novaComissao, setNovaComissao] = useState<string>("");
  const [novoBonus, setNovoBonus] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingCloser, setEditingCloser] = useState<Closer | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [selectedCloserHistorico, setSelectedCloserHistorico] = useState<Closer | null>(null);
  
  const connectGoogleCalendar = useConnectCloserGoogleCalendar();
  const disconnectGoogleCalendar = useDisconnectCloserGoogleCalendar();
  
  // Store original values for comparison
  const originalValuesRef = useRef<{ comissao: number | null; bonus: number | null }>({ comissao: null, bonus: null });

  const getTime = (timeId: string | null | undefined) => {
    if (!timeId) return null;
    return times.find(t => t.id === timeId) || null;
  };

  const timesAtivos = times.filter(t => t.ativo);

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0,00";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number | null | undefined) => {
    if (!value) return "0%";
    return `${value}%`;
  };

  const handleAddCloser = async () => {
    if (!novoCloser.trim()) {
      toast.error("Digite o nome do closer");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("closers").insert({ 
        nome: novoCloser.trim(),
        email: novoEmail.trim() || null,
        time_id: novoTimeId || null,
        comissao_percentual: novaComissao ? parseFloat(novaComissao) : 0,
        bonus_extra: novoBonus ? parseFloat(novoBonus) : 0
      });
      if (error) throw error;

      toast.success("Closer adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["closers"] });
      setNovoCloser("");
      setNovoEmail("");
      setNovoTimeId("");
      setNovaComissao("");
      setNovoBonus("");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este closer já existe");
      } else {
        toast.error("Erro ao adicionar closer");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("closers")
        .update({ ativo: !ativo })
        .eq("id", id);
      if (error) throw error;

      toast.success(ativo ? "Closer desativado" : "Closer ativado");
      queryClient.invalidateQueries({ queryKey: ["closers"] });
    } catch (error) {
      toast.error("Erro ao atualizar closer");
    }
  };

  const handleEdit = (closer: Closer) => {
    setEditingCloser({ ...closer });
    originalValuesRef.current = {
      comissao: closer.comissao_percentual ?? null,
      bonus: closer.bonus_extra ?? null,
    };
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCloser || !editingCloser.nome.trim()) {
      toast.error("Digite o nome do closer");
      return;
    }

    setIsSubmitting(true);
    try {
      // Register changes in history
      if (user) {
        await registrarAlteracoesComissao(
          "closer",
          editingCloser.id,
          editingCloser.nome,
          originalValuesRef.current.comissao,
          editingCloser.comissao_percentual,
          originalValuesRef.current.bonus,
          editingCloser.bonus_extra,
          user.id,
          profile?.nome || user.email || "Sistema"
        );
      }

      const { error } = await supabase
        .from("closers")
        .update({ 
          nome: editingCloser.nome.trim(),
          email: editingCloser.email?.trim() || null,
          time_id: editingCloser.time_id || null,
          comissao_percentual: editingCloser.comissao_percentual || 0,
          bonus_extra: editingCloser.bonus_extra || 0
        })
        .eq("id", editingCloser.id);

      if (error) throw error;

      toast.success("Closer atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["closers"] });
      queryClient.invalidateQueries({ queryKey: ["comissao_historico"] });
      setIsEditDialogOpen(false);
      setEditingCloser(null);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este nome já existe");
      } else {
        toast.error("Erro ao atualizar closer");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("closers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Closer excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["closers"] });
    } catch (error: any) {
      if (error.code === "23503") {
        toast.error("Este closer possui registros vinculados e não pode ser excluído");
      } else {
        toast.error("Erro ao excluir closer");
      }
    }
  };

  const handleOpenHistorico = (closer: Closer) => {
    setSelectedCloserHistorico(closer);
    setHistoricoDialogOpen(true);
  };

  const handleConnectGoogleCalendar = (closer: Closer) => {
    if (!closer.email) {
      toast.error("Adicione um email ao closer antes de conectar o Google Calendar");
      return;
    }
    connectGoogleCalendar.mutate(closer.id);
  };

  const handleDisconnectGoogleCalendar = (closerId: string) => {
    disconnectGoogleCalendar.mutate(closerId);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Gestão de Closers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-foreground">Nome</Label>
            <Input
              value={novoCloser}
              onChange={(e) => setNovoCloser(e.target.value)}
              placeholder="Nome do novo closer"
              className="bg-secondary border-border w-48"
              onKeyDown={(e) => e.key === "Enter" && handleAddCloser()}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </Label>
            <Input
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="bg-secondary border-border w-56"
            />
          </div>
          {timesAtivos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-foreground">Time</Label>
              <Select value={novoTimeId} onValueChange={setNovoTimeId}>
                <SelectTrigger className="w-48 bg-secondary border-border">
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {timesAtivos.map((time) => (
                    <SelectItem key={time.id} value={time.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: time.cor }}
                        />
                        {time.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-1">
              <Percent className="h-3 w-3" /> Comissão (%)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={novaComissao}
              onChange={(e) => setNovaComissao(e.target.value)}
              placeholder="0"
              className="bg-secondary border-border w-24"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-1">
              <Gift className="h-3 w-3" /> Bônus (R$)
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={novoBonus}
              onChange={(e) => setNovoBonus(e.target.value)}
              placeholder="0"
              className="bg-secondary border-border w-28"
            />
          </div>
          <Button
            onClick={handleAddCloser}
            disabled={isAdding}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Lista */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Comissão</TableHead>
                <TableHead className="text-muted-foreground">Bônus Extra</TableHead>
                <TableHead className="text-muted-foreground">Google Calendar</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum closer cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                closers.map((closer) => {
                  const time = getTime(closer.time_id);
                  return (
                    <TableRow key={closer.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-foreground font-medium">{closer.nome}</TableCell>
                      <TableCell className="text-foreground">
                        {closer.email || <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell>
                        {time ? (
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: time.cor,
                              color: time.cor,
                              backgroundColor: `${time.cor}20`
                            }}
                          >
                            {time.nome}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatPercent(closer.comissao_percentual)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(closer.bonus_extra)}
                      </TableCell>
                      <TableCell>
                        {closer.google_calendar_connected ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-green-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              Conectado
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisconnectGoogleCalendar(closer.id)}
                              className="h-7 px-2 text-destructive hover:text-destructive"
                              disabled={disconnectGoogleCalendar.isPending}
                            >
                              <Unlink className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConnectGoogleCalendar(closer)}
                            disabled={connectGoogleCalendar.isPending || !closer.email}
                            className="h-7"
                          >
                            {connectGoogleCalendar.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Calendar className="h-3 w-3 mr-1" />
                            )}
                            Conectar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={closer.ativo ? "default" : "secondary"}>
                          {closer.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenHistorico(closer)}
                            className="hover:bg-secondary"
                            title="Ver histórico de alterações"
                          >
                            <History className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(closer)}
                            className="hover:bg-secondary"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtivo(closer.id, closer.ativo)}
                            className="hover:bg-secondary"
                          >
                            {closer.ativo ? (
                              <UserX className="h-4 w-4 text-destructive" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-success" />
                            )}
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
                                  Tem certeza que deseja excluir o closer "{closer.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(closer.id)}
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
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Closer</DialogTitle>
          </DialogHeader>
          {editingCloser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome</Label>
                <Input
                  value={editingCloser.nome}
                  onChange={(e) => setEditingCloser({ ...editingCloser, nome: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </Label>
                <Input
                  type="email"
                  value={editingCloser.email || ""}
                  onChange={(e) => setEditingCloser({ ...editingCloser, email: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="email@exemplo.com"
                />
              </div>
              {timesAtivos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">Time</Label>
                  <Select 
                    value={editingCloser.time_id || ""} 
                    onValueChange={(value) => setEditingCloser({ ...editingCloser, time_id: value || null })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Selecione o time" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {timesAtivos.map((time) => (
                        <SelectItem key={time.id} value={time.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: time.cor }}
                            />
                            {time.nome}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-1">
                    <Percent className="h-3 w-3" /> Comissão (%)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editingCloser.comissao_percentual || ""}
                    onChange={(e) => setEditingCloser({ ...editingCloser, comissao_percentual: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-secondary border-border"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground flex items-center gap-1">
                    <Gift className="h-3 w-3" /> Bônus Extra (R$)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingCloser.bonus_extra || ""}
                    onChange={(e) => setEditingCloser({ ...editingCloser, bonus_extra: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-secondary border-border"
                    placeholder="0"
                  />
                </div>
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

      {/* Dialog de Histórico */}
      {selectedCloserHistorico && (
        <HistoricoComissaoDialog
          open={historicoDialogOpen}
          onOpenChange={setHistoricoDialogOpen}
          entidadeTipo="closer"
          entidadeId={selectedCloserHistorico.id}
          entidadeNome={selectedCloserHistorico.nome}
        />
      )}
    </Card>
  );
}
