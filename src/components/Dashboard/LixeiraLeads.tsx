import { useState } from "react";
import { useDeletedLeads, useRestoreLead, useHardDeleteLead, useEmptyTrash } from "@/hooks/useLeads";
import { useAccessLog } from "@/hooks/useAccessLog";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, RotateCcw, Search, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function LixeiraLeads() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: deletedLeads = [], isLoading, refetch } = useDeletedLeads();
  const restoreLead = useRestoreLead();
  const hardDeleteLead = useHardDeleteLead();
  const emptyTrash = useEmptyTrash();
  const { logAccess } = useAccessLog();
  const { profile } = useAuth();

  const filteredLeads = deletedLeads.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.telefone?.includes(searchTerm)
  );

  const handleRestore = async (lead: typeof deletedLeads[0]) => {
    try {
      await restoreLead.mutateAsync(lead.id);
      await logAccess({
        action: "view",
        resourceType: "lead",
        resourceId: lead.id,
        details: {
          action_type: "restore",
          lead_nome: lead.nome,
          restored_by: profile?.nome
        }
      });
      toast.success(`Lead "${lead.nome}" restaurado com sucesso!`);
    } catch (error) {
      toast.error("Erro ao restaurar lead");
    }
  };

  const handleHardDelete = async (lead: typeof deletedLeads[0]) => {
    try {
      await hardDeleteLead.mutateAsync(lead.id);
      await logAccess({
        action: "delete",
        resourceType: "lead",
        resourceId: lead.id,
        details: {
          action_type: "hard_delete",
          lead_nome: lead.nome,
          deleted_permanently_by: profile?.nome
        }
      });
      toast.success(`Lead "${lead.nome}" excluído permanentemente!`);
    } catch (error) {
      toast.error("Erro ao excluir lead permanentemente");
    }
  };

  const handleEmptyTrash = async () => {
    try {
      const count = deletedLeads.length;
      await emptyTrash.mutateAsync();
      await logAccess({
        action: "delete",
        resourceType: "lead",
        details: {
          action_type: "empty_trash",
          count,
          deleted_by: profile?.nome
        }
      });
      toast.success(`${count} leads excluídos permanentemente!`);
    } catch (error) {
      toast.error("Erro ao esvaziar lixeira");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Lixeira de Leads
              {deletedLeads.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {deletedLeads.length} {deletedLeads.length === 1 ? "item" : "itens"}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Leads excluídos podem ser restaurados ou removidos permanentemente
            </CardDescription>
          </div>
          
          {deletedLeads.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Esvaziar Lixeira
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Esvaziar Lixeira?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá excluir permanentemente <strong>{deletedLeads.length}</strong> leads.
                    Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEmptyTrash}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {emptyTrash.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Excluir Tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {deletedLeads.length === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">A lixeira está vazia</p>
          </div>
        ) : (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead>Excluído em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.nome}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {lead.email || "-"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {lead.telefone || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">
                            {lead.deleted_at && format(new Date(lead.deleted_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lead.deleted_at && formatDistanceToNow(new Date(lead.deleted_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRestore(lead)}
                            disabled={restoreLead.isPending}
                          >
                            {restoreLead.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline ml-2">Restaurar</span>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="h-5 w-5 text-destructive" />
                                  Excluir Permanentemente?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Você está prestes a excluir permanentemente o lead <strong>"{lead.nome}"</strong>.
                                  Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleHardDelete(lead)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {hardDeleteLead.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Excluir Permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredLeads.length === 0 && searchTerm && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum lead encontrado com "{searchTerm}"</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
