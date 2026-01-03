import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Search, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    return matchesSearch && matchesAction && matchesTable;
  });

  const uniqueTables = [...new Set(logs.map(l => l.table_name))];

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge variant="default" className="bg-green-600">Criação</Badge>;
      case 'update':
        return <Badge variant="default" className="bg-blue-600">Atualização</Badge>;
      case 'delete':
        return <Badge variant="destructive">Exclusão</Badge>;
      default:
        return <Badge variant="secondary">{action}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-600',
      lider: 'bg-blue-600',
      vendedor: 'bg-green-600',
      sdr: 'bg-orange-600',
      user: 'bg-gray-600',
    };
    return (
      <Badge variant="outline" className={`${colors[role] || 'bg-gray-600'} text-white border-0`}>
        {role}
      </Badge>
    );
  };

  const formatChanges = (oldData: unknown, newData: unknown) => {
    if (!oldData && newData) {
      return <span className="text-green-500 text-xs">Novo registro</span>;
    }
    if (oldData && !newData) {
      return <span className="text-red-500 text-xs">Registro excluído</span>;
    }
    if (oldData && newData && typeof oldData === 'object' && typeof newData === 'object') {
      const oldObj = oldData as Record<string, unknown>;
      const newObj = newData as Record<string, unknown>;
      const changes: string[] = [];
      Object.keys(newObj).forEach(key => {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push(key);
        }
      });
      if (changes.length === 0) return <span className="text-muted-foreground text-xs">Sem alterações</span>;
      return (
        <span className="text-blue-500 text-xs">
          Campos: {changes.slice(0, 3).join(', ')}{changes.length > 3 ? '...' : ''}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
          </h3>
          <p className="text-sm text-muted-foreground">
            Rastreie todas as alterações feitas no sistema
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário ou tabela..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ações</SelectItem>
            <SelectItem value="create">Criação</SelectItem>
            <SelectItem value="update">Atualização</SelectItem>
            <SelectItem value="delete">Exclusão</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tableFilter} onValueChange={setTableFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tabela" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas tabelas</SelectItem>
            {uniqueTables.map((table) => (
              <SelectItem key={table} value={table}>{table}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Alterações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">{log.user_name}</TableCell>
                    <TableCell>{getRoleBadge(log.user_role)}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell className="text-sm">{log.table_name}</TableCell>
                    <TableCell>{formatChanges(log.old_data, log.new_data)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
