import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, UserCheck, UserX, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface GestaoClosersProps {
  closers: { id: string; nome: string; ativo: boolean }[];
}

export function GestaoClosers({ closers }: GestaoClosersProps) {
  const queryClient = useQueryClient();
  const [novoCloser, setNovoCloser] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingCloser, setEditingCloser] = useState<{ id: string; nome: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddCloser = async () => {
    if (!novoCloser.trim()) {
      toast.error("Digite o nome do closer");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("closers").insert({ nome: novoCloser.trim() });
      if (error) throw error;

      toast.success("Closer adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["closers"] });
      setNovoCloser("");
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

  const handleEdit = (closer: { id: string; nome: string }) => {
    setEditingCloser({ ...closer });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCloser || !editingCloser.nome.trim()) {
      toast.error("Digite o nome do closer");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("closers")
        .update({ nome: editingCloser.nome.trim() })
        .eq("id", editingCloser.id);

      if (error) throw error;

      toast.success("Closer atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["closers"] });
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

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Gestão de Closers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex gap-3">
          <Input
            value={novoCloser}
            onChange={(e) => setNovoCloser(e.target.value)}
            placeholder="Nome do novo closer"
            className="bg-secondary border-border max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddCloser()}
          />
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
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum closer cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                closers.map((closer) => (
                  <TableRow key={closer.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{closer.nome}</TableCell>
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
