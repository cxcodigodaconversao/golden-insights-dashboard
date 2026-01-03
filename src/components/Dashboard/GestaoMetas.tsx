import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, Save, Trash2, Users, Headphones } from "lucide-react";
import { useMetas, useCreateMeta, useDeleteMeta } from "@/hooks/useMetas";
import { useClosers, useSdrs } from "@/hooks/useAtendimentos";
import { format, startOfMonth, addMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface GestaoMetasProps {
  times?: { id: string; nome: string; cor: string | null }[];
}

export function GestaoMetas({ times = [] }: GestaoMetasProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => 
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [selectedTipo, setSelectedTipo] = useState<"closer" | "sdr">("closer");
  const [selectedReferencia, setSelectedReferencia] = useState<string>("");
  const [metaVendas, setMetaVendas] = useState("");
  const [metaReceita, setMetaReceita] = useState("");
  const [metaAgendamentos, setMetaAgendamentos] = useState("");

  const { data: metas = [], isLoading } = useMetas(selectedMonth);
  const { data: closers = [] } = useClosers(true);
  const { data: sdrs = [] } = useSdrs(true);
  const createMeta = useCreateMeta();
  const deleteMeta = useDeleteMeta();

  const months = useMemo(() => {
    const result = [];
    for (let i = -3; i <= 6; i++) {
      const date = addMonths(startOfMonth(new Date()), i);
      result.push({
        value: format(date, "yyyy-MM-dd"),
        label: format(date, "MMMM yyyy", { locale: ptBR }),
      });
    }
    return result;
  }, []);

  const references = selectedTipo === "closer" ? closers : sdrs;

  const handleSave = () => {
    if (!selectedReferencia) {
      toast.error("Selecione um " + (selectedTipo === "closer" ? "closer" : "SDR"));
      return;
    }

    createMeta.mutate({
      tipo: selectedTipo,
      referencia_id: selectedReferencia,
      mes: selectedMonth,
      meta_vendas: parseInt(metaVendas) || 0,
      meta_receita: parseFloat(metaReceita) || 0,
      meta_agendamentos: parseInt(metaAgendamentos) || 0,
    });

    // Reset form
    setSelectedReferencia("");
    setMetaVendas("");
    setMetaReceita("");
    setMetaAgendamentos("");
  };

  const getReferenciaNome = (meta: { tipo: string; referencia_id: string }) => {
    if (meta.tipo === "closer") {
      return closers.find(c => c.id === meta.referencia_id)?.nome || "Desconhecido";
    }
    return sdrs.find(s => s.id === meta.referencia_id)?.nome || "Desconhecido";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredMetas = metas.filter(m => m.tipo === selectedTipo);

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Definir Meta Mensal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select 
                value={selectedTipo} 
                onValueChange={(v: "closer" | "sdr") => {
                  setSelectedTipo(v);
                  setSelectedReferencia("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="closer">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Closer
                    </div>
                  </SelectItem>
                  <SelectItem value="sdr">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4" />
                      SDR
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{selectedTipo === "closer" ? "Closer" : "SDR"}</Label>
              <Select value={selectedReferencia} onValueChange={setSelectedReferencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {references.filter(r => r.ativo).map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {selectedTipo === "closer" && (
              <div className="space-y-2">
                <Label>Meta de Receita (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 50000"
                  value={metaReceita}
                  onChange={e => setMetaReceita(e.target.value)}
                />
              </div>
            )}

            {selectedTipo === "sdr" && (
              <>
                <div className="space-y-2">
                  <Label>Meta de Vendas</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 10"
                    value={metaVendas}
                    onChange={e => setMetaVendas(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meta de Receita (R$)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 50000"
                    value={metaReceita}
                    onChange={e => setMetaReceita(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Meta de Agendamentos</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 30"
                    value={metaAgendamentos}
                    onChange={e => setMetaAgendamentos(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <Button 
            onClick={handleSave} 
            disabled={createMeta.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar Meta
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">
            Metas de {selectedTipo === "closer" ? "Closers" : "SDRs"} - {format(parseISO(selectedMonth), "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : filteredMetas.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma meta definida para este período.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  {selectedTipo === "closer" && (
                    <TableHead className="text-right">Meta Receita</TableHead>
                  )}
                  {selectedTipo === "sdr" && (
                    <>
                      <TableHead className="text-right">Meta Vendas</TableHead>
                      <TableHead className="text-right">Meta Receita</TableHead>
                      <TableHead className="text-right">Meta Agendamentos</TableHead>
                    </>
                  )}
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetas.map(meta => (
                  <TableRow key={meta.id}>
                    <TableCell className="font-medium">{getReferenciaNome(meta)}</TableCell>
                    {selectedTipo === "closer" && (
                      <TableCell className="text-right">{formatCurrency(meta.meta_receita)}</TableCell>
                    )}
                    {selectedTipo === "sdr" && (
                      <>
                        <TableCell className="text-right">{meta.meta_vendas}</TableCell>
                        <TableCell className="text-right">{formatCurrency(meta.meta_receita)}</TableCell>
                        <TableCell className="text-right">{meta.meta_agendamentos}</TableCell>
                      </>
                    )}
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMeta.mutate(meta.id)}
                        disabled={deleteMeta.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
