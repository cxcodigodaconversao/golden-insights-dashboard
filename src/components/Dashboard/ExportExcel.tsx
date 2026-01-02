import { useState } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Download, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ptBR } from "date-fns/locale";

type ExportType = "atendimentos" | "lancamentos_sdr" | "lancamentos_disparo" | "lancamentos_trafego" | "vendas_registro" | "resumo_geral";

export function ExportExcel() {
  const [isOpen, setIsOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>("atendimentos");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(1)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState(false);

  const exportTypeLabels: Record<ExportType, string> = {
    atendimentos: "Atendimentos",
    lancamentos_sdr: "Lançamentos SDR",
    lancamentos_disparo: "Lançamentos Disparo",
    lancamentos_trafego: "Lançamentos Tráfego",
    vendas_registro: "Vendas Registro",
    resumo_geral: "Resumo Geral",
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let data: any[] = [];
      let sheetName = exportTypeLabels[exportType];

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      switch (exportType) {
        case "atendimentos": {
          const { data: result, error } = await supabase
            .from("atendimentos")
            .select("*")
            .gte("data_call", startStr)
            .lte("data_call", endStr + "T23:59:59")
            .order("data_call", { ascending: false });
          
          if (error) throw error;
          
          data = (result || []).map((item) => ({
            "Nome": item.nome,
            "Telefone": item.telefone || "",
            "Email": item.email || "",
            "Status": item.status,
            "Closer": item.closer,
            "SDR": item.sdr,
            "Origem": item.origem,
            "Valor": item.valor || 0,
            "Data Call": format(new Date(item.data_call), "dd/MM/yyyy HH:mm"),
            "Info SDR": item.info_sdr || "",
            "Gravação": item.gravacao || "",
          }));
          break;
        }

        case "lancamentos_sdr": {
          const { data: result, error } = await supabase
            .from("lancamentos_sdr")
            .select("*")
            .gte("data", startStr)
            .lte("data", endStr)
            .order("data", { ascending: false });

          if (error) throw error;

          const { data: sdrs } = await supabase.from("sdrs").select("*");
          const sdrMap = new Map(sdrs?.map((s) => [s.id, s.nome]) || []);

          data = (result || []).map((item) => ({
            "Data": format(new Date(item.data), "dd/MM/yyyy"),
            "SDR": sdrMap.get(item.sdr_id) || "N/A",
            "Abordados": item.abordados,
            "Responderam": item.responderam,
            "% Responderam": item.abordados > 0 ? ((item.responderam / item.abordados) * 100).toFixed(1) + "%" : "0%",
            "Agendamentos": item.agendamentos,
            "% Agendamentos": item.responderam > 0 ? ((item.agendamentos / item.responderam) * 100).toFixed(1) + "%" : "0%",
            "Vendas": item.vendas_agendamentos,
            "Observações": item.observacoes || "",
          }));
          break;
        }

        case "lancamentos_disparo":
        case "lancamentos_trafego": {
          const tableName = exportType;
          const { data: result, error } = await supabase
            .from(tableName)
            .select("*")
            .gte("data", startStr)
            .lte("data", endStr)
            .order("data", { ascending: false });

          if (error) throw error;

          const { data: closers } = await supabase.from("closers").select("*");
          const closerMap = new Map(closers?.map((c) => [c.id, c.nome]) || []);

          data = (result || []).map((item) => ({
            "Data": format(new Date(item.data), "dd/MM/yyyy"),
            "Closer": closerMap.get(item.closer_id) || "N/A",
            "Abordados": item.abordados,
            "Agendados": item.agendados,
            "Confirmados": item.confirmados,
            "Compareceram": item.compareceram,
            "% Comparecimento": item.agendados > 0 ? ((item.compareceram / item.agendados) * 100).toFixed(1) + "%" : "0%",
            "Vendas": item.vendas,
            "% Fechamento": item.compareceram > 0 ? ((item.vendas / item.compareceram) * 100).toFixed(1) + "%" : "0%",
            "Receita": item.receita,
            "Observações": item.observacoes || "",
          }));
          break;
        }

        case "vendas_registro": {
          const { data: result, error } = await supabase
            .from("vendas_registro")
            .select("*")
            .gte("data", startStr)
            .lte("data", endStr)
            .order("data", { ascending: false });

          if (error) throw error;

          const { data: closers } = await supabase.from("closers").select("*");
          const closerMap = new Map(closers?.map((c) => [c.id, c.nome]) || []);

          data = (result || []).map((item) => ({
            "Data": format(new Date(item.data), "dd/MM/yyyy"),
            "Equipe": closerMap.get(item.closer_id) || "N/A",
            "Tipo": item.tipo === "disparo" ? "Disparo" : "Tráfego",
            "Ticket": item.ticket,
            "Valor": item.valor,
          }));
          break;
        }

        case "resumo_geral": {
          // Export multiple sheets for a complete overview
          const workbook = XLSX.utils.book_new();

          // Atendimentos
          const { data: atendimentos } = await supabase
            .from("atendimentos")
            .select("*")
            .gte("data_call", startStr)
            .lte("data_call", endStr + "T23:59:59");

          const atendimentosSheet = XLSX.utils.json_to_sheet(
            (atendimentos || []).map((item) => ({
              "Nome": item.nome,
              "Status": item.status,
              "Closer": item.closer,
              "SDR": item.sdr,
              "Origem": item.origem,
              "Valor": item.valor || 0,
              "Data": format(new Date(item.data_call), "dd/MM/yyyy"),
            }))
          );
          XLSX.utils.book_append_sheet(workbook, atendimentosSheet, "Atendimentos");

          // Lancamentos SDR
          const { data: lancamentosSdr } = await supabase
            .from("lancamentos_sdr")
            .select("*")
            .gte("data", startStr)
            .lte("data", endStr);

          const { data: sdrs } = await supabase.from("sdrs").select("*");
          const sdrMap = new Map(sdrs?.map((s) => [s.id, s.nome]) || []);

          const sdrSheet = XLSX.utils.json_to_sheet(
            (lancamentosSdr || []).map((item) => ({
              "Data": format(new Date(item.data), "dd/MM/yyyy"),
              "SDR": sdrMap.get(item.sdr_id) || "N/A",
              "Abordados": item.abordados,
              "Responderam": item.responderam,
              "Agendamentos": item.agendamentos,
              "Vendas": item.vendas_agendamentos,
            }))
          );
          XLSX.utils.book_append_sheet(workbook, sdrSheet, "SDR");

          // Disparo
          const { data: disparo } = await supabase
            .from("lancamentos_disparo")
            .select("*")
            .gte("data", startStr)
            .lte("data", endStr);

          const { data: closers } = await supabase.from("closers").select("*");
          const closerMap = new Map(closers?.map((c) => [c.id, c.nome]) || []);

          const disparoSheet = XLSX.utils.json_to_sheet(
            (disparo || []).map((item) => ({
              "Data": format(new Date(item.data), "dd/MM/yyyy"),
              "Closer": closerMap.get(item.closer_id) || "N/A",
              "Agendados": item.agendados,
              "Compareceram": item.compareceram,
              "Vendas": item.vendas,
              "Receita": item.receita,
            }))
          );
          XLSX.utils.book_append_sheet(workbook, disparoSheet, "Disparo");

          // Trafego
          const { data: trafego } = await supabase
            .from("lancamentos_trafego")
            .select("*")
            .gte("data", startStr)
            .lte("data", endStr);

          const trafegoSheet = XLSX.utils.json_to_sheet(
            (trafego || []).map((item) => ({
              "Data": format(new Date(item.data), "dd/MM/yyyy"),
              "Closer": closerMap.get(item.closer_id) || "N/A",
              "Agendados": item.agendados,
              "Compareceram": item.compareceram,
              "Vendas": item.vendas,
              "Receita": item.receita,
            }))
          );
          XLSX.utils.book_append_sheet(workbook, trafegoSheet, "Trafego");

          // Download
          const fileName = `Resumo_Geral_${format(startDate, "dd-MM-yyyy")}_a_${format(endDate, "dd-MM-yyyy")}.xlsx`;
          XLSX.writeFile(workbook, fileName);
          toast.success("Arquivo exportado com sucesso!");
          setIsOpen(false);
          setIsExporting(false);
          return;
        }
      }

      if (data.length === 0) {
        toast.warning("Nenhum dado encontrado para o período selecionado");
        setIsExporting(false);
        return;
      }

      // Create and download file
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = `${sheetName.replace(/\s+/g, "_")}_${format(startDate, "dd-MM-yyyy")}_a_${format(endDate, "dd-MM-yyyy")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Arquivo exportado com sucesso!");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar arquivo");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="gap-2">
        <Download className="h-4 w-4" />
        Exportar Excel
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Exportar para Excel
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de dados e o período para exportar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Export Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Exportação</label>
              <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(exportTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(startDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(endDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? "Exportando..." : "Exportar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
