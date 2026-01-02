import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Save, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface AtendimentoFormProps {
  closers: { id: string; nome: string }[];
  sdrs: { id: string; nome: string }[];
  origens: { id: string; nome: string }[];
  onSuccess?: () => void;
}

const statusOptions = [
  "Em negociação",
  "Venda Confirmada",
  "Venda Reembolsada",
  "Não fechou",
  "Não compareceu",
  "Remarcado",
];

export function AtendimentoForm({ closers, sdrs, origens, onSuccess }: AtendimentoFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    sdr: "",
    closer: "",
    origem: "",
    status: "Em negociação",
    valor: "",
    dataCall: new Date(),
    infoSdr: "",
    gravacao: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.sdr || !formData.closer || !formData.origem) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("atendimentos").insert({
        nome: formData.nome,
        telefone: formData.telefone || null,
        email: formData.email || null,
        sdr: formData.sdr,
        closer: formData.closer,
        origem: formData.origem,
        status: formData.status,
        valor: formData.valor ? parseFloat(formData.valor) : null,
        data_call: formData.dataCall.toISOString(),
        info_sdr: formData.infoSdr || null,
        gravacao: formData.gravacao || null,
      });

      if (error) throw error;

      toast.success("Atendimento cadastrado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      
      // Reset form
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        sdr: "",
        closer: "",
        origem: "",
        status: "Em negociação",
        valor: "",
        dataCall: new Date(),
        infoSdr: "",
        gravacao: "",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast.error("Erro ao cadastrar atendimento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      nome: "",
      telefone: "",
      email: "",
      sdr: "",
      closer: "",
      origem: "",
      status: "Em negociação",
      valor: "",
      dataCall: new Date(),
      infoSdr: "",
      gravacao: "",
    });
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Novo Atendimento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">
                Nome do Lead <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
                className="bg-secondary border-border"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-foreground">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                className="bg-secondary border-border"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="bg-secondary border-border"
              />
            </div>

            {/* Data da Call */}
            <div className="space-y-2">
              <Label className="text-foreground">
                Data da Call <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-secondary border-border",
                      !formData.dataCall && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataCall ? (
                      format(formData.dataCall, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border">
                  <Calendar
                    mode="single"
                    selected={formData.dataCall}
                    onSelect={(date) => date && setFormData({ ...formData, dataCall: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* SDR */}
            <div className="space-y-2">
              <Label className="text-foreground">
                SDR <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.sdr}
                onValueChange={(value) => setFormData({ ...formData, sdr: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o SDR" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sdrs.map((sdr) => (
                    <SelectItem key={sdr.id} value={sdr.nome}>
                      {sdr.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Closer */}
            <div className="space-y-2">
              <Label className="text-foreground">
                Closer <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.closer}
                onValueChange={(value) => setFormData({ ...formData, closer: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o Closer" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {closers.map((closer) => (
                    <SelectItem key={closer.id} value={closer.nome}>
                      {closer.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Origem */}
            <div className="space-y-2">
              <Label className="text-foreground">
                Origem <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.origem}
                onValueChange={(value) => setFormData({ ...formData, origem: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {origens.map((origem) => (
                    <SelectItem key={origem.id} value={origem.nome}>
                      {origem.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-foreground">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label htmlFor="valor" className="text-foreground">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Info SDR */}
          <div className="space-y-2">
            <Label htmlFor="infoSdr" className="text-foreground">Informações do SDR</Label>
            <Textarea
              id="infoSdr"
              value={formData.infoSdr}
              onChange={(e) => setFormData({ ...formData, infoSdr: e.target.value })}
              placeholder="Observações do SDR sobre o lead..."
              className="bg-secondary border-border min-h-[80px]"
            />
          </div>

          {/* Link Gravação */}
          <div className="space-y-2">
            <Label htmlFor="gravacao" className="text-foreground">Link da Gravação</Label>
            <Input
              id="gravacao"
              value={formData.gravacao}
              onChange={(e) => setFormData({ ...formData, gravacao: e.target.value })}
              placeholder="https://..."
              className="bg-secondary border-border"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar Atendimento"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              className="border-border"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
