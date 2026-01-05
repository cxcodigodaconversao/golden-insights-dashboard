import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useComissaoHistorico, ComissaoHistorico } from "@/hooks/useComissaoHistorico";

interface HistoricoComissaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entidadeTipo: "closer" | "sdr" | "lider";
  entidadeId: string;
  entidadeNome: string;
}

export function HistoricoComissaoDialog({
  open,
  onOpenChange,
  entidadeTipo,
  entidadeId,
  entidadeNome,
}: HistoricoComissaoDialogProps) {
  const { data: historico = [], isLoading } = useComissaoHistorico(entidadeTipo, entidadeId);

  const formatCampo = (campo: string) => {
    return campo === "comissao_percentual" ? "Comissão (%)" : "Bônus Extra (R$)";
  };

  const formatValor = (campo: string, valor: number | null) => {
    if (valor === null) return "-";
    if (campo === "comissao_percentual") {
      return `${valor}%`;
    }
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "closer":
        return "Closer";
      case "sdr":
        return "SDR";
      case "lider":
        return "Líder";
      default:
        return tipo;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <History className="h-5 w-5 text-primary" />
            Histórico de Alterações - {entidadeNome}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Badge variant="outline" className="text-xs">
            {getTipoLabel(entidadeTipo)}
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma alteração registrada para este colaborador.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Data</TableHead>
                  <TableHead className="text-muted-foreground">Campo</TableHead>
                  <TableHead className="text-muted-foreground">Alteração</TableHead>
                  <TableHead className="text-muted-foreground">Alterado Por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground text-sm">
                      {format(parseISO(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatCampo(item.campo_alterado)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {formatValor(item.campo_alterado, item.valor_anterior)}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                          {formatValor(item.campo_alterado, item.valor_novo)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {item.alterado_por_nome}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
