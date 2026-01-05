import { TrendingUp, LogOut, Shield, Crown, User, Headphones, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-purple-600' },
  lider: { label: 'Líder', icon: Crown, color: 'bg-blue-600' },
  vendedor: { label: 'Vendedor', icon: User, color: 'bg-green-600' },
  sdr: { label: 'SDR', icon: Headphones, color: 'bg-orange-600' },
  cliente: { label: 'Cliente', icon: Building2, color: 'bg-teal-600' },
  user: { label: 'Usuário', icon: User, color: 'bg-gray-600' },
};

export function Header() {
  const { profile, role, signOut } = useAuth();
  
  const config = roleConfig[role] || roleConfig.user;
  const RoleIcon = config.icon;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              CX - <span className="text-primary">Comercial 10X</span>
            </h1>
            <p className="text-xs text-muted-foreground">Dashboard de Resultados</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile.nome}
              </span>
              <Badge variant="outline" className={`${config.color} text-white border-0 gap-1`}>
                <RoleIcon className="h-3 w-3" />
                {config.label}
              </Badge>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
