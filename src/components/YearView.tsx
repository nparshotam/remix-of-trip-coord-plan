import { useState } from "react";
import { CalendarEvent, EVENT_COLORS } from "@/types/calendar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface YearViewProps {
  year: number;
  events: CalendarEvent[];
  onDateClick: (date: string) => void;
  onDateRangeSelect?: (start: string, end: string) => void;
}

export const YearView = ({ year, events, onDateClick, onDateRangeSelect }: YearViewProps) => {
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<string | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
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

  const handleMouseDown = (date: string, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setDragStart(date);
    setSelectedStartDate(date);
  };

  const handleMouseUp = (date: string, event: React.MouseEvent) => {
    if (isDragging && dragStart && onDateRangeSelect) {
      const start = dragStart < date ? dragStart : date;
      const end = dragStart < date ? date : dragStart;
      if (start !== end) {
        onDateRangeSelect(start, end);
      } else {
        onDateClick(date);
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setSelectedStartDate(null);
  };

  const handleMouseEnter = (date: string) => {
    setHoverDate(date);
    if (isDragging) {
      setSelectedStartDate(date);
    }
  };

  const handleDateClick = (date: string, event: React.MouseEvent) => {
    if (event.shiftKey && selectedStartDate && onDateRangeSelect) {
      // Shift+click: select range
      const start = selectedStartDate < date ? selectedStartDate : date;
      const end = selectedStartDate < date ? date : selectedStartDate;
      onDateRangeSelect(start, end);
      setSelectedStartDate(null);
    } else {
      // Normal click: set start date
      setSelectedStartDate(date);
      onDateClick(date);
    }
  };

  const isInDragRange = (date: string) => {
    if (!isDragging || !dragStart || !hoverDate) return false;
    const start = dragStart < hoverDate ? dragStart : hoverDate;
    const end = dragStart < hoverDate ? hoverDate : dragStart;
    return date >= start && date <= end;
  };

  const getDaysInRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const renderMonth = (monthIndex: number) => {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const firstDay = getFirstDayOfMonth(year, monthIndex);
    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const prevMonthDays = getDaysInMonth(year, monthIndex - 1);
      const day = prevMonthDays - firstDay + i + 1;
      days.push(
        <div key={`prev-${i}`} className="text-center text-xs text-muted-foreground/40 p-1">
          {day}
        </div>
      );
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = formatDate(year, monthIndex, day);
      const dayEvents = getEventsForDate(date);
      const isToday = new Date().toISOString().split("T")[0] === date;
      
      // Check if this is a World Cup date (special case)
      const hasWorldCup = dayEvents.some(e => e.title.toLowerCase().includes("world cup"));
      
      // Get the background color from the shortest duration event (prioritize shorter ranges)
      const priorityEvent = getShortestDurationEvent(dayEvents.filter(e => !e.title.toLowerCase().includes("world cup")));
      const bgColor = priorityEvent ? EVENT_COLORS[priorityEvent.type] : "";

      const showRangeInfo = isDragging && dragStart && hoverDate === date && dragStart !== date;
      const rangeDays = showRangeInfo && dragStart ? getDaysInRange(dragStart, date) : 0;
      const inDragRange = isInDragRange(date);

      const dayButton = (
        <button
          key={day}
          onMouseDown={(e) => handleMouseDown(date, e)}
          onMouseUp={(e) => handleMouseUp(date, e)}
          onMouseEnter={() => handleMouseEnter(date)}
          onMouseLeave={() => setHoverDate(null)}
          className={cn(
            "text-center text-xs p-1 rounded hover:ring-1 hover:ring-primary transition-all select-none",
            bgColor,
            isToday && "ring-2 ring-primary font-bold",
            inDragRange && "ring-2 ring-accent bg-accent/30",
            dragStart === date && "ring-2 ring-accent bg-accent/40",
            hasWorldCup && "italic text-world-cup"
          )}
        >
          {day}
        </button>
      );

      if (dayEvents.length > 0 || showRangeInfo) {
        days.push(
          <Tooltip key={day}>
            <TooltipTrigger asChild>
              {dayButton}
            </TooltipTrigger>
            <TooltipContent>
              {showRangeInfo && (
                <div className="font-semibold mb-1">
                  Release to select {rangeDays} {rangeDays === 1 ? 'day' : 'days'}
                </div>
              )}
              {dayEvents.length > 0 && (
                <div className="space-y-1">
                  {dayEvents.map((event) => {
                    const duration = getEventDuration(event);
                    const isWorldCup = event.title.toLowerCase().includes("world cup");
                    return (
                      <div key={event.id}>
                        <div className={cn("font-semibold", isWorldCup && "italic text-world-cup")}>{event.title}</div>
                        {duration > 1 && (
                          <div className="text-xs text-muted-foreground">
                            {duration} days
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        );
      } else {
        days.push(dayButton);
      }
    }

    // Add empty cells for days after month ends
    const remainingCells = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
      days.push(
        <div key={`next-${i}`} className="text-center text-xs text-muted-foreground/40 p-1">
          {i}
        </div>
      );
    }

    return (
      <div key={monthIndex} className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">{monthNames[monthIndex]}</h3>
        <div className="grid grid-cols-7 gap-0.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
            <div key={i} className="text-center text-[10px] font-medium text-muted-foreground pb-1">
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>
    </TooltipProvider>
  );
};
