import { Droppable } from "@hello-pangea/dnd";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanCard } from "./KanbanCard";
import { ClientePipeline } from "@/hooks/usePipeline";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  etapa: {
    id: string;
    nome: string;
    cor: string;
  };
  clientes: ClientePipeline[];
  onCardClick: (cliente: ClientePipeline) => void;
}

export function KanbanColumn({
  etapa,
  clientes,
  onCardClick,
}: KanbanColumnProps) {
  const valorTotal = clientes.reduce(
    (sum, c) => sum + (c.valor_potencial || 0),
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px] bg-secondary/30 rounded-lg">
      {/* Header da coluna */}
      <div
        className="p-3 rounded-t-lg"
        style={{ backgroundColor: `${etapa.cor}20` }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: etapa.cor }}
            />
            <h3 className="font-semibold text-sm text-foreground">
              {etapa.nome}
            </h3>
          </div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: etapa.cor,
              color: "white",
            }}
          >
            {clientes.length}
          </span>
        </div>
        {valorTotal > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(valorTotal)}
          </p>
        )}
      </div>

      {/* Área droppable com cards */}
      <Droppable droppableId={etapa.id}>
        {(provided, snapshot) => (
          <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "p-2 space-y-2 min-h-[100px] transition-colors",
                snapshot.isDraggingOver && "bg-primary/5"
              )}
            >
              {clientes.map((cliente, index) => (
                <KanbanCard
                  key={cliente.id}
                  cliente={cliente}
                  index={index}
                  onClick={() => onCardClick(cliente)}
                />
              ))}
              {provided.placeholder}

              {clientes.length === 0 && !snapshot.isDraggingOver && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  Nenhum cliente nesta etapa
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Droppable>
    </div>
  );
}
