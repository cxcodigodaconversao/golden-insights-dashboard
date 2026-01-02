import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gold" | "success" | "warning";
  className?: string;
  delay?: number;
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
  delay = 0,
}: KPICardProps) {
  const variants = {
    default: "bg-card border-border",
    gold: "bg-card border-primary/30 glow-gold",
    success: "bg-card border-success/30",
    warning: "bg-card border-warning/30",
  };

  const iconVariants = {
    default: "bg-secondary text-foreground",
    gold: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-6 card-shadow opacity-0 animate-fade-in",
        variants[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-3xl font-display font-bold tracking-tight",
            variant === "gold" && "text-primary"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">vs período anterior</span>
            </div>
          )}
        </div>
        <div className={cn("rounded-lg p-3", iconVariants[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Decorative gradient */}
      {variant === "gold" && (
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      )}
    </div>
  );
}
