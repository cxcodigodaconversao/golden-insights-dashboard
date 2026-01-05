import { useMemo } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar, User, DollarSign, Clock } from "lucide-react";
import { ClientePipeline, TEMPERATURAS } from "@/hooks/usePipeline";
import { differenceInDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  cliente: ClientePipeline;
  index: number;
  onClick: () => void;
}

export function KanbanCard({ cliente, index, onClick }: KanbanCardProps) {
  const temperatura = TEMPERATURAS.find((t) => t.id === cliente.temperatura);

  const diasNaEtapa = useMemo(() => {
    if (!cliente.etapa_atualizada_em) return 0;
    return differenceInDays(new Date(), parseISO(cliente.etapa_atualizada_em));
  }, [cliente.etapa_atualizada_em]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatWhatsAppLink = (whatsapp: string) => {
    const numbers = whatsapp.replace(/\D/g, "");
    const withCountry = numbers.startsWith("55") ? numbers : `55${numbers}`;
    return `https://wa.me/${withCountry}`;
  };

  return (
    <Draggable draggableId={cliente.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "p-3 cursor-pointer hover:shadow-md transition-all bg-card border-border/50",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/50 rotate-2"
          )}
          onClick={onClick}
        >
          {/* Header: Nome e Temperatura */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-sm text-foreground line-clamp-1 flex-1">
              {cliente.nome}
            </h4>
            {temperatura && (
              <span className="text-sm" title={temperatura.nome}>
                {temperatura.emoji}
              </span>
            )}
          </div>

          {/* WhatsApp */}
          <a
            href={formatWhatsAppLink(cliente.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3" />
            {cliente.whatsapp}
          </a>

          {/* Valor Potencial */}
          {cliente.valor_potencial && cliente.valor_potencial > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary mb-2">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(cliente.valor_potencial)}
            </div>
          )}

          {/* Footer: SDR e Dias na etapa */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">
                {cliente.str_responsavel_nome.split(" ")[0]}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {cliente.data_proximo_contato && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Calendar className="h-2.5 w-2.5 mr-1" />
                  {format(parseISO(cliente.data_proximo_contato), "dd/MM", {
                    locale: ptBR,
                  })}
                </Badge>
              )}

              {diasNaEtapa > 0 && (
                <Badge
                  variant={diasNaEtapa > 7 ? "destructive" : "secondary"}
                  className="text-[10px] px-1.5 py-0"
                >
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  {diasNaEtapa}d
                </Badge>
              )}
            </div>
          </div>
        </Card>
      )}
    </Draggable>
  );
}
