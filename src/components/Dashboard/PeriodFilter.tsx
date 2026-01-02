import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export type PeriodType = "today" | "week" | "biweekly" | "month" | "quarter" | "semester" | "year" | "custom";

interface PeriodFilterProps {
  onPeriodChange: (start: Date, end: Date, type: PeriodType) => void;
  currentPeriod: PeriodType;
}

const periodOptions: { label: string; value: PeriodType }[] = [
  { label: "Hoje", value: "today" },
  { label: "Semana", value: "week" },
  { label: "Quinzena", value: "biweekly" },
  { label: "Mês", value: "month" },
  { label: "Trimestre", value: "quarter" },
  { label: "Semestre", value: "semester" },
  { label: "Ano", value: "year" },
  { label: "Período", value: "custom" },
];

export function PeriodFilter({ onPeriodChange, currentPeriod }: PeriodFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const handlePeriodClick = (period: PeriodType) => {
    const now = new Date();
    let start: Date;
    let end: Date = endOfDay(now);

    switch (period) {
      case "today":
        start = startOfDay(now);
        break;
      case "week":
        start = startOfWeek(now, { locale: ptBR });
        end = endOfWeek(now, { locale: ptBR });
        break;
      case "biweekly":
        start = subDays(now, 14);
        break;
      case "month":
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case "quarter":
        start = startOfQuarter(now);
        end = endOfQuarter(now);
        break;
      case "semester":
        start = subMonths(startOfMonth(now), 6);
        break;
      case "year":
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      default:
        return;
    }

    onPeriodChange(start, end, period);
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onPeriodChange(startOfDay(range.from), endOfDay(range.to), "custom");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {periodOptions.map((option) => (
        option.value === "custom" ? (
          <Popover key={option.value}>
            <PopoverTrigger asChild>
              <Button
                variant={currentPeriod === "custom" ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 transition-all",
                  currentPeriod === "custom"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-card hover:bg-secondary hover:border-primary/50"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`
                  : option.label}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleCustomDateSelect}
                numberOfMonths={2}
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            key={option.value}
            variant={currentPeriod === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodClick(option.value)}
            className={cn(
              "h-9 transition-all",
              currentPeriod === option.value
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border-border bg-card hover:bg-secondary hover:border-primary/50"
            )}
          >
            {option.label}
          </Button>
        )
      ))}
    </div>
  );
}
