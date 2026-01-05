import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, UserCheck, UserX, Pencil, Trash2, Crown, Percent, Gift, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { registrarAlteracoesComissao } from "@/hooks/useComissaoHistorico";
import { HistoricoComissaoDialog } from "./HistoricoComissaoDialog";

interface Time {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
}

interface Lider {
  id: string;
  nome: string;
  time_id: string | null;
  ativo: boolean;
  comissao_percentual?: number | null;
  bonus_extra?: number | null;
}

interface GestaoLideresProps {
  lideres: Lider[];
  times: Time[];
}

export function GestaoLideres({ lideres, times }: GestaoLideresProps) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [novoLider, setNovoLider] = useState("");
  const [novoTimeId, setNovoTimeId] = useState<string>("");
  const [novaComissao, setNovaComissao] = useState<string>("");
  const [novoBonus, setNovoBonus] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingLider, setEditingLider] = useState<Lider | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historicoDialogOpen, setHistoricoDialogOpen] = useState(false);
  const [selectedLiderHistorico, setSelectedLiderHistorico] = useState<Lider | null>(null);

  // Store original values for comparison
  const originalValuesRef = useRef<{ comissao: number | null; bonus: number | null }>({ comissao: null, bonus: null });

  const getTimeName = (timeId: string | null) => {
    if (!timeId) return null;
    const time = times.find(t => t.id === timeId);
    return time ? time : null;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0,00";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number | null | undefined) => {
    if (!value) return "0%";
    return `${value}%`;
  };

  const handleAddLider = async () => {
    if (!novoLider.trim()) {
      toast.error("Digite o nome do líder");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("lideres_comerciais").insert({ 
        nome: novoLider.trim(),
        time_id: novoTimeId || null,
        comissao_percentual: novaComissao ? parseFloat(novaComissao) : 0,
        bonus_extra: novoBonus ? parseFloat(novoBonus) : 0
      });
      if (error) throw error;

      toast.success("Líder adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["lideres"] });
      setNovoLider("");
      setNovoTimeId("");
      setNovaComissao("");
      setNovoBonus("");
    } catch (error: any) {
      toast.error("Erro ao adicionar líder");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("lideres_comerciais")
        .update({ ativo: !ativo })
        .eq("id", id);
      if (error) throw error;

      toast.success(ativo ? "Líder desativado" : "Líder ativado");
      queryClient.invalidateQueries({ queryKey: ["lideres"] });
    } catch (error) {
      toast.error("Erro ao atualizar líder");
    }
  };

  const handleEdit = (lider: Lider) => {
    setEditingLider({ ...lider });
    originalValuesRef.current = {
      comissao: lider.comissao_percentual ?? null,
      bonus: lider.bonus_extra ?? null,
    };
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLider || !editingLider.nome.trim()) {
      toast.error("Digite o nome do líder");
      return;
    }

    setIsSubmitting(true);
    try {
      // Register changes in history
      if (user) {
        await registrarAlteracoesComissao(
          "lider",
          editingLider.id,
          editingLider.nome,
          originalValuesRef.current.comissao,
          editingLider.comissao_percentual,
          originalValuesRef.current.bonus,
          editingLider.bonus_extra,
          user.id,
          profile?.nome || user.email || "Sistema"
        );
      }

      const { error } = await supabase
        .from("lideres_comerciais")
        .update({ 
          nome: editingLider.nome.trim(),
          time_id: editingLider.time_id || null,
          comissao_percentual: editingLider.comissao_percentual || 0,
          bonus_extra: editingLider.bonus_extra || 0
        })
        .eq("id", editingLider.id);

      if (error) throw error;

      toast.success("Líder atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["lideres"] });
      queryClient.invalidateQueries({ queryKey: ["comissao_historico"] });
      setIsEditDialogOpen(false);
      setEditingLider(null);
    } catch (error: any) {
      toast.error("Erro ao atualizar líder");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lideres_comerciais")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Líder excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["lideres"] });
    } catch (error: any) {
      toast.error("Erro ao excluir líder");
    }
  };

  const handleOpenHistorico = (lider: Lider) => {
    setSelectedLiderHistorico(lider);
    setHistoricoDialogOpen(true);
  };

  const timesAtivos = times.filter(t => t.ativo);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Crown className="h-5 w-5 text-primary" />
          Gestão de Líderes Comerciais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-foreground">Nome do Líder</Label>
            <Input
              value={novoLider}
              onChange={(e) => setNovoLider(e.target.value)}
              placeholder="Nome do líder"
              className="bg-secondary border-border w-64"
              onKeyDown={(e) => e.key === "Enter" && handleAddLider()}
            />
          </div>
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
              className="bg-secondary border-border w-28"
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
              value={novoBonus}
              onChange={(e) => setNovoBonus(e.target.value)}
              placeholder="0"
              className="bg-secondary border-border w-32"
            />
          </div>
          <Button
            onClick={handleAddLider}
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
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Comissão</TableHead>
                <TableHead className="text-muted-foreground">Bônus Extra</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lideres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum líder cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                lideres.map((lider) => {
                  const time = getTimeName(lider.time_id);
                  return (
                    <TableRow key={lider.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-primary" />
                          {lider.nome}
                        </div>
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
                          <span className="text-muted-foreground text-sm">Sem time</span>
                        )}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatPercent(lider.comissao_percentual)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(lider.bonus_extra)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lider.ativo ? "default" : "secondary"}>
                          {lider.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenHistorico(lider)}
                            className="hover:bg-secondary"
                            title="Ver histórico de alterações"
                          >
                            <History className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(lider)}
                            className="hover:bg-secondary"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtivo(lider.id, lider.ativo)}
                            className="hover:bg-secondary"
                          >
                            {lider.ativo ? (
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
                                  Tem certeza que deseja excluir o líder "{lider.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(lider.id)}
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
            <DialogTitle className="text-foreground">Editar Líder</DialogTitle>
          </DialogHeader>
          {editingLider && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome</Label>
                <Input
                  value={editingLider.nome}
                  onChange={(e) => setEditingLider({ ...editingLider, nome: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Time</Label>
                <Select 
                  value={editingLider.time_id || ""} 
                  onValueChange={(value) => setEditingLider({ ...editingLider, time_id: value || null })}
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
                    value={editingLider.comissao_percentual || ""}
                    onChange={(e) => setEditingLider({ ...editingLider, comissao_percentual: e.target.value ? parseFloat(e.target.value) : null })}
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
                    value={editingLider.bonus_extra || ""}
                    onChange={(e) => setEditingLider({ ...editingLider, bonus_extra: e.target.value ? parseFloat(e.target.value) : null })}
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
      {selectedLiderHistorico && (
        <HistoricoComissaoDialog
          open={historicoDialogOpen}
          onOpenChange={setHistoricoDialogOpen}
          entidadeTipo="lider"
          entidadeId={selectedLiderHistorico.id}
          entidadeNome={selectedLiderHistorico.nome}
        />
      )}
    </Card>
  );
}
