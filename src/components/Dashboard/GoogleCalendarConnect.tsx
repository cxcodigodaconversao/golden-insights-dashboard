import { Calendar, Check, Loader2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsGoogleConnected, useConnectGoogleCalendar, useDisconnectGoogleCalendar } from "@/hooks/useGoogleCalendar";

export function GoogleCalendarConnect() {
  const { isConnected, isLoading } = useIsGoogleConnected();
  const connectGoogle = useConnectGoogleCalendar();
  const disconnectGoogle = useDisconnectGoogleCalendar();

  if (isLoading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-base">Google Calendar</CardTitle>
              <CardDescription className="text-sm">
                Integre seu calendário para criar eventos automaticamente
              </CardDescription>
            </div>
          </div>
          {isConnected && (
            <Badge variant="outline" className="border-green-500 text-green-500">
              <Check className="mr-1 h-3 w-3" />
              Conectado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sua conta do Google está conectada. Os eventos de reagendamento serão criados automaticamente no seu calendário com links do Google Meet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => disconnectGoogle.mutate()}
              disabled={disconnectGoogle.isPending}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              {disconnectGoogle.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlink className="mr-2 h-4 w-4" />
              )}
              Desconectar
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Conecte sua conta do Google para criar eventos de reagendamento automaticamente com links do Google Meet.
            </p>
            <Button
              onClick={() => connectGoogle.mutate()}
              disabled={connectGoogle.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {connectGoogle.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Conectar Google Calendar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
