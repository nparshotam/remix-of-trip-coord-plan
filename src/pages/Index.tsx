import { useState } from "react";
import { EventType, CalendarEvent } from "@/types/calendar";
import { CalendarGrid } from "@/components/CalendarGrid";
import { EventModal } from "@/components/EventModal";
import { EventDetailsDialog } from "@/components/EventDetailsDialog";
import { EventLegend } from "@/components/EventLegend";
import { ListView } from "@/components/ListView";
import { YearView } from "@/components/YearView";
import { PlacesSidebar } from "@/components/PlacesSidebar";
import { TravelAnalytics } from "@/components/TravelAnalytics";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, List, ChevronLeft, ChevronRight, Loader2, CalendarDays, PieChart } from "lucide-react";
import { toast } from "sonner";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";

const AVAILABLE_YEARS = [2026, 2027, 2028];

const Index = () => {
  const { events, loading, addEvents, deleteEvent, updateEvent } = useCalendarEvents();
  const [selectedYear, setSelectedYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: string; end?: string; type?: EventType }>({
    start: "",
  });
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "year" | "analytics">("calendar");
  const [rangeMode, setRangeMode] = useState(false);

  // Find consecutive events (within 1 day gap) with same title and type
  const getConsecutiveEvents = (event: CalendarEvent) => {
    const allRelated = events
      .filter((e) => e.title === event.title && e.type === event.type)
      .sort((a, b) => a.date.localeCompare(b.date));
    
    if (allRelated.length === 1) return [event];
    
    // Find the consecutive group containing this event
    const eventIndex = allRelated.findIndex(e => e.id === event.id);
    if (eventIndex === -1) return [event];
    
    // Expand backwards
    let startIdx = eventIndex;
    for (let i = eventIndex - 1; i >= 0; i--) {
      const prevDate = new Date(allRelated[i].date);
      const currDate = new Date(allRelated[i + 1].date);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) {
        startIdx = i;
      } else {
        break;
      }
    }
    
    // Expand forwards
    let endIdx = eventIndex;
    for (let i = eventIndex; i < allRelated.length - 1; i++) {
      const currDate = new Date(allRelated[i].date);
      const nextDate = new Date(allRelated[i + 1].date);
      const diffDays = (nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) {
        endIdx = i + 1;
      } else {
        break;
      }
    }
    
    return allRelated.slice(startIdx, endIdx + 1);
  };

  // Helper to calculate event duration (only consecutive dates)
  const getEventDuration = (event: CalendarEvent) => {
    const consecutive = getConsecutiveEvents(event);
    return consecutive.length;
  };

  // Get the shortest duration event from a list (to match display priority)
  const getShortestDurationEvent = (dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return null;
    if (dayEvents.length === 1) return dayEvents[0];
    
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

  const handleDateClick = (date: string, type?: EventType) => {
    // Check if there are events on this date
    const dateEvents = events.filter(e => e.date === date && (!type || e.type === type));
    
    if (dateEvents.length > 0) {
      // Select the shortest duration event (matches display priority)
      // This ensures clicking on overlapping events selects the visually prioritized one
      const clickedEvent = type 
        ? dateEvents[0] // If type is specified (badge click), use that event
        : getShortestDurationEvent(dateEvents) || dateEvents[0];
      
      // Find only CONSECUTIVE related events (not all events with same title across years)
      const consecutiveEvents = getConsecutiveEvents(clickedEvent);
      
      // Create a combined event object with the range information
      const eventRange = {
        ...clickedEvent,
        dateRange: consecutiveEvents.length > 1 
          ? { start: consecutiveEvents[0].date, end: consecutiveEvents[consecutiveEvents.length - 1].date }
          : { start: clickedEvent.date, end: clickedEvent.date },
        relatedEventIds: consecutiveEvents.map(e => e.id),
      };
      
      setSelectedEvent(eventRange as any);
      setDetailsOpen(true);
    } else {
      // No events, open modal to create
      setEditingEvent(null);
      setSelectedDateRange({ start: date, type });
      setModalOpen(true);
    }
  };

  const handleDateRangeSelect = (start: string, end: string, type?: EventType) => {
    setEditingEvent(null);
    setSelectedDateRange({ start, end, type });
    setModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent & { dateRange?: { start: string; end: string }; relatedEventIds?: string[] }) => {
    setEditingEvent({
      ...event,
      dateRange: event.dateRange,
      relatedEventIds: event.relatedEventIds,
    } as any);
    setSelectedDateRange({ 
      start: event.dateRange?.start || event.date, 
      end: event.dateRange?.end || event.date,
      type: event.type 
    });
    setModalOpen(true);
  };

  const handleDeleteEvent = async (eventIds: string | string[]) => {
    await deleteEvent(eventIds);
  };

  const handleUpdateEvent = async (data: { 
    id: string; 
    type: EventType; 
    title: string; 
    description?: string; 
    date: string;
    relatedEventIds?: string[];
    dateRange?: { start: string; end: string };
  }) => {
    const ids = data.relatedEventIds && data.relatedEventIds.length > 1 
      ? data.relatedEventIds 
      : data.id;
    
    await updateEvent(
      ids,
      {
        type: data.type,
        title: data.title,
        description: data.description,
        date: data.date,
      },
      data.dateRange
    );
    
    setEditingEvent(null);
  };

  const handleSaveEvent = async (data: { type: EventType; title: string; description?: string; startDate: string; endDate: string }) => {
    const newEvents: Array<{ date: string; type: EventType; title: string; description?: string }> = [];

    if (data.endDate && data.endDate !== data.startDate) {
      // Create events for date range using date string manipulation to avoid timezone issues
      const [startYear, startMonth, startDay] = data.startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = data.endDate.split('-').map(Number);
      
      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        newEvents.push({
          date: dateStr,
          type: data.type,
          title: data.title,
          description: data.description,
        });
      }
    } else {
      // Single date event
      newEvents.push({
        date: data.startDate,
        type: data.type,
        title: data.title,
        description: data.description,
      });
    }

    const added = await addEvents(newEvents);
    if (added.length > 0) {
      toast.success(`Event${added.length > 1 ? 's' : ''} added successfully!`);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => Math.max(0, prev - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => Math.min(11, prev + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <PlacesSidebar />
      <main className="flex-1 bg-background p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">{selectedYear} Travel Calendar</h1>
            <p className="text-muted-foreground mt-1">Plan your adventures for the year</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
              size="sm"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "year" ? "default" : "outline"}
              onClick={() => setViewMode("year")}
              size="sm"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Year
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
              size="sm"
            >
              <List className="mr-2 h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "analytics" ? "default" : "outline"}
              onClick={() => setViewMode("analytics")}
              size="sm"
            >
              <PieChart className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </header>

        <EventLegend />

        {viewMode === "calendar" && (
          <>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePreviousMonth}
                disabled={currentMonth === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={rangeMode ? "default" : "outline"}
                onClick={() => setRangeMode(!rangeMode)}
                size="sm"
              >
                {rangeMode ? "Range Mode: ON" : "Range Mode: OFF"}
              </Button>
              <Button
                variant="outline"
                onClick={handleNextMonth}
                disabled={currentMonth === 11}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <CalendarGrid
              year={selectedYear}
              month={currentMonth}
              events={events}
              onDateClick={handleDateClick}
              onDateRangeSelect={handleDateRangeSelect}
              rangeMode={rangeMode}
            />
          </>
        )}

        {viewMode === "year" && (
          <YearView
            year={selectedYear}
            events={events}
            onDateClick={handleDateClick}
            onDateRangeSelect={handleDateRangeSelect}
          />
        )}

        {viewMode === "list" && (
          <ListView 
            events={events} 
            onDeleteEvent={deleteEvent} 
            onDateClick={handleDateClick}
            onDateRangeSelect={handleDateRangeSelect}
          />
        )}

        {viewMode === "analytics" && (
          <TravelAnalytics events={events} />
        )}

        <EventModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onSave={handleSaveEvent}
          onUpdate={handleUpdateEvent}
          dateRange={selectedDateRange}
          editingEvent={editingEvent}
        />

        <EventDetailsDialog
          event={selectedEvent}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
        </div>
      </main>
    </div>
  );
};

export default Index;
