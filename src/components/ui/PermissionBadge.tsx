import { Shield, Crown, User, Headphones, Building2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const roleConfig: Record<AppRole, { 
  label: string; 
  icon: typeof Shield; 
  color: string;
  description: string;
}> = {
  admin: { 
    label: 'Administrador', 
    icon: Shield, 
    color: 'bg-purple-600',
    description: 'Acesso total ao sistema'
  },
  lider: { 
    label: 'Líder', 
    icon: Crown, 
    color: 'bg-blue-600',
    description: 'Gerencia equipe e visualiza métricas do time'
  },
  vendedor: { 
    label: 'Closer', 
    icon: User, 
    color: 'bg-green-600',
    description: 'Visualiza e edita apenas próprios leads'
  },
  sdr: { 
    label: 'SDR', 
    icon: Headphones, 
    color: 'bg-orange-600',
    description: 'Visualiza e qualifica próprios leads'
  },
  cliente: { 
    label: 'Cliente', 
    icon: Building2, 
    color: 'bg-teal-600',
    description: 'Visualiza métricas da operação'
  },
  user: { 
    label: 'Usuário', 
    icon: User, 
    color: 'bg-gray-600',
    description: 'Acesso limitado'
  },
};

interface PermissionBadgeProps {
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PermissionBadge({ showTooltip = true, size = 'md' }: PermissionBadgeProps) {
  const { role } = useAuth();
  const config = roleConfig[role] || roleConfig.user;
  const RoleIcon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`${config.color} text-white border-0 gap-1.5 ${sizeClasses[size]}`}
    >
      <RoleIcon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );

  if (!showTooltip) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface PermissionIndicatorProps {
  hasPermission: boolean;
  action: string;
}

export function PermissionIndicator({ hasPermission, action }: PermissionIndicatorProps) {
  if (hasPermission) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1 text-muted-foreground text-xs">
            <Lock className="h-3 w-3" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Você não tem permissão para {action}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
