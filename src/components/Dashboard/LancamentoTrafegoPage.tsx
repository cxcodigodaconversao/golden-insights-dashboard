import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Pencil, X, Check, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useLancamentosTrafego,
  useCreateLancamentoTrafego,
  useUpdateLancamentoTrafego,
  useDeleteLancamentoTrafego,
  useVendasRegistro,
  useCreateVendaRegistro,
  useDeleteVendaRegistro,
  calcularMetricasLancamento,
} from "@/hooks/useLancamentos";
import { useClosers } from "@/hooks/useAtendimentos";

interface LancamentoFormData {
  data: Date;
  closer_id: string;
  abordados: number;
  agendados: number;
  confirmados: number;
  compareceram: number;
  vendas: number;
  receita: number;
  observacoes: string;
}

interface VendaFormData {
  data: Date;
  closer_id: string;
  ticket: string;
  valor: number;
}

export function LancamentoTrafegoPage() {
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: lancamentos = [], isLoading } = useLancamentosTrafego();
  const { data: vendas = [] } = useVendasRegistro("trafego");
  const { data: closers = [] } = useClosers();

  const createLancamento = useCreateLancamentoTrafego();
  const updateLancamento = useUpdateLancamentoTrafego();
  const deleteLancamento = useDeleteLancamentoTrafego();
  const createVenda = useCreateVendaRegistro();
  const deleteVenda = useDeleteVendaRegistro();

  const lancamentoForm = useForm<LancamentoFormData>({
    defaultValues: {
      data: new Date(),
      closer_id: "",
      abordados: 0,
      agendados: 0,
      confirmados: 0,
      compareceram: 0,
      vendas: 0,
      receita: 0,
      observacoes: "",
    },
  });

  const vendaForm = useForm<VendaFormData>({
    defaultValues: {
      data: new Date(),
      closer_id: "",
      ticket: "",
      valor: 0,
    },
  });

  const watchedLancamentoDate = lancamentoForm.watch("data");
  const watchedLancamentoCloser = lancamentoForm.watch("closer_id");
  const watchedVendaDate = vendaForm.watch("data");
  const watchedVendaCloser = vendaForm.watch("closer_id");

  const onSubmitLancamento = async (data: LancamentoFormData) => {
    try {
      if (editingId) {
        await updateLancamento.mutateAsync({
          id: editingId,
          ...data,
          data: format(data.data, "yyyy-MM-dd"),
        });
        toast.success("Lançamento atualizado!");
        setEditingId(null);
      } else {
        await createLancamento.mutateAsync({
          ...data,
          data: format(data.data, "yyyy-MM-dd"),
        });
        toast.success("Lançamento criado!");
      }
      lancamentoForm.reset();
    } catch (error) {
      toast.error("Erro ao salvar lançamento");
    }
  };

  const onSubmitVenda = async (data: VendaFormData) => {
    try {
      await createVenda.mutateAsync({
        ...data,
        data: format(data.data, "yyyy-MM-dd"),
        tipo: "trafego",
      });
      toast.success("Venda registrada!");
      vendaForm.reset();
    } catch (error) {
      toast.error("Erro ao registrar venda");
    }
  };

  const handleEditLancamento = (lancamento: any) => {
    setEditingId(lancamento.id);
    lancamentoForm.setValue("data", new Date(lancamento.data));
    lancamentoForm.setValue("closer_id", lancamento.closer_id);
    lancamentoForm.setValue("abordados", lancamento.abordados);
    lancamentoForm.setValue("agendados", lancamento.agendados);
    lancamentoForm.setValue("confirmados", lancamento.confirmados);
    lancamentoForm.setValue("compareceram", lancamento.compareceram);
    lancamentoForm.setValue("vendas", lancamento.vendas);
    lancamentoForm.setValue("receita", Number(lancamento.receita));
    lancamentoForm.setValue("observacoes", lancamento.observacoes || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    lancamentoForm.reset();
  };

  const getCloserName = (id: string) => closers.find((c) => c.id === id)?.nome || "N/A";

  const metricas = calcularMetricasLancamento(lancamentos);

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Abordados</p>
            <p className="text-xl font-bold">{metricas.abordados}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Agendados</p>
            <p className="text-xl font-bold">{metricas.agendados}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Confirmados</p>
            <p className="text-xl font-bold">{metricas.confirmados}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Compareceram</p>
            <p className="text-xl font-bold">{metricas.compareceram}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">% Comparec.</p>
            <p className="text-xl font-bold text-primary">{metricas.percentComparecimento.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Vendas</p>
            <p className="text-xl font-bold text-success">{metricas.vendas}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">% Vendas</p>
            <p className="text-xl font-bold text-primary">{metricas.percentVendasCompareceram.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Receita</p>
            <p className="text-xl font-bold text-success">
              {metricas.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lancamentos Column */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                {editingId ? "Editar Lançamento" : "Novo Lançamento - Tráfego"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={lancamentoForm.handleSubmit(onSubmitLancamento)} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(watchedLancamentoDate, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watchedLancamentoDate}
                        onSelect={(date) => date && lancamentoForm.setValue("data", date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Closer</Label>
                  <Select value={watchedLancamentoCloser} onValueChange={(v) => lancamentoForm.setValue("closer_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {closers.map((closer) => (
                        <SelectItem key={closer.id} value={closer.id}>
                          {closer.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Abordados</Label>
                  <Input type="number" {...lancamentoForm.register("abordados", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                  <Label>Agendados</Label>
                  <Input type="number" {...lancamentoForm.register("agendados", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                  <Label>Confirmados</Label>
                  <Input type="number" {...lancamentoForm.register("confirmados", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                  <Label>Compareceram</Label>
                  <Input type="number" {...lancamentoForm.register("compareceram", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                  <Label>Vendas</Label>
                  <Input type="number" {...lancamentoForm.register("vendas", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2">
                  <Label>Receita (R$)</Label>
                  <Input type="number" step="0.01" {...lancamentoForm.register("receita", { valueAsNumber: true })} />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label>Observações</Label>
                  <Textarea {...lancamentoForm.register("observacoes")} placeholder="Observações..." />
                </div>

                <div className="flex gap-2 col-span-2">
                  {editingId ? (
                    <>
                      <Button type="submit" className="gap-2">
                        <Check className="h-4 w-4" /> Salvar
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4" /> Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button type="submit" className="gap-2">
                      <Plus className="h-4 w-4" /> Adicionar
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Lancamentos Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Histórico de Lançamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Closer</TableHead>
                      <TableHead className="text-right">Ag.</TableHead>
                      <TableHead className="text-right">Comp.</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lancamentos.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>{format(new Date(l.data), "dd/MM")}</TableCell>
                        <TableCell>{getCloserName(l.closer_id)}</TableCell>
                        <TableCell className="text-right">{l.agendados}</TableCell>
                        <TableCell className="text-right">{l.compareceram}</TableCell>
                        <TableCell className="text-right text-success">{l.vendas}</TableCell>
                        <TableCell className="text-right">
                          {Number(l.receita).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditLancamento(l)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => deleteLancamento.mutate(l.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendas Column */}
        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <DollarSign className="h-5 w-5 text-success" />
                Registrar Venda - Tráfego
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={vendaForm.handleSubmit(onSubmitVenda)} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(watchedVendaDate, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={watchedVendaDate}
                        onSelect={(date) => date && vendaForm.setValue("data", date)}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Equipe (Closer)</Label>
                  <Select value={watchedVendaCloser} onValueChange={(v) => vendaForm.setValue("closer_id", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {closers.map((closer) => (
                        <SelectItem key={closer.id} value={closer.id}>
                          {closer.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ticket</Label>
                  <Input {...vendaForm.register("ticket")} placeholder="Tipo do ticket" />
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" {...vendaForm.register("valor", { valueAsNumber: true })} />
                </div>

                <div className="col-span-2">
                  <Button type="submit" className="gap-2 w-full">
                    <Plus className="h-4 w-4" /> Registrar Venda
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Vendas Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Histórico de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendas.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{format(new Date(v.data), "dd/MM")}</TableCell>
                        <TableCell>{getCloserName(v.closer_id)}</TableCell>
                        <TableCell>{v.ticket}</TableCell>
                        <TableCell className="text-right text-success">
                          {Number(v.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => deleteVenda.mutate(v.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
