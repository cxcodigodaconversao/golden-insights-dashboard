import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Check, X, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface GestaoOrigensProps {
  origens: { id: string; nome: string; ativo: boolean }[];
}

export function GestaoOrigens({ origens }: GestaoOrigensProps) {
  const queryClient = useQueryClient();
  const [novaOrigem, setNovaOrigem] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingOrigem, setEditingOrigem] = useState<{ id: string; nome: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOrigem = async () => {
    if (!novaOrigem.trim()) {
      toast.error("Digite o nome da origem");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("origens").insert({ nome: novaOrigem.trim() });
      if (error) throw error;

      toast.success("Origem adicionada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["origens"] });
      setNovaOrigem("");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Esta origem já existe");
      } else {
        toast.error("Erro ao adicionar origem");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("origens")
        .update({ ativo: !ativo })
        .eq("id", id);
      if (error) throw error;

      toast.success(ativo ? "Origem desativada" : "Origem ativada");
      queryClient.invalidateQueries({ queryKey: ["origens"] });
    } catch (error) {
      toast.error("Erro ao atualizar origem");
    }
  };

  const handleEdit = (origem: { id: string; nome: string }) => {
    setEditingOrigem({ ...origem });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingOrigem || !editingOrigem.nome.trim()) {
      toast.error("Digite o nome da origem");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("origens")
        .update({ nome: editingOrigem.nome.trim() })
        .eq("id", editingOrigem.id);

      if (error) throw error;

      toast.success("Origem atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["origens"] });
      setIsEditDialogOpen(false);
      setEditingOrigem(null);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Este nome já existe");
      } else {
        toast.error("Erro ao atualizar origem");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("origens")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Origem excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["origens"] });
    } catch (error: any) {
      if (error.code === "23503") {
        toast.error("Esta origem possui registros vinculados e não pode ser excluída");
      } else {
        toast.error("Erro ao excluir origem");
      }
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Gestão de Origens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex gap-3">
          <Input
            value={novaOrigem}
            onChange={(e) => setNovaOrigem(e.target.value)}
            placeholder="Nome da nova origem"
            className="bg-secondary border-border max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddOrigem()}
          />
          <Button
            onClick={handleAddOrigem}
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
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {origens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma origem cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                origens.map((origem) => (
                  <TableRow key={origem.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{origem.nome}</TableCell>
                    <TableCell>
                      <Badge variant={origem.ativo ? "default" : "secondary"}>
                        {origem.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(origem)}
                          className="hover:bg-secondary"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAtivo(origem.id, origem.ativo)}
                          className="hover:bg-secondary"
                        >
                          {origem.ativo ? (
                            <X className="h-4 w-4 text-destructive" />
                          ) : (
                            <Check className="h-4 w-4 text-success" />
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
                                Tem certeza que deseja excluir a origem "{origem.nome}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(origem.id)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Origem</DialogTitle>
          </DialogHeader>
          {editingOrigem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome</Label>
                <Input
                  value={editingOrigem.nome}
                  onChange={(e) => setEditingOrigem({ ...editingOrigem, nome: e.target.value })}
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
    </Card>
  );
}
