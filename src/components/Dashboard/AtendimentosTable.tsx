import { useState } from "react";
import { Atendimento, statusColors, origens, closers } from "@/data/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AtendimentosTableProps {
  data: Atendimento[];
}

export function AtendimentosTable({ data }: AtendimentosTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [origemFilter, setOrigemFilter] = useState<string>("all");
  const [closerFilter, setCloserFilter] = useState<string>("all");

  const uniqueStatuses = [...new Set(data.map(a => {
    if (a.status.includes("Venda")) return "Venda";
    return a.status;
  }))];

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "Venda" && item.status.includes("Venda")) ||
      item.status === statusFilter;
    
    const matchesOrigem = origemFilter === "all" || item.origem === origemFilter;
    const matchesCloser = closerFilter === "all" || item.closer === closerFilter;

    return matchesSearch && matchesStatus && matchesOrigem && matchesCloser;
  });

  const getStatusStyle = (status: string) => {
    for (const [key, style] of Object.entries(statusColors)) {
      if (status.includes(key) || key.includes(status.split(" ")[0])) {
        return style;
      }
    }
    return { bg: "bg-secondary", text: "text-secondary-foreground" };
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border focus:border-primary"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os status</SelectItem>
            {uniqueStatuses.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={origemFilter} onValueChange={setOrigemFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todas as origens</SelectItem>
            {origens.map(origem => (
              <SelectItem key={origem} value={origem}>{origem}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={closerFilter} onValueChange={setCloserFilter}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Todos os closers</SelectItem>
            {closers.map(closer => (
              <SelectItem key={closer} value={closer}>{closer}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>{filteredData.length} atendimentos encontrados</span>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="text-primary font-semibold">Nome</TableHead>
              <TableHead className="text-primary font-semibold">Status</TableHead>
              <TableHead className="text-primary font-semibold">Closer</TableHead>
              <TableHead className="text-primary font-semibold">SDR</TableHead>
              <TableHead className="text-primary font-semibold">Data</TableHead>
              <TableHead className="text-primary font-semibold">Origem</TableHead>
              <TableHead className="text-primary font-semibold text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item, index) => {
              const style = getStatusStyle(item.status);
              return (
                <TableRow 
                  key={item.id} 
                  className="border-border hover:bg-secondary/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{item.nome}</p>
                      <p className="text-sm text-muted-foreground">{item.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(style.bg, style.text, "border-0")}>
                      {item.status.length > 25 ? item.status.substring(0, 25) + "..." : item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-foreground">{item.closer}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sdr}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(item.dataCall, "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-border text-muted-foreground">
                      {item.origem}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    item.valor ? "text-primary" : "text-muted-foreground"
                  )}>
                    {formatCurrency(item.valor)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
