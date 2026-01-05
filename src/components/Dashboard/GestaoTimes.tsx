import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Shield, ShieldOff, Pencil, Trash2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useClientes } from "@/hooks/useClientes";

interface Time {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  cliente_id?: string | null;
}

interface GestaoTimesProps {
  times: Time[];
}

const CORES_PREDEFINIDAS = [
  "#d2bc8f", // Dourado
  "#ef4444", // Vermelho
  "#3b82f6", // Azul
  "#22c55e", // Verde
  "#a855f7", // Roxo
  "#f97316", // Laranja
  "#06b6d4", // Ciano
  "#ec4899", // Rosa
];

export function GestaoTimes({ times }: GestaoTimesProps) {
  const queryClient = useQueryClient();
  const { data: clientes } = useClientes();
  const [novoTime, setNovoTime] = useState("");
  const [novaCor, setNovaCor] = useState(CORES_PREDEFINIDAS[0]);
  const [novoClienteId, setNovoClienteId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingTime, setEditingTime] = useState<Time | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTime = async () => {
    if (!novoTime.trim()) {
      toast.error("Digite o nome do time");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("times").insert({ 
        nome: novoTime.trim(),
        cor: novaCor,
        cliente_id: novoClienteId || null,
      });
      if (error) throw error;

      toast.success("Time adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["times"] });
      setNovoTime("");
      setNovaCor(CORES_PREDEFINIDAS[0]);
      setNovoClienteId("");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este time já existe");
      } else {
        toast.error("Erro ao adicionar time");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("times")
        .update({ ativo: !ativo })
        .eq("id", id);
      if (error) throw error;

      toast.success(ativo ? "Time desativado" : "Time ativado");
      queryClient.invalidateQueries({ queryKey: ["times"] });
    } catch (error) {
      toast.error("Erro ao atualizar time");
    }
  };

  const handleEdit = (time: Time) => {
    setEditingTime({ ...time });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTime || !editingTime.nome.trim()) {
      toast.error("Digite o nome do time");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("times")
        .update({ 
          nome: editingTime.nome.trim(), 
          cor: editingTime.cor,
          cliente_id: editingTime.cliente_id || null,
        })
        .eq("id", editingTime.id);

      if (error) throw error;

      toast.success("Time atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["times"] });
      setIsEditDialogOpen(false);
      setEditingTime(null);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este nome já existe");
      } else {
        toast.error("Erro ao atualizar time");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("times")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Time excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["times"] });
    } catch (error: any) {
      if (error.code === "23503") {
        toast.error("Este time possui membros vinculados e não pode ser excluído");
      } else {
        toast.error("Erro ao excluir time");
      }
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Gestão de Times</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-2">
            <Label className="text-foreground">Nome do Time</Label>
            <Input
              value={novoTime}
              onChange={(e) => setNovoTime(e.target.value)}
              placeholder="Ex: Time Fire"
              className="bg-secondary border-border w-64"
              onKeyDown={(e) => e.key === "Enter" && handleAddTime()}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Cor</Label>
            <div className="flex gap-1">
              {CORES_PREDEFINIDAS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setNovaCor(cor)}
                  className={`w-8 h-8 rounded-md border-2 transition-all ${
                    novaCor === cor ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: cor }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Cliente Vinculado
            </Label>
            <Select value={novoClienteId} onValueChange={setNovoClienteId}>
              <SelectTrigger className="w-48 bg-secondary border-border">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {clientes?.filter(c => c.ativo).map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleAddTime}
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
                <TableHead className="text-muted-foreground">Time</TableHead>
                <TableHead className="text-muted-foreground">Cliente Vinculado</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {times.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum time cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                times.map((time) => {
                  const clienteNome = clientes?.find(c => c.id === time.cliente_id)?.nome;
                  return (
                    <TableRow key={time.id} className="border-border hover:bg-secondary/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: time.cor }}
                          />
                          <span className="text-foreground font-medium">{time.nome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {clienteNome ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {clienteNome}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={time.ativo ? "default" : "secondary"}>
                          {time.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(time)}
                          className="hover:bg-secondary"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(time.id, time.ativo)}
                          className="hover:bg-secondary"
                        >
                          {time.ativo ? (
                            <ShieldOff className="h-4 w-4 text-destructive" />
                          ) : (
                            <Shield className="h-4 w-4 text-success" />
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
                                Tem certeza que deseja excluir o time "{time.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(time.id)}
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
            <DialogTitle className="text-foreground">Editar Time</DialogTitle>
          </DialogHeader>
          {editingTime && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome</Label>
                <Input
                  value={editingTime.nome}
                  onChange={(e) => setEditingTime({ ...editingTime, nome: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Cor</Label>
                <div className="flex gap-1">
                  {CORES_PREDEFINIDAS.map((cor) => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setEditingTime({ ...editingTime, cor })}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        editingTime.cor === cor ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: cor }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Cliente Vinculado
                </Label>
                <Select 
                  value={editingTime.cliente_id || ""} 
                  onValueChange={(value) => setEditingTime({ ...editingTime, cliente_id: value || null })}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {clientes?.filter(c => c.ativo).map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
