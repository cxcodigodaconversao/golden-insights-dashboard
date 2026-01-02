import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export type PeriodType = "custom";

interface PeriodFilterProps {
  onPeriodChange: (start: Date, end: Date, type: PeriodType) => void;
  currentPeriod: PeriodType;
  dateRange?: { start: Date; end: Date };
}

export function PeriodFilter({ onPeriodChange, dateRange: externalDateRange }: PeriodFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    externalDateRange ? { from: externalDateRange.start, to: externalDateRange.end } : undefined
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onPeriodChange(startOfDay(range.from), endOfDay(range.to), "custom");
      setIsOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="default"
            className={cn(
              "h-10 px-4 transition-all border-border bg-card hover:bg-secondary hover:border-primary/50",
              dateRange?.from && dateRange?.to && "bg-primary/10 border-primary/50"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {dateRange?.from && dateRange?.to ? (
              <span className="text-foreground">
                {format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })} - {format(dateRange.to, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            ) : (
              <span className="text-muted-foreground">Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border" align="end">
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
    </div>
  );
}
