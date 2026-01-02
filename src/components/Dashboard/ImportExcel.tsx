import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle, Download, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type ImportType = "atendimentos" | "lancamentos_sdr" | "lancamentos_disparo" | "lancamentos_trafego" | "vendas_registro";

interface ImportResult {
  success: number;
  errors: number;
  errorMessages: string[];
}

interface ColumnMapping {
  column: string;
  field: string;
  required: boolean;
  description: string;
}

const columnMappings: Record<ImportType, ColumnMapping[]> = {
  atendimentos: [
    { column: "Nome", field: "nome", required: true, description: "Nome do cliente" },
    { column: "Telefone", field: "telefone", required: false, description: "Telefone com DDD" },
    { column: "Email", field: "email", required: false, description: "E-mail do cliente" },
    { column: "Status", field: "status", required: false, description: "Status da negociação (padrão: Em negociação)" },
    { column: "Closer", field: "closer", required: true, description: "Nome do closer responsável" },
    { column: "SDR", field: "sdr", required: true, description: "Nome do SDR" },
    { column: "Origem", field: "origem", required: true, description: "Origem do lead" },
    { column: "Data", field: "data_call", required: false, description: "Data da call (formato: DD/MM/AAAA)" },
    { column: "Valor", field: "valor", required: false, description: "Valor da venda (número)" },
    { column: "Gravação", field: "gravacao", required: false, description: "Link da gravação" },
    { column: "Info SDR", field: "info_sdr", required: false, description: "Informações adicionais do SDR" },
  ],
  lancamentos_sdr: [
    { column: "Data", field: "data", required: true, description: "Data do lançamento (DD/MM/AAAA)" },
    { column: "SDR", field: "sdr_id", required: true, description: "Nome do SDR (deve estar cadastrado)" },
    { column: "Abordados", field: "abordados", required: true, description: "Quantidade de leads abordados" },
    { column: "Responderam", field: "responderam", required: true, description: "Quantidade que responderam" },
    { column: "Agendamentos", field: "agendamentos", required: true, description: "Quantidade de agendamentos" },
    { column: "Vendas", field: "vendas_agendamentos", required: false, description: "Vendas dos agendamentos" },
    { column: "Observações", field: "observacoes", required: false, description: "Observações adicionais" },
  ],
  lancamentos_disparo: [
    { column: "Data", field: "data", required: true, description: "Data do lançamento (DD/MM/AAAA)" },
    { column: "Closer", field: "closer_id", required: true, description: "Nome do closer (deve estar cadastrado)" },
    { column: "Abordados", field: "abordados", required: true, description: "Quantidade de leads abordados" },
    { column: "Agendados", field: "agendados", required: true, description: "Quantidade de agendados" },
    { column: "Confirmados", field: "confirmados", required: true, description: "Quantidade de confirmados" },
    { column: "Compareceram", field: "compareceram", required: true, description: "Quantidade que compareceram" },
    { column: "Vendas", field: "vendas", required: false, description: "Quantidade de vendas" },
    { column: "Receita", field: "receita", required: false, description: "Receita total (número)" },
    { column: "Observações", field: "observacoes", required: false, description: "Observações adicionais" },
  ],
  lancamentos_trafego: [
    { column: "Data", field: "data", required: true, description: "Data do lançamento (DD/MM/AAAA)" },
    { column: "Closer", field: "closer_id", required: true, description: "Nome do closer (deve estar cadastrado)" },
    { column: "Abordados", field: "abordados", required: true, description: "Quantidade de leads abordados" },
    { column: "Agendados", field: "agendados", required: true, description: "Quantidade de agendados" },
    { column: "Confirmados", field: "confirmados", required: true, description: "Quantidade de confirmados" },
    { column: "Compareceram", field: "compareceram", required: true, description: "Quantidade que compareceram" },
    { column: "Vendas", field: "vendas", required: false, description: "Quantidade de vendas" },
    { column: "Receita", field: "receita", required: false, description: "Receita total (número)" },
    { column: "Observações", field: "observacoes", required: false, description: "Observações adicionais" },
  ],
  vendas_registro: [
    { column: "Data", field: "data", required: true, description: "Data da venda (DD/MM/AAAA)" },
    { column: "Closer", field: "closer_id", required: true, description: "Nome do closer (deve estar cadastrado)" },
    { column: "Ticket", field: "ticket", required: true, description: "Tipo do ticket (ex: Gold, Silver)" },
    { column: "Valor", field: "valor", required: true, description: "Valor da venda (número)" },
    { column: "Tipo", field: "tipo", required: true, description: "Tipo: 'disparo' ou 'trafego'" },
  ],
};

