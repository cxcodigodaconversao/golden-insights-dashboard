import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  useStatusAtendimento,
  useCreateStatusAtendimento,
  useUpdateStatusAtendimento,
  useDeleteStatusAtendimento,
  StatusAtendimento,
} from "@/hooks/useStatusAtendimento";

const ETAPAS_SYNC = [
  { value: "", label: "Nenhuma (manual)" },
  { value: "ganho", label: "Ganho (Venda)" },
  { value: "perdido", label: "Perdido" },
];

export function GestaoStatus() {
  const [novoStatus, setNovoStatus] = useState("");
  const [novoStatusSync, setNovoStatusSync] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editSync, setEditSync] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: statusList = [], isLoading } = useStatusAtendimento(true);
  const createStatus = useCreateStatusAtendimento();
  const updateStatus = useUpdateStatusAtendimento();
  const deleteStatus = useDeleteStatusAtendimento();

  const handleAddStatus = async () => {
    if (!novoStatus.trim()) {
      toast.error("Digite o nome do status");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStatus.mutateAsync({
        nome: novoStatus.trim(),
        sincroniza_etapa: novoStatusSync || null,
        ordem: statusList.length + 1,
      });
      setNovoStatus("");
      setNovoStatusSync("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAtivo = async (status: StatusAtendimento) => {
    await updateStatus.mutateAsync({
      id: status.id,
      data: { ativo: !status.ativo },
    });
  };

  const handleEdit = (status: StatusAtendimento) => {
    setEditingId(status.id);
    setEditNome(status.nome);
    setEditSync(status.sincroniza_etapa);
  };

  const handleSaveEdit = async () => {
    if (!editNome.trim() || !editingId) return;

    await updateStatus.mutateAsync({
      id: editingId,
      data: {
        nome: editNome.trim(),
        sincroniza_etapa: editSync || null,
      },
    });
    setEditingId(null);
    setEditNome("");
    setEditSync(null);
  };

  const handleDelete = async (id: string) => {
    await deleteStatus.mutateAsync(id);
  };

  const getSyncLabel = (sync: string | null) => {
    if (!sync) return null;
    const etapa = ETAPAS_SYNC.find((e) => e.value === sync);
    return etapa?.label || sync;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Gestão de Status de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo status */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Nome do novo status"
            value={novoStatus}
            onChange={(e) => setNovoStatus(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddStatus()}
            className="flex-1"
          />
          <Select value={novoStatusSync} onValueChange={setNovoStatusSync}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sincronizar etapa" />
            </SelectTrigger>
            <SelectContent>
              {ETAPAS_SYNC.map((etapa) => (
                <SelectItem key={etapa.value} value={etapa.value || "none"}>
                  {etapa.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddStatus} disabled={isSubmitting}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Tabela de status */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Sincroniza Etapa</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : statusList.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  Nenhum status cadastrado
                </TableCell>
              </TableRow>
            ) : (
              statusList.map((status) => (
                <TableRow
                  key={status.id}
                  className={!status.ativo ? "opacity-50" : ""}
                >
                  <TableCell className="font-medium">{status.nome}</TableCell>
                  <TableCell>
                    {status.sincroniza_etapa ? (
                      <Badge variant="outline">
                        {getSyncLabel(status.sincroniza_etapa)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={status.ativo ? "default" : "secondary"}
                    >
                      {status.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(status)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleAtivo(status)}
                      >
                        {status.ativo ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Status</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o status "{status.nome}"?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(status.id)}
                              className="bg-destructive text-destructive-foreground"
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

        {/* Dialog de edição */}
        <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Nome do status"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Sincronizar com Etapa</label>
                <Select
                  value={editSync || "none"}
                  onValueChange={(v) => setEditSync(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETAPAS_SYNC.map((etapa) => (
                      <SelectItem key={etapa.value} value={etapa.value || "none"}>
                        {etapa.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingId(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
