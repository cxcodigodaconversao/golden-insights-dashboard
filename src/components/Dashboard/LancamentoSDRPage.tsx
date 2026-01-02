import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Pencil, X, Check, FileSpreadsheet } from "lucide-react";
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
  useLancamentosSDR,
  useCreateLancamentoSDR,
  useUpdateLancamentoSDR,
  useDeleteLancamentoSDR,
  calcularMetricasSDR,
} from "@/hooks/useLancamentos";
import { useSdrs } from "@/hooks/useAtendimentos";
import { Tables } from "@/integrations/supabase/types";

type SDR = Tables<"sdrs">;

interface FormData {
  data: Date;
  sdr_id: string;
  abordados: number;
  responderam: number;
  agendamentos: number;
  vendas_agendamentos: number;
  observacoes: string;
}

export function LancamentoSDRPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: lancamentos = [], isLoading } = useLancamentosSDR();
  const { data: sdrs = [] } = useSdrs();
  const createMutation = useCreateLancamentoSDR();
  const updateMutation = useUpdateLancamentoSDR();
  const deleteMutation = useDeleteLancamentoSDR();

  const { register, handleSubmit, reset, setValue, watch } = useForm<FormData>({
    defaultValues: {
      data: new Date(),
      sdr_id: "",
      abordados: 0,
      responderam: 0,
      agendamentos: 0,
      vendas_agendamentos: 0,
      observacoes: "",
    },
  });

  const watchedDate = watch("data");
  const watchedSdrId = watch("sdr_id");

  const onSubmit = async (data: FormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          ...data,
          data: format(data.data, "yyyy-MM-dd"),
        });
        toast.success("Lançamento atualizado com sucesso!");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync({
          ...data,
          data: format(data.data, "yyyy-MM-dd"),
        });
        toast.success("Lançamento criado com sucesso!");
      }
      reset();
    } catch (error) {
      toast.error("Erro ao salvar lançamento");
      console.error(error);
    }
  };

  const handleEdit = (lancamento: Tables<"lancamentos_sdr">) => {
    setEditingId(lancamento.id);
    setValue("data", new Date(lancamento.data));
    setValue("sdr_id", lancamento.sdr_id);
    setValue("abordados", lancamento.abordados);
    setValue("responderam", lancamento.responderam);
    setValue("agendamentos", lancamento.agendamentos);
    setValue("vendas_agendamentos", lancamento.vendas_agendamentos);
    setValue("observacoes", lancamento.observacoes || "");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Lançamento excluído!");
    } catch (error) {
      toast.error("Erro ao excluir lançamento");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    reset();
  };

  const getSdrName = (id: string) => sdrs.find((s) => s.id === id)?.nome || "N/A";

  const metricas = calcularMetricasSDR(lancamentos);

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Abordados</p>
            <p className="text-2xl font-bold text-foreground">{metricas.abordados}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Responderam</p>
            <p className="text-2xl font-bold text-foreground">{metricas.responderam}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">% Responderam</p>
            <p className="text-2xl font-bold text-primary">{metricas.percentResponderam.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Agendamentos</p>
            <p className="text-2xl font-bold text-foreground">{metricas.agendamentos}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">% Agendamentos</p>
            <p className="text-2xl font-bold text-primary">{metricas.percentAgendamentos.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Vendas</p>
            <p className="text-2xl font-bold text-success">{metricas.vendas}</p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {editingId ? "Editar Lançamento" : "Novo Lançamento SDR"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !watchedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {watchedDate ? format(watchedDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={watchedDate}
                    onSelect={(date) => date && setValue("data", date)}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>SDR</Label>
              <Select value={watchedSdrId} onValueChange={(v) => setValue("sdr_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o SDR" />
                </SelectTrigger>
                <SelectContent>
                  {sdrs.map((sdr) => (
                    <SelectItem key={sdr.id} value={sdr.id}>
                      {sdr.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nº Abordados</Label>
              <Input type="number" {...register("abordados", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Nº Responderam</Label>
              <Input type="number" {...register("responderam", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Nº Agendamentos</Label>
              <Input type="number" {...register("agendamentos", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label>Vendas dos Agendamentos</Label>
              <Input type="number" {...register("vendas_agendamentos", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Observações</Label>
              <Textarea {...register("observacoes")} placeholder="Observações opcionais..." />
            </div>

            <div className="flex gap-2 items-end md:col-span-2 lg:col-span-4">
              {editingId ? (
                <>
                  <Button type="submit" className="gap-2">
                    <Check className="h-4 w-4" /> Salvar
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancel}>
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

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Histórico de Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>SDR</TableHead>
                  <TableHead className="text-right">Abordados</TableHead>
                  <TableHead className="text-right">Responderam</TableHead>
                  <TableHead className="text-right">% Resp.</TableHead>
                  <TableHead className="text-right">Agendamentos</TableHead>
                  <TableHead className="text-right">% Agend.</TableHead>
                  <TableHead className="text-right">Vendas</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : lancamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhum lançamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  lancamentos.map((lancamento) => {
                    const percResp = lancamento.abordados > 0 
                      ? ((lancamento.responderam / lancamento.abordados) * 100).toFixed(1) 
                      : "0.0";
                    const percAgend = lancamento.responderam > 0 
                      ? ((lancamento.agendamentos / lancamento.responderam) * 100).toFixed(1) 
                      : "0.0";

                    return (
                      <TableRow key={lancamento.id}>
                        <TableCell>{format(new Date(lancamento.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{getSdrName(lancamento.sdr_id)}</TableCell>
                        <TableCell className="text-right">{lancamento.abordados}</TableCell>
                        <TableCell className="text-right">{lancamento.responderam}</TableCell>
                        <TableCell className="text-right text-primary">{percResp}%</TableCell>
                        <TableCell className="text-right">{lancamento.agendamentos}</TableCell>
                        <TableCell className="text-right text-primary">{percAgend}%</TableCell>
                        <TableCell className="text-right text-success">{lancamento.vendas_agendamentos}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{lancamento.observacoes || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(lancamento)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(lancamento.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
