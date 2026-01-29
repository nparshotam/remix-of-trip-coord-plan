import { useState } from "react";
import { CalendarEvent, EVENT_COLORS } from "@/types/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  onDateClick: (date: string, type?: string) => void;
  onDateRangeSelect: (start: string, end: string) => void;
  rangeMode: boolean;
}

export const CalendarGrid = ({
  year,
  month,
  events,
  onDateClick,
  onDateRangeSelect,
  rangeMode,
}: CalendarGridProps) => {
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatDate = (day: number) => {
    const m = (month + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const getEventsForDate = (date: string) => {
    return events.filter((e) => e.date === date);
  };

  // Find consecutive events (within 1 day gap) with same title and type
  const getConsecutiveEvents = (event: CalendarEvent) => {
    const allRelated = events
      .filter((e) => e.title === event.title && e.type === event.type)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (allRelated.length === 1) return [event];
    
    const eventIndex = allRelated.findIndex(e => e.id === event.id);
    if (eventIndex === -1) return [event];
    
    // Expand backwards
    let startIdx = eventIndex;
    for (let i = eventIndex - 1; i >= 0; i--) {
      const prevDate = new Date(allRelated[i].date);
      const currDate = new Date(allRelated[i + 1].date);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) startIdx = i;
      else break;
    }
    
    // Expand forwards
    let endIdx = eventIndex;
    for (let i = eventIndex; i < allRelated.length - 1; i++) {
      const currDate = new Date(allRelated[i].date);
      const nextDate = new Date(allRelated[i + 1].date);
      const diffDays = (nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) endIdx = i + 1;
      else break;
    }
    
    return allRelated.slice(startIdx, endIdx + 1);
  };

  const getEventDuration = (event: CalendarEvent) => {
    return getConsecutiveEvents(event).length;
  };

  const getShortestDurationEvent = (dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return null;
    if (dayEvents.length === 1) return dayEvents[0];
    
    // Find the event with the shortest duration
    let shortestEvent = dayEvents[0];
    let shortestDuration = getEventDuration(dayEvents[0]);
    
    for (let i = 1; i < dayEvents.length; i++) {
      const duration = getEventDuration(dayEvents[i]);
      if (duration < shortestDuration) {
        shortestDuration = duration;
        shortestEvent = dayEvents[i];
      }
    }
    
    return shortestEvent;
  };

  // Sort events by duration (shortest first) for display
  const getSortedEventsByDuration = (dayEvents: CalendarEvent[]) => {
    return [...dayEvents].sort((a, b) => getEventDuration(a) - getEventDuration(b));
  };

  const handleDayClick = (day: number, event: React.MouseEvent) => {
    const date = formatDate(day);
    
    if (event.shiftKey && selectedStartDate) {
      // Shift+click: select range
      const start = selectedStartDate < date ? selectedStartDate : date;
      const end = selectedStartDate < date ? date : selectedStartDate;
      onDateRangeSelect(start, end);
      setSelectedStartDate(null);
      setRangeStart(null);
    } else if (rangeMode) {
      if (!rangeStart) {
        setRangeStart(date);
        setSelectedStartDate(date);
      } else {
        const start = rangeStart < date ? rangeStart : date;
        const end = rangeStart < date ? date : rangeStart;
        onDateRangeSelect(start, end);
        setRangeStart(null);
        setSelectedStartDate(null);
      }
    } else {
      setSelectedStartDate(date);
      onDateClick(date);
    }
  };

  const isInRange = (day: number) => {
    const date = formatDate(day);
    if (rangeMode && rangeStart && rangeStart === date) return true;
    if (selectedStartDate && selectedStartDate === date) return true;
    return false;
  };

  const getDaysInRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(day);
    const dayEvents = getEventsForDate(date);
    const isToday = new Date().toISOString().split("T")[0] === date;
    const isRangeStart = isInRange(day);

    const dayButton = (
      <button
        key={day}
        onClick={(e) => handleDayClick(day, e)}
        className={cn(
          "min-h-24 p-1 rounded-lg border border-border hover:border-primary transition-colors relative group flex flex-col",
          isToday && "ring-2 ring-primary",
          isRangeStart && "bg-primary/10 ring-2 ring-accent"
        )}
      >
        <div className={cn("text-xs mb-1 font-medium", dayEvents.length > 0 && "font-semibold")}>{day}</div>
        <div className="flex flex-col gap-1 w-full overflow-hidden">
          {getSortedEventsByDuration(dayEvents).slice(0, 3).map((event) => {
            const duration = getEventDuration(event);
            const isWorldCup = event.title.toLowerCase().includes("world cup");
            return (
              <Tooltip key={event.id}>
                <TooltipTrigger asChild>
                  <Badge
                    onClick={(e) => {
                      e.stopPropagation();
                      onDateClick(date, event.type);
                    }}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 truncate w-full justify-start cursor-pointer hover:opacity-80",
                      !isWorldCup && EVENT_COLORS[event.type],
                      !isWorldCup && "text-white border-0",
                      isWorldCup && "italic text-world-cup bg-transparent border border-world-cup"
                    )}
                  >
                    {event.title}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="font-semibold">{event.title}</div>
                    {duration > 1 && (
                      <div className="text-xs text-muted-foreground">
                        {duration} days
                      </div>
                    )}
                    {event.description && (
                      <div className="text-xs mt-1">{event.description}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {dayEvents.length > 3 && (
            <div className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
          )}
        </div>
      </button>
    );

    if (isRangeStart && rangeStart) {
      const numDays = getDaysInRange(rangeStart, date);
      days.push(
        <Tooltip key={day}>
          <TooltipTrigger asChild>
            {dayButton}
          </TooltipTrigger>
          <TooltipContent>
            {numDays === 1 ? "Starting date" : `${numDays} days selected`}
          </TooltipContent>
        </Tooltip>
      );
    } else {
      days.push(dayButton);
    }
  }

  const showRangeTooltip = rangeMode && rangeStart;
  const rangeTooltipText = showRangeTooltip && rangeStart ? `Click to complete range (starting ${rangeStart})` : "";

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">
          {monthNames[month]} {year}
        </h2>
        <div className="grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    </TooltipProvider>
  );
};
