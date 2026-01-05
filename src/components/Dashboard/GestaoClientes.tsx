import { useState } from "react";
import { Plus, Edit, Trash2, Building2, Mail, Phone, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, Cliente } from "@/hooks/useClientes";
import { useAuditLog } from "@/hooks/useAuditLog";
import { usePermissions } from "@/hooks/usePermissions";

export function GestaoClientes() {
  const { data: clientes, isLoading } = useClientes();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();
  const { logAction } = useAuditLog();
  const { clientes: clientesPermissions } = usePermissions();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    empresa: '',
    ativo: true,
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      empresa: '',
      ativo: true,
    });
    setEditingCliente(null);
  };

  const handleOpenDialog = (cliente?: Cliente) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nome: cliente.nome,
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        empresa: cliente.empresa || '',
        ativo: cliente.ativo,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      if (editingCliente) {
        await updateCliente.mutateAsync({
          id: editingCliente.id,
          nome: formData.nome,
          email: formData.email || null,
          telefone: formData.telefone || null,
          empresa: formData.empresa || null,
          ativo: formData.ativo,
        });
        await logAction({
          action: 'update',
          tableName: 'clientes',
          recordId: editingCliente.id,
          oldData: { ...editingCliente } as unknown as Record<string, unknown>,
          newData: { ...formData } as unknown as Record<string, unknown>,
        });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        const newCliente = await createCliente.mutateAsync({
          nome: formData.nome,
          email: formData.email || null,
          telefone: formData.telefone || null,
          empresa: formData.empresa || null,
          ativo: formData.ativo,
        });
        await logAction({
          action: 'create',
          tableName: 'clientes',
          recordId: newCliente.id,
          newData: formData,
        });
        toast.success('Cliente criado com sucesso!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (cliente: Cliente) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`)) {
      return;
    }

    try {
      await deleteCliente.mutateAsync(cliente.id);
      await logAction({
        action: 'delete',
        tableName: 'clientes',
        recordId: cliente.id,
        oldData: { ...cliente } as unknown as Record<string, unknown>,
      });
      toast.success('Cliente excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleToggleAtivo = async (cliente: Cliente) => {
    try {
      await updateCliente.mutateAsync({
        id: cliente.id,
        ativo: !cliente.ativo,
      });
      await logAction({
        action: 'update',
        tableName: 'clientes',
        recordId: cliente.id,
        oldData: { ativo: cliente.ativo },
        newData: { ativo: !cliente.ativo },
      });
      toast.success(`Cliente ${!cliente.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status do cliente:', error);
      toast.error('Erro ao alterar status do cliente');
    }
  };

  if (!clientesPermissions.canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Você não tem permissão para visualizar clientes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gestão de Clientes/Contratantes
        </CardTitle>
        {clientesPermissions.canCreate && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Ativo</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCliente.isPending || updateCliente.isPending}>
                    {editingCliente ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : !clientes?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhum cliente cadastrado.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.empresa || '-'}</TableCell>
                  <TableCell>
                    {cliente.email ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" />
                        {cliente.email}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {cliente.telefone ? (
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {cliente.telefone}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={cliente.ativo ? "default" : "secondary"}
                      className="gap-1"
                    >
                      {cliente.ativo ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {clientesPermissions.canEdit && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleAtivo(cliente)}
                            title={cliente.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {cliente.ativo ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(cliente)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {clientesPermissions.canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cliente)}
                          className="text-destructive hover:text-destructive"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
