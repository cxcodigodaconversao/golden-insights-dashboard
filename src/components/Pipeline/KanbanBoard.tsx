import { useState, useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { KanbanColumn } from "./KanbanColumn";
import { LeadsFilters } from "./LeadsFilters";
import { ClienteDetailModal } from "./ClienteDetailModal";
import { FechamentoVendaModal } from "./FechamentoVendaModal";
import {
  ClientePipeline,
  ETAPAS_PIPELINE,
  useClientesPipeline,
  useMoveClienteEtapa,
  useUpdateClientePipeline,
} from "@/hooks/usePipeline";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KanbanBoardProps {
  strs: { id: string; nome: string }[];
}

export function KanbanBoard({ strs }: KanbanBoardProps) {
  const { isAdmin, isLider, isVendedor, isSdr, profile, user } = useAuth();
  const { data: clientes = [], isLoading } = useClientesPipeline();
  const moveCliente = useMoveClienteEtapa();
  const updateCliente = useUpdateClientePipeline();

  const [search, setSearch] = useState("");
  const [temperatura, setTemperatura] = useState<string | null>(null);
  const [strResponsavel, setStrResponsavel] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<ClientePipeline | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [fechamentoModalOpen, setFechamentoModalOpen] = useState(false);
  const [clienteParaFechamento, setClienteParaFechamento] = useState<ClientePipeline | null>(null);
  const [pendingMove, setPendingMove] = useState<{ id: string; etapaAnterior: string } | null>(null);

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
      // Closer vê apenas etapas avançadas incluindo aplicação
      return ETAPAS_PIPELINE.filter((e) =>
        ["proposta_enviada", "em_negociacao", "fechamento_pendente", "aplicacao", "ganho", "perdido"].includes(e.id)
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

    // Closer só pode mover para etapas permitidas incluindo aplicação
    if (isVendedor && !["ganho", "perdido", "proposta_enviada", "em_negociacao", "fechamento_pendente", "aplicacao"].includes(etapaDestino)) {
      return;
    }

    // Se estiver movendo para "aplicacao", abrir modal de fechamento
    if (etapaDestino === "aplicacao") {
      const clienteMovido = clientes.find(c => c.id === draggableId);
      if (clienteMovido) {
        setClienteParaFechamento(clienteMovido);
        setPendingMove({ id: draggableId, etapaAnterior: etapaOrigem });
        setFechamentoModalOpen(true);
        return;
      }
    }

    moveCliente.mutate({
      id: draggableId,
      etapaAnterior: etapaOrigem,
      etapaNova: etapaDestino,
    });
  };

  const handleFechamentoConfirm = async (data: {
    valor_venda: number;
    valor_pendente: number;
    tipo_negociacao: string;
    forma_pagamento: string;
  }) => {
    if (!pendingMove || !clienteParaFechamento || !user || !profile) return;

    try {
      // Atualizar cliente com dados de fechamento e mover para aplicação
      await supabase
        .from("clientes_pipeline")
        .update({
          valor_venda: data.valor_venda,
          valor_pendente: data.valor_pendente,
          tipo_negociacao: data.tipo_negociacao,
          forma_pagamento: data.forma_pagamento,
          etapa_atual: "aplicacao",
          etapa_atualizada_em: new Date().toISOString(),
        })
        .eq("id", pendingMove.id);

      // Registrar no histórico
      await supabase.from("historico_pipeline").insert({
        cliente_id: pendingMove.id,
        etapa_anterior: pendingMove.etapaAnterior,
        etapa_nova: "aplicacao",
        usuario_id: user.id,
        usuario_nome: profile.nome,
        tipo: "mudanca_etapa",
        nota: `Fechamento de venda - ${data.tipo_negociacao} - R$ ${data.valor_venda.toFixed(2)}`,
      });

      toast.success("Venda registrada! Cliente movido para Aplicação.");
      setFechamentoModalOpen(false);
      setClienteParaFechamento(null);
      setPendingMove(null);

      // Invalidar queries
      window.location.reload();
    } catch (error) {
      console.error("Erro ao registrar fechamento:", error);
      toast.error("Erro ao registrar fechamento");
    }
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

      <FechamentoVendaModal
        cliente={clienteParaFechamento}
        open={fechamentoModalOpen}
        onOpenChange={(open) => {
          setFechamentoModalOpen(open);
          if (!open) {
            setClienteParaFechamento(null);
            setPendingMove(null);
          }
        }}
        onConfirm={handleFechamentoConfirm}
      />
    </div>
  );
}
