import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, UserCheck, UserX, Pencil, Trash2, Percent, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Time {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
}

interface SDR {
  id: string;
  nome: string;
  ativo: boolean;
  time_id?: string | null;
  comissao_percentual?: number | null;
  bonus_extra?: number | null;
}

interface GestaoSDRsProps {
  sdrs: SDR[];
  times?: Time[];
}

export function GestaoSDRs({ sdrs, times = [] }: GestaoSDRsProps) {
  const queryClient = useQueryClient();
  const [novoSdr, setNovoSdr] = useState("");
  const [novoTimeId, setNovoTimeId] = useState<string>("");
  const [novaComissao, setNovaComissao] = useState<string>("");
  const [novoBonus, setNovoBonus] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingSdr, setEditingSdr] = useState<SDR | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddSdr = async () => {
    if (!novoSdr.trim()) {
      toast.error("Digite o nome do SDR");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("sdrs").insert({ 
        nome: novoSdr.trim(),
        time_id: novoTimeId || null,
        comissao_percentual: novaComissao ? parseFloat(novaComissao) : 0,
        bonus_extra: novoBonus ? parseFloat(novoBonus) : 0
      });
      if (error) throw error;

      toast.success("SDR adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["sdrs"] });
      setNovoSdr("");
      setNovoTimeId("");
      setNovaComissao("");
      setNovoBonus("");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este SDR já existe");
      } else {
        toast.error("Erro ao adicionar SDR");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("sdrs")
        .update({ ativo: !ativo })
        .eq("id", id);
      if (error) throw error;

      toast.success(ativo ? "SDR desativado" : "SDR ativado");
      queryClient.invalidateQueries({ queryKey: ["sdrs"] });
    } catch (error) {
      toast.error("Erro ao atualizar SDR");
    }
  };

  const handleEdit = (sdr: SDR) => {
    setEditingSdr({ ...sdr });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSdr || !editingSdr.nome.trim()) {
      toast.error("Digite o nome do SDR");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("sdrs")
        .update({ 
          nome: editingSdr.nome.trim(),
          time_id: editingSdr.time_id || null,
          comissao_percentual: editingSdr.comissao_percentual || 0,
          bonus_extra: editingSdr.bonus_extra || 0
        })
        .eq("id", editingSdr.id);

      if (error) throw error;

      toast.success("SDR atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["sdrs"] });
      setIsEditDialogOpen(false);
      setEditingSdr(null);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este nome já existe");
      } else {
        toast.error("Erro ao atualizar SDR");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sdrs")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("SDR excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["sdrs"] });
    } catch (error: any) {
      if (error.code === "23503") {
        toast.error("Este SDR possui registros vinculados e não pode ser excluído");
      } else {
        toast.error("Erro ao excluir SDR");
      }
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Gestão de SDRs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-foreground">Nome</Label>
            <Input
              value={novoSdr}
              onChange={(e) => setNovoSdr(e.target.value)}
              placeholder="Nome do novo SDR"
              className="bg-secondary border-border w-64"
              onKeyDown={(e) => e.key === "Enter" && handleAddSdr()}
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
            onClick={handleAddSdr}
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
              {sdrs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum SDR cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                sdrs.map((sdr) => {
                  const time = getTime(sdr.time_id);
                  return (
                    <TableRow key={sdr.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="text-foreground font-medium">{sdr.nome}</TableCell>
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
                        {formatPercent(sdr.comissao_percentual)}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {formatCurrency(sdr.bonus_extra)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sdr.ativo ? "default" : "secondary"}>
                          {sdr.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(sdr)}
                            className="hover:bg-secondary"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAtivo(sdr.id, sdr.ativo)}
                            className="hover:bg-secondary"
                          >
                            {sdr.ativo ? (
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
                                  Tem certeza que deseja excluir o SDR "{sdr.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(sdr.id)}
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
            <DialogTitle className="text-foreground">Editar SDR</DialogTitle>
          </DialogHeader>
          {editingSdr && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome</Label>
                <Input
                  value={editingSdr.nome}
                  onChange={(e) => setEditingSdr({ ...editingSdr, nome: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              {timesAtivos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-foreground">Time</Label>
                  <Select 
                    value={editingSdr.time_id || ""} 
                    onValueChange={(value) => setEditingSdr({ ...editingSdr, time_id: value || null })}
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
                    value={editingSdr.comissao_percentual || ""}
                    onChange={(e) => setEditingSdr({ ...editingSdr, comissao_percentual: e.target.value ? parseFloat(e.target.value) : null })}
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
                    value={editingSdr.bonus_extra || ""}
                    onChange={(e) => setEditingSdr({ ...editingSdr, bonus_extra: e.target.value ? parseFloat(e.target.value) : null })}
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
    </Card>
  );
}
