import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

interface CloserCalendarViewProps {
  closerId: string;
  closerNome: string;
  onSelectSlot: (date: Date, hora: string) => void;
  onClose: () => void;
}

// Time slots for business hours (8:00 - 18:00)
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
];

export function CloserCalendarView({
  closerId,
  closerNome,
  onSelectSlot,
  onClose,
}: CloserCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalendar, setHasCalendar] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch events when date changes
  useEffect(() => {
    const fetchDayEvents = async () => {
      if (!closerId || !selectedDate) return;

      setIsLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase.functions.invoke("google-calendar", {
          body: {
            action: "get_day_events",
            closerId,
            date: selectedDate.toISOString(),
          },
        });

        if (error) throw error;

        setDayEvents(data.events || []);
        setHasCalendar(data.hasCalendar);
      } catch (err) {
        console.error("Erro ao buscar eventos:", err);
        setError("Erro ao carregar agenda");
        setDayEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDayEvents();
  }, [closerId, selectedDate]);

  // Check if a time slot is occupied
  const isSlotOccupied = (slot: string): boolean => {
    if (!dayEvents.length) return false;

    const [slotHour, slotMinute] = slot.split(":").map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(slotHour, slotMinute, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(slotEnd.getHours() + 1);

    return dayEvents.some(event => {
      const eventStart = new Date(event.start.dateTime || event.start.date || "");
      const eventEnd = new Date(event.end.dateTime || event.end.date || "");

      // Check for overlap
      return eventStart < slotEnd && eventEnd > slotStart;
    });
  };

  // Check if slot is in the past
  const isSlotInPast = (slot: string): boolean => {
    const now = new Date();
    const [slotHour, slotMinute] = slot.split(":").map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(slotHour, slotMinute, 0, 0);
    
    return slotDate < now;
  };

  const handleSlotClick = (slot: string) => {
    if (!isSlotOccupied(slot) && !isSlotInPast(slot)) {
      onSelectSlot(selectedDate, slot);
    }
  };

  // Disable past dates
  const disabledDays = { before: new Date() };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Calendar */}
      <div className="flex-shrink-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          disabled={disabledDays}
          locale={ptBR}
          className="rounded-md border"
        />
      </div>

      {/* Time slots */}
      <div className="flex-1 space-y-4">
        <div>
          <h4 className="font-semibold text-foreground">
            Horários - {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h4>
          <p className="text-sm text-muted-foreground">
            Agenda de {closerNome}
          </p>
        </div>

        {!hasCalendar && (
          <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">
            Este closer não tem Google Calendar conectado. Todos os horários estão disponíveis.
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando agenda...</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map((slot) => {
              const occupied = isSlotOccupied(slot);
              const inPast = isSlotInPast(slot);
              const disabled = occupied || inPast;

              return (
                <Button
                  key={slot}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSlotClick(slot)}
                  disabled={disabled}
                  className={cn(
                    "h-auto py-3 flex flex-col items-center gap-1",
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-primary hover:text-primary-foreground",
                    occupied && "bg-destructive/10 border-destructive/30",
                    !disabled && "bg-green-500/10 border-green-500/30 hover:bg-green-500 hover:border-green-500"
                  )}
                >
                  <span className="font-medium">{slot}</span>
                  <span className="text-xs flex items-center gap-1">
                    {occupied ? (
                      <>
                        <X className="h-3 w-3" />
                        Ocupado
                      </>
                    ) : inPast ? (
                      "Passado"
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Livre
                      </>
                    )}
                  </span>
                </Button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