const exampleData: Record<ImportType, any[]> = {
  atendimentos: [
    { Nome: "João Silva", Telefone: "11999999999", Email: "joao@email.com", Status: "Em negociação", Closer: "Carlos", SDR: "Maria", Origem: "Instagram", Data: "01/01/2025", Valor: "5000", Gravação: "", "Info SDR": "Lead qualificado" },
  ],
  lancamentos_sdr: [
    { Data: "01/01/2025", SDR: "Maria", Abordados: 50, Responderam: 20, Agendamentos: 5, Vendas: 2, Observações: "Dia produtivo" },
  ],
  lancamentos_disparo: [
    { Data: "01/01/2025", Closer: "Carlos", Abordados: 30, Agendados: 15, Confirmados: 10, Compareceram: 8, Vendas: 3, Receita: 15000, Observações: "" },
  ],
  lancamentos_trafego: [
    { Data: "01/01/2025", Closer: "Carlos", Abordados: 25, Agendados: 12, Confirmados: 8, Compareceram: 6, Vendas: 2, Receita: 10000, Observações: "" },
  ],
  vendas_registro: [
    { Data: "01/01/2025", Closer: "Carlos", Ticket: "Gold", Valor: 5000, Tipo: "disparo" },
  ],
};

export function ImportExcel() {
  const [isOpen, setIsOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>("atendimentos");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [sdrsCache, setSdrsCache] = useState<{ id: string; nome: string }[]>([]);
  const [closersCache, setClosersCache] = useState<{ id: string; nome: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importTypeLabels: Record<ImportType, string> = {
    atendimentos: "Atendimentos",
    lancamentos_sdr: "Lançamentos SDR",
    lancamentos_disparo: "Lançamentos Disparo",
    lancamentos_trafego: "Lançamentos Tráfego",
    vendas_registro: "Vendas Registro",
  };

  const loadCaches = async () => {
    const [sdrsResult, closersResult] = await Promise.all([
      supabase.from("sdrs").select("id, nome").eq("ativo", true),
      supabase.from("closers").select("id, nome").eq("ativo", true),
    ]);
    
    if (sdrsResult.data) setSdrsCache(sdrsResult.data);
    if (closersResult.data) setClosersCache(closersResult.data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length > 0) {
          setHeaders(jsonData[0].map(String));
          const dataRows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== ""));
          setPreviewData(dataRows.slice(0, 10));
        }
      } catch (error) {
        toast.error("Erro ao ler o arquivo Excel");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getValue = (row: any[], headers: string[], possibleHeaders: string[]) => {
    for (const h of possibleHeaders) {
      const index = headers.findIndex((header) =>
        header.toLowerCase().trim() === h.toLowerCase().trim() ||
        header.toLowerCase().includes(h.toLowerCase())
      );
      if (index !== -1 && row[index] !== undefined && row[index] !== "") return row[index];
    }
    return null;
  };

  const parseDate = (value: any): string => {
    if (!value) return new Date().toISOString().split("T")[0];
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split("T")[0];
    }
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
    }
    return new Date(value).toISOString().split("T")[0];
  };

  const parseDatetime = (value: any): string => {
    if (!value) return new Date().toISOString();
    if (typeof value === "number") {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString();
    }
    if (typeof value === "string" && value.includes("/")) {
      const parts = value.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`).toISOString();
      }
    }
    return new Date(value).toISOString();
  };

  const findSdrId = (name: string): string | null => {
    const sdr = sdrsCache.find((s) => s.nome.toLowerCase().trim() === name?.toLowerCase().trim());
    return sdr?.id || null;
  };

  const findCloserId = (name: string): string | null => {
    const closer = closersCache.find((c) => c.nome.toLowerCase().trim() === name?.toLowerCase().trim());
    return closer?.id || null;
  };

  const mapRowToAtendimento = (row: any[], fileHeaders: string[]) => {
    return {
      nome: getValue(row, fileHeaders, ["nome", "name", "cliente"]) || "N/A",
      telefone: getValue(row, fileHeaders, ["telefone", "phone", "tel"]) || null,
      email: getValue(row, fileHeaders, ["email", "e-mail"]) || null,
      status: getValue(row, fileHeaders, ["status", "status da call"]) || "Em negociação",
      closer: getValue(row, fileHeaders, ["closer", "vendedor"]) || "N/A",
      gravacao: getValue(row, fileHeaders, ["gravacao", "gravação", "link"]) || null,
      data_call: parseDatetime(getValue(row, fileHeaders, ["data", "data call", "data_call"])),
      sdr: getValue(row, fileHeaders, ["sdr"]) || "N/A",
      info_sdr: getValue(row, fileHeaders, ["info", "info sdr", "info_sdr"]) || null,
      origem: getValue(row, fileHeaders, ["origem", "source", "fonte"]) || "N/A",
      valor: parseFloat(getValue(row, fileHeaders, ["valor", "value", "receita"]) || "0") || null,
    };
  };

  const mapRowToLancamentoSDR = (row: any[], fileHeaders: string[]) => {
    const sdrName = getValue(row, fileHeaders, ["sdr", "nome sdr"]);
    const sdrId = findSdrId(sdrName);
    
    if (!sdrId) {
      throw new Error(`SDR "${sdrName}" não encontrado. Cadastre o SDR primeiro.`);
    }

    return {
      data: parseDate(getValue(row, fileHeaders, ["data"])),
      sdr_id: sdrId,
      abordados: parseInt(getValue(row, fileHeaders, ["abordados"]) || "0") || 0,
      responderam: parseInt(getValue(row, fileHeaders, ["responderam"]) || "0") || 0,
      agendamentos: parseInt(getValue(row, fileHeaders, ["agendamentos"]) || "0") || 0,
      vendas_agendamentos: parseInt(getValue(row, fileHeaders, ["vendas", "vendas_agendamentos"]) || "0") || 0,
      observacoes: getValue(row, fileHeaders, ["observações", "observacoes", "obs"]) || null,
    };
  };

  const mapRowToLancamentoDisparo = (row: any[], fileHeaders: string[]) => {
    const closerName = getValue(row, fileHeaders, ["closer", "nome closer"]);
    const closerId = findCloserId(closerName);
    
    if (!closerId) {
      throw new Error(`Closer "${closerName}" não encontrado. Cadastre o Closer primeiro.`);
    }

    return {
      data: parseDate(getValue(row, fileHeaders, ["data"])),
      closer_id: closerId,
      abordados: parseInt(getValue(row, fileHeaders, ["abordados"]) || "0") || 0,
      agendados: parseInt(getValue(row, fileHeaders, ["agendados"]) || "0") || 0,
      confirmados: parseInt(getValue(row, fileHeaders, ["confirmados"]) || "0") || 0,
      compareceram: parseInt(getValue(row, fileHeaders, ["compareceram"]) || "0") || 0,
      vendas: parseInt(getValue(row, fileHeaders, ["vendas"]) || "0") || 0,
      receita: parseFloat(getValue(row, fileHeaders, ["receita", "valor"]) || "0") || 0,
      observacoes: getValue(row, fileHeaders, ["observações", "observacoes", "obs"]) || null,
    };
  };

  const mapRowToLancamentoTrafego = (row: any[], fileHeaders: string[]) => {
    const closerName = getValue(row, fileHeaders, ["closer", "nome closer"]);
    const closerId = findCloserId(closerName);
    
    if (!closerId) {
      throw new Error(`Closer "${closerName}" não encontrado. Cadastre o Closer primeiro.`);
    }

    return {
      data: parseDate(getValue(row, fileHeaders, ["data"])),
      closer_id: closerId,
      abordados: parseInt(getValue(row, fileHeaders, ["abordados"]) || "0") || 0,
      agendados: parseInt(getValue(row, fileHeaders, ["agendados"]) || "0") || 0,
      confirmados: parseInt(getValue(row, fileHeaders, ["confirmados"]) || "0") || 0,
      compareceram: parseInt(getValue(row, fileHeaders, ["compareceram"]) || "0") || 0,
      vendas: parseInt(getValue(row, fileHeaders, ["vendas"]) || "0") || 0,
      receita: parseFloat(getValue(row, fileHeaders, ["receita", "valor"]) || "0") || 0,
      observacoes: getValue(row, fileHeaders, ["observações", "observacoes", "obs"]) || null,
    };
  };

  const mapRowToVendaRegistro = (row: any[], fileHeaders: string[]) => {
    const closerName = getValue(row, fileHeaders, ["closer", "nome closer"]);
    const closerId = findCloserId(closerName);
    
    if (!closerId) {
      throw new Error(`Closer "${closerName}" não encontrado. Cadastre o Closer primeiro.`);
    }

    const tipo = getValue(row, fileHeaders, ["tipo"]);
    if (!tipo || !["disparo", "trafego"].includes(tipo.toLowerCase())) {
      throw new Error(`Tipo "${tipo}" inválido. Use "disparo" ou "trafego".`);
    }

    return {
      data: parseDate(getValue(row, fileHeaders, ["data"])),
      closer_id: closerId,
      ticket: getValue(row, fileHeaders, ["ticket"]) || "",
      valor: parseFloat(getValue(row, fileHeaders, ["valor"]) || "0") || 0,
      tipo: tipo.toLowerCase(),
    };
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // Load caches first
      await loadCaches();

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      const fileHeaders = jsonData[0].map(String);
      const rows = jsonData.slice(1).filter((row) => row.some((cell) => cell !== null && cell !== ""));

      let successCount = 0;
      let errorCount = 0;
      const errorMessages: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          let insertResult: { error: any } | null = null;

          switch (importType) {
            case "atendimentos":
              insertResult = await supabase.from("atendimentos").insert(mapRowToAtendimento(row, fileHeaders));
              break;
            case "lancamentos_sdr":
              insertResult = await supabase.from("lancamentos_sdr").insert(mapRowToLancamentoSDR(row, fileHeaders));
              break;
            case "lancamentos_disparo":
              insertResult = await supabase.from("lancamentos_disparo").insert(mapRowToLancamentoDisparo(row, fileHeaders));
              break;
            case "lancamentos_trafego":
              insertResult = await supabase.from("lancamentos_trafego").insert(mapRowToLancamentoTrafego(row, fileHeaders));
              break;
            case "vendas_registro":
              insertResult = await supabase.from("vendas_registro").insert(mapRowToVendaRegistro(row, fileHeaders));
              break;
            default:
              throw new Error("Tipo de importação não suportado");
          }

          if (insertResult?.error) throw insertResult.error;

          successCount++;
        } catch (error: any) {
          errorCount++;
          errorMessages.push(`Linha ${i + 2}: ${error.message}`);
        }

        setProgress(((i + 1) / rows.length) * 100);
      }

      setResult({ success: successCount, errors: errorCount, errorMessages });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [importType] });
      queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos-sdr"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos-disparo"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos-trafego"] });
      queryClient.invalidateQueries({ queryKey: ["vendas-registro"] });

      if (successCount > 0) {
        toast.success(`${successCount} registros importados com sucesso!`);
      }
      if (errorCount > 0) {
        toast.error(`${errorCount} erros durante a importação`);
      }
    } catch (error) {
      toast.error("Erro ao importar arquivo");
      console.error(error);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const mapping = columnMappings[importType];
    const templateHeaders = mapping.map((m) => m.column);
    const example = exampleData[importType][0];
    const exampleRow = templateHeaders.map((h) => example[h] || "");

    const wsData = XLSX.utils.aoa_to_sheet([templateHeaders, exampleRow]);
    
    // Set column widths
    wsData["!cols"] = headers.map(() => ({ wch: 20 }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsData, "Modelo");
    
    XLSX.writeFile(wb, `modelo_${importType}.xlsx`);
    toast.success("Modelo baixado com sucesso!");
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewData([]);
    setHeaders([]);
    setResult(null);
    setProgress(0);
    setShowHelp(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Upload className="h-4 w-4" />
        Importar Excel
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar Dados do Excel
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de dados e o arquivo Excel para importar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Import Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Importação</label>
              <Select value={importType} onValueChange={(v) => setImportType(v as ImportType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(importTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Help Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => setShowHelp(!showHelp)}
              >
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary" />
                    Como usar? (Clique para expandir)
                  </span>
                  {showHelp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
              {showHelp && (
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Passo a passo:</h4>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Selecione o tipo de dados que deseja importar</li>
                      <li>Baixe o modelo clicando em "Baixar Modelo"</li>
                      <li>Preencha o Excel com seus dados seguindo o modelo</li>
                      <li>Selecione o arquivo preenchido</li>
                      <li>Confira o preview e clique em "Importar Dados"</li>
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Colunas esperadas para "{importTypeLabels[importType]}":</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Coluna</TableHead>
                            <TableHead className="text-xs">Obrigatório</TableHead>
                            <TableHead className="text-xs">Descrição</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {columnMappings[importType].map((col, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-medium">{col.column}</TableCell>
                              <TableCell className="text-xs">
                                {col.required ? (
                                  <span className="text-destructive">Sim</span>
                                ) : (
                                  <span className="text-muted-foreground">Não</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{col.description}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Dicas importantes:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Datas devem estar no formato DD/MM/AAAA</li>
                      <li>Valores numéricos não devem ter R$ ou símbolos</li>
                      <li>Para SDR e Closers, use o nome exato cadastrado no sistema</li>
                      <li>O sistema ignora linhas completamente vazias</li>
                    </ul>
                  </div>

                  <Button onClick={downloadTemplate} variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Modelo para "{importTypeLabels[importType]}"
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* File Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo Excel</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/90
                  cursor-pointer"
              />
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <Card className="bg-secondary/50">
                <CardHeader>
                  <CardTitle className="text-sm">Preview (primeiras 10 linhas)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((header, i) => (
                            <TableHead key={i} className="text-xs">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, i) => (
                          <TableRow key={i}>
                            {headers.map((_, j) => (
                              <TableCell key={j} className="text-xs">
                                {row[j] !== undefined ? String(row[j]).substring(0, 50) : "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progress */}
            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importando...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {/* Result */}
            {result && (
              <Card className={result.errors > 0 ? "border-warning" : "border-green-500"}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {result.errors > 0 ? (
                      <AlertCircle className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">Importação concluída</p>
                      <p className="text-sm text-muted-foreground">
                        {result.success} registros importados, {result.errors} erros
                      </p>
                    </div>
                  </div>
                  {result.errorMessages.length > 0 && (
                    <div className="mt-4 max-h-32 overflow-y-auto">
                      {result.errorMessages.slice(0, 10).map((msg, i) => (
                        <p key={i} className="text-xs text-destructive">
                          {msg}
                        </p>
                      ))}
                      {result.errorMessages.length > 10 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {result.errorMessages.length - 10} erros
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Baixar Modelo
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            <Button
              onClick={handleImport}
              disabled={isImporting || previewData.length === 0}
              className="gap-2"
            >
              {isImporting ? "Importando..." : "Importar Dados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
