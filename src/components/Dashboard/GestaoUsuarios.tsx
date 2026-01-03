import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useTimes, useClosers, useSdrs } from "@/hooks/useAtendimentos";
import { UserPlus, Loader2, Shield, User, RefreshCw, Crown, Headphones, Trash2 } from "lucide-react";
import { AuditLogViewer } from "./AuditLogViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AppRole = 'admin' | 'lider' | 'vendedor' | 'sdr' | 'user';

interface Profile {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
  closer_id: string | null;
  sdr_id: string | null;
  time_id: string | null;
}

interface UserWithRole extends Profile {
  role: AppRole;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-600' },
  lider: { label: 'Líder', icon: Crown, color: 'bg-blue-600' },
  vendedor: { label: 'Vendedor', icon: User, color: 'bg-green-600' },
  sdr: { label: 'SDR', icon: Headphones, color: 'bg-orange-600' },
  user: { label: 'Usuário', icon: User, color: 'bg-gray-600' },
};

export function GestaoUsuarios() {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { data: times = [] } = useTimes(true);
  const { data: closers = [] } = useClosers(true);
  const { data: sdrs = [] } = useSdrs(true);
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    role: "user" as AppRole,
    time_id: "",
    closer_id: "",
    sdr_id: "",
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userRole = (roles || []).find((r) => r.user_id === profile.id);
        return {
          ...profile,
          role: (userRole?.role as AppRole) || 'user',
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          nome: formData.nome,
          role: formData.role,
          time_id: formData.time_id && formData.time_id !== "none" ? formData.time_id : null,
          closer_id: formData.closer_id && formData.closer_id !== "none" ? formData.closer_id : null,
          sdr_id: formData.sdr_id && formData.sdr_id !== "none" ? formData.sdr_id : null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      await logAction({
        action: 'create',
        tableName: 'profiles',
        recordId: response.data?.user?.id,
        newData: { nome: formData.nome, email: formData.email, role: formData.role },
      });

      toast({
        title: "Usuário criado!",
        description: `${formData.nome} foi adicionado com sucesso.`,
      });

      setFormData({ nome: "", email: "", password: "", role: "user", time_id: "", closer_id: "", sdr_id: "" });
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao criar usuário",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ativo: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      await logAction({
        action: 'update',
        tableName: 'profiles',
        recordId: userId,
        oldData: { ativo: currentStatus, nome: userName },
        newData: { ativo: !currentStatus, nome: userName },
      });

      toast({
        title: currentStatus ? "Usuário desativado" : "Usuário ativado",
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: AppRole, userName: string, currentRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await logAction({
        action: 'update',
        tableName: 'user_roles',
        recordId: userId,
        oldData: { role: currentRole, nome: userName },
        newData: { role: newRole, nome: userName },
      });

      toast({
        title: `Permissão alterada para ${roleConfig[newRole].label}`,
      });

      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a permissão.",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja excluir ${userName}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('create-user', {
        body: { action: 'delete', userId },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      await logAction({
        action: 'delete',
        tableName: 'profiles',
        recordId: userId,
        oldData: { nome: userName },
      });

      toast({ title: "Usuário excluído" });
      fetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado.";
      toast({
        title: "Erro ao excluir",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: AppRole) => {
    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.color} text-white border-0 gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Tabs defaultValue="users" className="space-y-6">
      <TabsList>
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="audit">Histórico de Alterações</TabsTrigger>
      </TabsList>

      <TabsContent value="users" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Usuários do Sistema</h3>
            <p className="text-sm text-muted-foreground">
              Gerencie os usuários e suas permissões
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha Temporária</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: AppRole) => setFormData((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="lider">Líder</SelectItem>
                        <SelectItem value="vendedor">Vendedor</SelectItem>
                        <SelectItem value="sdr">SDR</SelectItem>
                        <SelectItem value="user">Usuário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select
                      value={formData.time_id}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, time_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {times.filter(t => t.ativo).map((time) => (
                          <SelectItem key={time.id} value={time.id}>{time.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(formData.role === 'vendedor') && (
                    <div className="space-y-2">
                      <Label>Vincular a Closer</Label>
                      <Select
                        value={formData.closer_id}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, closer_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um closer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {closers.filter(c => c.ativo).map((closer) => (
                            <SelectItem key={closer.id} value={closer.id}>{closer.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {(formData.role === 'sdr') && (
                    <div className="space-y-2">
                      <Label>Vincular a SDR</Label>
                      <Select
                        value={formData.sdr_id}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, sdr_id: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um SDR" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {sdrs.filter(s => s.ativo).map((sdr) => (
                            <SelectItem key={sdr.id} value={sdr.id}>{sdr.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Usuário'
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhum usuário cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value: AppRole) => updateUserRole(user.id, value, user.nome, user.role)}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue>{getRoleBadge(user.role)}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="lider">Líder</SelectItem>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                            <SelectItem value="sdr">SDR</SelectItem>
                            <SelectItem value="user">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.ativo ? 'outline' : 'destructive'}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, user.ativo, user.nome)}
                        >
                          {user.ativo ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteUser(user.id, user.nome)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      <TabsContent value="audit">
        <AuditLogViewer />
      </TabsContent>
    </Tabs>
  );
}
