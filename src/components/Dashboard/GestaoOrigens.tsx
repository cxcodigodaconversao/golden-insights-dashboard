import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface GestaoOrigensProps {
  origens: { id: string; nome: string; ativo: boolean }[];
}

export function GestaoOrigens({ origens }: GestaoOrigensProps) {
  const queryClient = useQueryClient();
  const [novaOrigem, setNovaOrigem] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddOrigem = async () => {
    if (!novaOrigem.trim()) {
      toast.error("Digite o nome da origem");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("origens").insert({ nome: novaOrigem.trim() });
      if (error) throw error;

      toast.success("Origem adicionada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["origens"] });
      setNovaOrigem("");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Esta origem já existe");
      } else {
        toast.error("Erro ao adicionar origem");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("origens")
        .update({ ativo: !ativo })
        .eq("id", id);
      if (error) throw error;

      toast.success(ativo ? "Origem desativada" : "Origem ativada");
      queryClient.invalidateQueries({ queryKey: ["origens"] });
    } catch (error) {
      toast.error("Erro ao atualizar origem");
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Gestão de Origens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar novo */}
        <div className="flex gap-3">
          <Input
            value={novaOrigem}
            onChange={(e) => setNovaOrigem(e.target.value)}
            placeholder="Nome da nova origem"
            className="bg-secondary border-border max-w-sm"
            onKeyDown={(e) => e.key === "Enter" && handleAddOrigem()}
          />
          <Button
            onClick={handleAddOrigem}
            disabled={isAdding}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {/* Lista */}
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-secondary/50">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {origens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma origem cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                origens.map((origem) => (
                  <TableRow key={origem.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-foreground font-medium">{origem.nome}</TableCell>
                    <TableCell>
                      <Badge variant={origem.ativo ? "default" : "secondary"}>
                        {origem.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAtivo(origem.id, origem.ativo)}
                        className="hover:bg-secondary"
                      >
                        {origem.ativo ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : (
                          <Check className="h-4 w-4 text-success" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
