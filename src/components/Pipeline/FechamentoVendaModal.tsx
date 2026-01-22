import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, CreditCard, Receipt } from "lucide-react";
import { TIPOS_NEGOCIACAO, ClientePipeline } from "@/hooks/usePipeline";

interface FechamentoVendaModalProps {
  cliente: ClientePipeline | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    valor_venda: number;
    valor_pendente: number;
    tipo_negociacao: string;
    forma_pagamento: string;
  }) => void;
  isPending?: boolean;
}

export function FechamentoVendaModal({
  cliente,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: FechamentoVendaModalProps) {
  const [valorVenda, setValorVenda] = useState("");
  const [valorPendente, setValorPendente] = useState("");
  const [tipoNegociacao, setTipoNegociacao] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");

  const handleConfirm = () => {
    if (!tipoNegociacao || !valorVenda) return;

    onConfirm({
      valor_venda: parseFloat(valorVenda) || 0,
      valor_pendente: parseFloat(valorPendente) || 0,
      tipo_negociacao: tipoNegociacao,
      forma_pagamento: formaPagamento,
    });

    // Reset form
    setValorVenda("");
    setValorPendente("");
    setTipoNegociacao("");
    setFormaPagamento("");
  };

  const handleClose = () => {
    setValorVenda("");
    setValorPendente("");
    setTipoNegociacao("");
    setFormaPagamento("");
    onOpenChange(false);
  };

  const getTipoNegociacaoIcon = (tipo: string) => {
    switch (tipo) {
      case "recorrencia":
        return <Receipt className="h-4 w-4" />;
      case "pix_avista":
        return <DollarSign className="h-4 w-4" />;
      case "cartao_cheio":
        return <CreditCard className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Fechamento de Venda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {cliente && (
            <div className="p-3 bg-secondary/50 rounded-lg">
              <p className="text-sm font-medium">{cliente.nome}</p>
              <p className="text-xs text-muted-foreground">{cliente.whatsapp}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="valor_venda">Valor da Venda *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="valor_venda"
                type="number"
                placeholder="0,00"
                value={valorVenda}
                onChange={(e) => setValorVenda(e.target.value)}
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valor_pendente">Valor Pendente</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="valor_pendente"
                type="number"
                placeholder="0,00"
                value={valorPendente}
                onChange={(e) => setValorPendente(e.target.value)}
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco ou zero se não houver valor pendente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_negociacao">Tipo de Negociação *</Label>
            <Select value={tipoNegociacao} onValueChange={setTipoNegociacao}>
              <SelectTrigger id="tipo_negociacao">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_NEGOCIACAO.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    <div className="flex items-center gap-2">
                      {getTipoNegociacaoIcon(tipo.id)}
                      {tipo.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="forma_pagamento">Forma de Pagamento Negociada</Label>
            <Textarea
              id="forma_pagamento"
              placeholder="Descreva os detalhes do acordo de pagamento..."
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!tipoNegociacao || !valorVenda || isPending}
          >
            {isPending ? "Salvando..." : "Confirmar e Mover para Aplicação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
