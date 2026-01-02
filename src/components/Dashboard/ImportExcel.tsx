import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from "lucide-react";
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

export function ImportExcel() {
  const [isOpen, setIsOpen] = useState(false);
  const [importType, setImportType] = useState<ImportType>("atendimentos");
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importTypeLabels: Record<ImportType, string> = {
    atendimentos: "Atendimentos",
    lancamentos_sdr: "Lançamentos SDR",
    lancamentos_disparo: "Lançamentos Disparo",
    lancamentos_trafego: "Lançamentos Tráfego",
    vendas_registro: "Vendas Registro",
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
          setPreviewData(dataRows.slice(0, 10)); // Preview first 10 rows
        }
      } catch (error) {
        toast.error("Erro ao ler o arquivo Excel");
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const mapRowToAtendimento = (row: any[], headers: string[]) => {
    const getValue = (possibleHeaders: string[]) => {
      for (const h of possibleHeaders) {
        const index = headers.findIndex((header) => 
          header.toLowerCase().includes(h.toLowerCase())
        );
        if (index !== -1 && row[index] !== undefined) return row[index];
      }
      return null;
    };

    const parseDate = (value: any) => {
      if (!value) return new Date().toISOString();
      if (typeof value === "number") {
        // Excel date serial number
        const date = new Date((value - 25569) * 86400 * 1000);
        return date.toISOString();
      }
      return new Date(value).toISOString();
    };

    return {
      nome: getValue(["nome", "name", "cliente"]) || "N/A",
      telefone: getValue(["telefone", "phone", "tel"]) || null,
      email: getValue(["email", "e-mail"]) || null,
      status: getValue(["status", "status da call"]) || "Em negociação",
      closer: getValue(["closer", "vendedor"]) || "N/A",
      gravacao: getValue(["gravacao", "gravação", "link"]) || null,
      data_call: parseDate(getValue(["data", "data call", "data_call"])),
      sdr: getValue(["sdr"]) || "N/A",
      info_sdr: getValue(["info", "info sdr", "info_sdr"]) || null,
      origem: getValue(["origem", "source", "fonte"]) || "N/A",
      valor: parseFloat(getValue(["valor", "value", "receita"]) || "0") || null,
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
          let insertData: any;

          switch (importType) {
            case "atendimentos":
              insertData = mapRowToAtendimento(row, fileHeaders);
              await supabase.from("atendimentos").insert(insertData);
              break;
            // Add other import types as needed
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errorMessages.push(`Linha ${i + 2}: ${error.message}`);
        }

        setProgress(((i + 1) / rows.length) * 100);
      }

      setResult({ success: successCount, errors: errorCount, errorMessages });
      queryClient.invalidateQueries({ queryKey: [importType] });

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

  const handleClose = () => {
    setIsOpen(false);
    setPreviewData([]);
    setHeaders([]);
    setResult(null);
    setProgress(0);
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
              <Card className={result.errors > 0 ? "border-warning" : "border-success"}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    {result.errors > 0 ? (
                      <AlertCircle className="h-8 w-8 text-warning" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-success" />
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
                      {result.errorMessages.slice(0, 5).map((msg, i) => (
                        <p key={i} className="text-xs text-destructive">
                          {msg}
                        </p>
                      ))}
                      {result.errorMessages.length > 5 && (
                        <p className="text-xs text-muted-foreground">
                          ... e mais {result.errorMessages.length - 5} erros
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
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
