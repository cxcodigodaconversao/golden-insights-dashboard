import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MetasProgressBarProps {
  atual: number;
  meta: number;
  label: string;
  formatValue?: (value: number) => string;
}

export function MetasProgressBar({ atual, meta, label, formatValue }: MetasProgressBarProps) {
  if (meta <= 0) return null;

  const percentage = Math.min((atual / meta) * 100, 100);
  const displayPercentage = Math.round((atual / meta) * 100);

  const getColor = () => {
    if (percentage >= 100) return "bg-success";
    if (percentage >= 80) return "bg-warning";
    if (percentage >= 50) return "bg-warning/70";
    return "bg-destructive";
  };

  const getTextColor = () => {
    if (percentage >= 100) return "text-success";
    if (percentage >= 80) return "text-warning";
    if (percentage >= 50) return "text-warning/70";
    return "text-destructive";
  };

  const format = formatValue || ((v: number) => v.toString());

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className={cn("font-medium", getTextColor())}>
              {displayPercentage}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", getColor())}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {format(atual)} de {format(meta)} ({displayPercentage}%)
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
