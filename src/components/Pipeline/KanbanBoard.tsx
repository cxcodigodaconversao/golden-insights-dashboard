import { useState, useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { LeadsFilters } from "./LeadsFilters";
import { ClienteDetailModal } from "./ClienteDetailModal";
import {
  ClientePipeline,
  ETAPAS_PIPELINE,
  useClientesPipeline,
  useMoveClienteEtapa,
} from "@/hooks/usePipeline";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

interface KanbanBoardProps {
  strs: { id: string; nome: string }[];
}

export function KanbanBoard({ strs }: KanbanBoardProps) {
  const { isAdmin, isLider, isVendedor, isSdr, profile } = useAuth();
  const { data: clientes = [], isLoading } = useClientesPipeline();
  const moveCliente = useMoveClienteEtapa();

  const [search, setSearch] = useState("");
  const [temperatura, setTemperatura] = useState<string | null>(null);
  const [strResponsavel, setStrResponsavel] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<ClientePipeline | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Filtrar clientes
  const filteredClientes = useMemo(() => {
    let filtered = clientes;

    // Busca por nome ou WhatsApp
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nome.toLowerCase().includes(searchLower) ||
          c.whatsapp.includes(search)
      );
    }

    // Filtro por temperatura
    if (temperatura) {
      filtered = filtered.filter((c) => c.temperatura === temperatura);
    }

    // Filtro por SDR responsável
    if (strResponsavel) {
      filtered = filtered.filter(
        (c) => c.str_responsavel_id === strResponsavel
      );
    }

    return filtered;
  }, [clientes, search, temperatura, strResponsavel]);

  // Agrupar por etapa
  const clientesPorEtapa = useMemo(() => {
    const grouped: Record<string, ClientePipeline[]> = {};
    ETAPAS_PIPELINE.forEach((etapa) => {
      grouped[etapa.id] = filteredClientes.filter(
        (c) => c.etapa_atual === etapa.id
      );
    });
    return grouped;
  }, [filteredClientes]);

  // Determinar etapas visíveis baseado no role
  const etapasVisiveis = useMemo(() => {
    if (isAdmin || isLider) {
      return ETAPAS_PIPELINE;
    }
    if (isVendedor) {
      // Closer vê apenas etapas avançadas
      return ETAPAS_PIPELINE.filter((e) =>
        ["proposta_enviada", "em_negociacao", "fechamento_pendente", "ganho", "perdido"].includes(e.id)
      );
    }
    if (isSdr) {
      // SDR vê apenas suas etapas iniciais
      return ETAPAS_PIPELINE.filter((e) =>
        ["primeiro_contato", "em_qualificacao", "proposta_enviada"].includes(e.id)
      );
    }
    return ETAPAS_PIPELINE;
  }, [isAdmin, isLider, isVendedor, isSdr]);

  // Handler de drag and drop
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se não tem destino ou é o mesmo lugar
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Verificar permissão de mover para a etapa destino
    const etapaDestino = destination.droppableId;
    const etapaOrigem = source.droppableId;

    // SDR só pode mover entre etapas iniciais
    if (isSdr && !["primeiro_contato", "em_qualificacao", "proposta_enviada"].includes(etapaDestino)) {
      return;
    }

    // Closer só pode mover para ganho ou perdido
    if (isVendedor && !["ganho", "perdido", "proposta_enviada", "em_negociacao", "fechamento_pendente"].includes(etapaDestino)) {
      return;
    }

    moveCliente.mutate({
      id: draggableId,
      etapaAnterior: etapaOrigem,
      etapaNova: etapaDestino,
    });
  };

  const handleCardClick = (cliente: ClientePipeline) => {
    setSelectedCliente(cliente);
    setDetailModalOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setTemperatura(null);
    setStrResponsavel(null);
  };

  const hasActiveFilters = !!search || !!temperatura || !!strResponsavel;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3 h-12">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="min-w-[280px]">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LeadsFilters
        search={search}
        onSearchChange={setSearch}
        temperatura={temperatura}
        onTemperaturaChange={setTemperatura}
        strResponsavel={strResponsavel}
        onStrResponsavelChange={setStrResponsavel}
        strs={strs}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory md:snap-none">
          {etapasVisiveis.map((etapa) => (
            <div key={etapa.id} className="snap-center">
              <KanbanColumn
                etapa={etapa}
                clientes={clientesPorEtapa[etapa.id] || []}
                onCardClick={handleCardClick}
              />
            </div>
          ))}
        </div>
      </DragDropContext>

      <ClienteDetailModal
        cliente={selectedCliente}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
      />
    </div>
  );
}
