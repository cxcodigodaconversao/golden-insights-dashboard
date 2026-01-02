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

interface GestaoSDRsProps {
  sdrs: { id: string; nome: string; ativo: boolean }[];
}

export function GestaoSDRs({ sdrs }: GestaoSDRsProps) {
  const queryClient = useQueryClient();
  const [novoSdr, setNovoSdr] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingSdr, setEditingSdr] = useState<{ id: string; nome: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddSdr = async () => {
    if (!novoSdr.trim()) {
      toast.error("Digite o nome do SDR");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("sdrs").insert({ nome: novoSdr.trim() });
      if (error) throw error;

      toast.success("SDR adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["sdrs"] });
      setNovoSdr("");
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

  const handleEdit = (sdr: { id: string; nome: string }) => {
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
        .update({ nome: editingSdr.nome.trim() })
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
        <div className="flex gap-3">
          <Input
            value={novoSdr}
            onChange={(e) => setNovoSdr(e.target.value)}
            placeholder="Nome do novo SDR"
            className="bg-secondary border-border max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddSdr()}
          />
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
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sdrs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum SDR cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                sdrs.map((sdr) => (
                  <TableRow key={sdr.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{sdr.nome}</TableCell>
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
