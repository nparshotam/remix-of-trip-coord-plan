import React from "react";
import { CalendarEvent, EVENT_LABELS, EVENT_COLORS, EventType } from "@/types/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ListViewProps {
  events: CalendarEvent[];
  onDeleteEvent: (id: string) => void;
  onDateClick: (date: string, type: EventType) => void;
  onDateRangeSelect: (start: string, end: string, type: EventType) => void;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2026 is not a leap year, but using 29 for Feb
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ListView = ({ events, onDeleteEvent, onDateClick, onDateRangeSelect }: ListViewProps) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{ date: string; type: EventType } | null>(null);
  const [dragEnd, setDragEnd] = React.useState<{ date: string; type: EventType } | null>(null);
  const [selectedStartDate, setSelectedStartDate] = React.useState<{ date: string; type: EventType } | null>(null);

  const handleMouseDown = (date: string, type: EventType, event: React.MouseEvent) => {
    if (event.shiftKey && selectedStartDate && selectedStartDate.type === type) {
      // Shift+click: select range
      const start = selectedStartDate.date < date ? selectedStartDate.date : date;
      const end = selectedStartDate.date < date ? date : selectedStartDate.date;
      onDateRangeSelect(start, end, type);
      setSelectedStartDate(null);
    } else {
      // Regular drag or click
      setIsDragging(true);
      setDragStart({ date, type });
      setDragEnd({ date, type });
      setSelectedStartDate({ date, type });
    }
  };

  const handleMouseEnter = (date: string, type: EventType) => {
    if (isDragging && dragStart && dragStart.type === type) {
      setDragEnd({ date, type });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const start = dragStart.date < dragEnd.date ? dragStart.date : dragEnd.date;
      const end = dragStart.date < dragEnd.date ? dragEnd.date : dragStart.date;
      
      if (start === end) {
        onDateClick(start, dragStart.type);
      } else {
        onDateRangeSelect(start, end, dragStart.type);
      }
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      return () => window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, dragStart, dragEnd]);

  const isInRange = (date: string, type: EventType) => {
    if (!isDragging || !dragStart || !dragEnd || dragStart.type !== type) return false;
    const start = dragStart.date < dragEnd.date ? dragStart.date : dragEnd.date;
    const end = dragStart.date < dragEnd.date ? dragEnd.date : dragStart.date;
    return date >= start && date <= end;
  };

  const getDaysInRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getEventDuration = (event: CalendarEvent) => {
    // Find all events with the same title and type
    const relatedEvents = events.filter(
      (e) => e.title === event.title && e.type === event.type
    );
    
    if (relatedEvents.length === 1) return 1;
    
    // Get all dates and sort them
    const dates = relatedEvents.map((e) => e.date).sort();
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return diffDays;
  };

  // Generate all dates for 2026
  const allDates: Array<{ month: number; day: number; dateStr: string; dayOfWeek: number }> = [];
  for (let month = 0; month < 12; month++) {
    for (let day = 1; day <= DAYS_IN_MONTH[month]; day++) {
      const dateStr = `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const date = new Date(dateStr);
      const dayOfWeek = date.getDay();
      allDates.push({ month, day, dateStr, dayOfWeek });
    }
  }

  // Group events by date and type
  const eventsByDate: Record<string, Record<EventType, CalendarEvent[]>> = {};
  events.forEach((event) => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = {
        "np-travel": [],
        "sw-travel": [],
        "together": [],
        "blackout": [],
        "us-holiday": [],
        "sg-holiday": [],
        "np-work": [],
        "sw-work": [],
      };
    }
    eventsByDate[event.date][event.type].push(event);
  });

  const rowTypes: Array<{ type: EventType; label: string }> = [
    { type: "np-travel", label: "NP" },
    { type: "sw-travel", label: "SW" },
    { type: "together", label: "Together" },
    { type: "np-work", label: "NP Work" },
    { type: "sw-work", label: "SW Work" },
    { type: "blackout", label: "Blackout" },
    { type: "us-holiday", label: "US Holiday" },
    { type: "sg-holiday", label: "SG Holiday" },
  ];

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No events scheduled yet. Click on dates in the calendar to add events.
      </div>
    );
  }

  return (
    <Card className="p-4">
      <ScrollArea className="w-full">
        <div className="min-w-max">
          {/* Month Headers */}
          <div className="flex border-b">
            <div className="w-32 flex-shrink-0 sticky left-0 bg-background z-10 border-r px-3 py-2 font-semibold text-sm">
              Month
            </div>
            <div className="flex">
              {MONTH_NAMES.map((monthName, monthIndex) => (
                <div
                  key={monthIndex}
                  className="px-2 py-2 text-center font-semibold text-sm border-r"
                  style={{ width: `${DAYS_IN_MONTH[monthIndex] * 40}px` }}
                >
                  {monthName}
                </div>
              ))}
            </div>
          </div>

          {/* Day Names */}
          <div className="flex border-b">
            <div className="w-32 flex-shrink-0 sticky left-0 bg-background z-10 border-r px-3 py-2 font-semibold text-sm">
              Day
            </div>
            <div className="flex">
              {allDates.map((date, idx) => (
                <div
                  key={idx}
                  className="w-10 px-1 py-1 text-center text-xs border-r"
                >
                  {DAY_NAMES[date.dayOfWeek]}
                </div>
              ))}
            </div>
          </div>

          {/* Date Numbers */}
          <div className="flex border-b">
            <div className="w-32 flex-shrink-0 sticky left-0 bg-background z-10 border-r px-3 py-2 font-semibold text-sm">
              Date
            </div>
            <div className="flex">
              {allDates.map((date, idx) => (
                <div
                  key={idx}
                  className="w-10 px-1 py-2 text-center text-xs border-r"
                >
                  {date.day}
                </div>
              ))}
            </div>
          </div>

          {/* Event Rows */}
          {rowTypes.map((row) => (
            <div key={row.type} className="flex border-b">
              <div className="w-32 flex-shrink-0 sticky left-0 bg-background z-10 border-r px-3 py-3 font-medium text-sm">
                {row.label}
              </div>
              <div className="flex">
                {allDates.map((date, idx) => {
                  const dateEvents = eventsByDate[date.dateStr]?.[row.type] || [];
                  const inRange = isInRange(date.dateStr, row.type);
                  const showRangeTooltip = inRange && dragStart && dragEnd && dragStart.type === row.type;
                  const rangeDays = showRangeTooltip ? getDaysInRange(
                    dragStart!.date < dragEnd!.date ? dragStart!.date : dragEnd!.date,
                    dragStart!.date < dragEnd!.date ? dragEnd!.date : dragStart!.date
                  ) : 0;

                  const cellContent = dateEvents.length > 0 ? (
                    <div
                      className={cn(
                        "h-8 rounded",
                        EVENT_COLORS[row.type]
                      )}
                    />
                  ) : (
                    <div className="h-8" />
                  );

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "w-10 px-1 py-1 border-r cursor-pointer hover:bg-accent select-none",
                        inRange && "bg-accent/50",
                        selectedStartDate?.date === date.dateStr && selectedStartDate.type === row.type && "ring-2 ring-inset ring-accent"
                      )}
                      onMouseDown={(e) => handleMouseDown(date.dateStr, row.type, e)}
                      onMouseEnter={() => handleMouseEnter(date.dateStr, row.type)}
                    >
                      {dateEvents.length > 0 || showRangeTooltip ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {cellContent}
                            </TooltipTrigger>
                            <TooltipContent>
                              {showRangeTooltip && (
                                <div className="font-semibold mb-1">
                                  {rangeDays} {rangeDays === 1 ? 'day' : 'days'} selected
                                </div>
                              )}
                              {dateEvents.length > 0 && (
                                <div className="space-y-1">
                                  {dateEvents.map((event) => {
                                    const duration = getEventDuration(event);
                                    const isWorldCup = event.title.toLowerCase().includes("world cup");
                                    return (
                                      <div key={event.id} className="text-xs">
                                        <div className={cn("font-semibold", isWorldCup && "italic text-world-cup")}>{event.title}</div>
                                        {duration > 1 && (
                                          <div className="text-muted-foreground">
                                            {duration} days
                                          </div>
                                        )}
                                        {event.description && (
                                          <div className="text-muted-foreground">{event.description}</div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        cellContent
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
};
