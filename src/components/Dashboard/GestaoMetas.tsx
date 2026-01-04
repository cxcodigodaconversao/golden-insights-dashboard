import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Target, Save, Trash2, Users, Headphones, Gift, Percent } from "lucide-react";
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
  const [comissaoPercentual, setComissaoPercentual] = useState("");
  const [bonusExtra, setBonusExtra] = useState("");
  const [campanhaNome, setCampanhaNome] = useState("");
  const [campanhaAtiva, setCampanhaAtiva] = useState(false);

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
      comissao_percentual: parseFloat(comissaoPercentual) || 0,
      bonus_extra: parseFloat(bonusExtra) || 0,
      campanha_nome: campanhaNome || null,
      campanha_ativa: campanhaAtiva,
    });

    // Reset form
    setSelectedReferencia("");
    setMetaVendas("");
    setMetaReceita("");
    setMetaAgendamentos("");
    setComissaoPercentual("");
    setBonusExtra("");
    setCampanhaNome("");
    setCampanhaAtiva(false);
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

          {/* Commission fields */}
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              Comissão e Bônus
            </h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Comissão (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5"
                  value={comissaoPercentual}
                  onChange={e => setComissaoPercentual(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Bônus Extra (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1000"
                  value={bonusExtra}
                  onChange={e => setBonusExtra(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Nome da Campanha</Label>
                <Input
                  type="text"
                  placeholder="Ex: Campanha de Natal"
                  value={campanhaNome}
                  onChange={e => setCampanhaNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Campanha Ativa?</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch
                    checked={campanhaAtiva}
                    onCheckedChange={setCampanhaAtiva}
                  />
                  <span className="text-sm text-muted-foreground">
                    {campanhaAtiva ? "Sim" : "Não"}
                  </span>
                </div>
              </div>
            </div>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    {selectedTipo === "closer" && (
                      <TableHead className="text-right">Meta Receita</TableHead>
                    )}
                    {selectedTipo === "sdr" && (
                      <>
                        <TableHead className="text-right">Vendas</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">Agend.</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Comissão</TableHead>
                    <TableHead className="text-right">Bônus</TableHead>
                    <TableHead>Campanha</TableHead>
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
                        {meta.comissao_percentual > 0 ? `${meta.comissao_percentual}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {meta.bonus_extra > 0 ? formatCurrency(meta.bonus_extra) : "-"}
                      </TableCell>
                      <TableCell>
                        {meta.campanha_ativa && meta.campanha_nome ? (
                          <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                            <Gift className="h-3 w-3" />
                            {meta.campanha_nome}
                          </Badge>
                        ) : "-"}
                      </TableCell>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
