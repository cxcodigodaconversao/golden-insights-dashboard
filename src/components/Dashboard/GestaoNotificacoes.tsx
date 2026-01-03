import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Settings, History, Plus, X, Save, AlertTriangle } from "lucide-react";
import { 
  useNotificacoesConfig, 
  useNotificacoesHistorico, 
  useUpsertNotificacaoConfig 
} from "@/hooks/useNotificacoes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export function GestaoNotificacoes() {
  const { data: configs = [], isLoading: isLoadingConfigs } = useNotificacoesConfig();
  const { data: historico = [], isLoading: isLoadingHistorico } = useNotificacoesHistorico();
  const upsertConfig = useUpsertNotificacaoConfig();

  // Meta atingida config
  const metaConfig = configs.find(c => c.tipo === "meta_atingida");
  const [metaAtivo, setMetaAtivo] = useState(metaConfig?.ativo ?? false);
  const [metaEmails, setMetaEmails] = useState<string[]>(metaConfig?.emails_destino ?? []);
  const [newMetaEmail, setNewMetaEmail] = useState("");

  // Queda performance config
  const quedaConfig = configs.find(c => c.tipo === "queda_performance");
  const [quedaAtivo, setQuedaAtivo] = useState(quedaConfig?.ativo ?? false);
  const [quedaEmails, setQuedaEmails] = useState<string[]>(quedaConfig?.emails_destino ?? []);
  const [quedaThreshold, setQuedaThreshold] = useState(quedaConfig?.threshold_queda ?? 20);
  const [newQuedaEmail, setNewQuedaEmail] = useState("");

  const handleAddEmail = (type: "meta" | "queda") => {
    const email = type === "meta" ? newMetaEmail : newQuedaEmail;
    if (!email || !email.includes("@")) {
      toast.error("Email inválido");
      return;
    }

    if (type === "meta") {
      if (!metaEmails.includes(email)) {
        setMetaEmails([...metaEmails, email]);
      }
      setNewMetaEmail("");
    } else {
      if (!quedaEmails.includes(email)) {
        setQuedaEmails([...quedaEmails, email]);
      }
      setNewQuedaEmail("");
    }
  };

  const handleRemoveEmail = (type: "meta" | "queda", email: string) => {
    if (type === "meta") {
      setMetaEmails(metaEmails.filter(e => e !== email));
    } else {
      setQuedaEmails(quedaEmails.filter(e => e !== email));
    }
  };

  const handleSaveMetaConfig = () => {
    upsertConfig.mutate({
      id: metaConfig?.id,
      tipo: "meta_atingida",
      ativo: metaAtivo,
      emails_destino: metaEmails,
    });
  };

  const handleSaveQuedaConfig = () => {
    upsertConfig.mutate({
      id: quedaConfig?.id,
      tipo: "queda_performance",
      ativo: quedaAtivo,
      emails_destino: quedaEmails,
      threshold_queda: quedaThreshold,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
          <div>
            <h4 className="font-medium text-warning">Configuração de Email Necessária</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Para enviar notificações por email, é necessário configurar o Resend. 
              Entre em contato com o administrador do sistema para configurar a API key do Resend.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {/* Meta Atingida Config */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Bell className="h-5 w-5 text-success" />
                    Notificação: Meta Atingida
                  </CardTitle>
                  <CardDescription>
                    Enviar email quando um vendedor atingir 100% da meta mensal
                  </CardDescription>
                </div>
                <Switch
                  checked={metaAtivo}
                  onCheckedChange={setMetaAtivo}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Emails para notificar</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newMetaEmail}
                    onChange={e => setNewMetaEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddEmail("meta")}
                  />
                  <Button variant="outline" onClick={() => handleAddEmail("meta")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {metaEmails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      <Mail className="h-3 w-3" />
                      {email}
                      <button onClick={() => handleRemoveEmail("meta", email)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleSaveMetaConfig} 
                disabled={upsertConfig.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>

          {/* Queda Performance Config */}
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Bell className="h-5 w-5 text-destructive" />
                    Notificação: Queda de Performance
                  </CardTitle>
                  <CardDescription>
                    Enviar alerta quando houver queda significativa de resultados
                  </CardDescription>
                </div>
                <Switch
                  checked={quedaAtivo}
                  onCheckedChange={setQuedaAtivo}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Threshold de Queda (%)</Label>
                  <Input
                    type="number"
                    value={quedaThreshold}
                    onChange={e => setQuedaThreshold(parseInt(e.target.value) || 0)}
                    min={5}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alertar quando a performance cair mais que {quedaThreshold}% em relação à semana anterior
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Emails para notificar</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newQuedaEmail}
                    onChange={e => setNewQuedaEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddEmail("queda")}
                  />
                  <Button variant="outline" onClick={() => handleAddEmail("queda")}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {quedaEmails.map(email => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      <Mail className="h-3 w-3" />
                      {email}
                      <button onClick={() => handleRemoveEmail("queda", email)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                onClick={handleSaveQuedaConfig} 
                disabled={upsertConfig.isPending}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Histórico de Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistorico ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : historico.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma notificação enviada ainda.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {format(new Date(item.enviado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.tipo === "meta_atingida" ? "default" : "destructive"}>
                            {item.tipo === "meta_atingida" ? "Meta" : "Queda"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.destinatario}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.assunto}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "enviado" ? "outline" : "destructive"}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
