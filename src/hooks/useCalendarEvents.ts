import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, EventType } from "@/types/calendar";
import { toast } from "sonner";

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    // Set up real-time subscription
    const channel = supabase
      .channel('travel-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'travel_events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("travel_events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;

      const mappedEvents: CalendarEvent[] = (data || []).map((event) => ({
        id: event.id,
        date: event.date,
        type: event.type as EventType,
        title: event.title,
        description: event.description || undefined,
      }));

      setEvents(mappedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (event: Omit<CalendarEvent, "id">) => {
    try {
      const { data, error } = await supabase
        .from("travel_events")
        .insert({
          date: event.date,
          type: event.type,
          title: event.title,
          description: event.description,
        })
        .select()
        .single();

      if (error) throw error;

      const newEvent: CalendarEvent = {
        id: data.id,
        date: data.date,
        type: data.type as EventType,
        title: data.title,
        description: data.description || undefined,
      };

      setEvents([...events, newEvent]);
      return newEvent;
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error("Failed to add event");
      return null;
    }
  };

  const addEvents = async (newEvents: Omit<CalendarEvent, "id">[]) => {
    try {
      const eventsToInsert = newEvents.map((event) => ({
        date: event.date,
        type: event.type,
        title: event.title,
        description: event.description,
      }));

      const { data, error } = await supabase
        .from("travel_events")
        .insert(eventsToInsert)
        .select();

      if (error) throw error;

      const mappedEvents: CalendarEvent[] = (data || []).map((event) => ({
        id: event.id,
        date: event.date,
        type: event.type as EventType,
        title: event.title,
        description: event.description || undefined,
      }));

      setEvents([...events, ...mappedEvents]);
      return mappedEvents;
    } catch (error) {
      console.error("Error adding events:", error);
      toast.error("Failed to add events");
      return [];
    }
  };

  const deleteEvent = async (id: string | string[]) => {
    try {
      const ids = Array.isArray(id) ? id : [id];
      
      const { error } = await supabase
        .from("travel_events")
        .delete()
        .in("id", ids);

      if (error) throw error;

      setEvents(events.filter((e) => !ids.includes(e.id)));
      toast.success("Event deleted");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const updateEvent = async (
    id: string | string[], 
    updates: Partial<Omit<CalendarEvent, "id">>,
    dateRange?: { start: string; end: string }
  ) => {
    try {
      const ids = Array.isArray(id) ? id : [id];
      
      // If updating a range, delete old events and create new ones
      if (dateRange && ids.length > 1) {
        // Delete all old events
        await supabase
          .from("travel_events")
          .delete()
          .in("id", ids);
        
        // Create new events for the date range using date string manipulation to avoid timezone issues
        const [startYear, startMonth, startDay] = dateRange.start.split('-').map(Number);
        const [endYear, endMonth, endDay] = dateRange.end.split('-').map(Number);
        
        const start = new Date(startYear, startMonth - 1, startDay);
        const end = new Date(endYear, endMonth - 1, endDay);
        const newEvents = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          newEvents.push({
            date: dateStr,
            type: updates.type,
            title: updates.title,
            description: updates.description,
          });
        }
        
        const { data, error } = await supabase
          .from("travel_events")
          .insert(newEvents)
          .select();
        
        if (error) throw error;
        
        const mappedEvents: CalendarEvent[] = (data || []).map((event) => ({
          id: event.id,
          date: event.date,
          type: event.type as EventType,
          title: event.title,
          description: event.description || undefined,
        }));
        
        setEvents([...events.filter((e) => !ids.includes(e.id)), ...mappedEvents]);
        toast.success("Event updated");
        return mappedEvents[0];
      } else {
        // Single event update
        const { data, error } = await supabase
          .from("travel_events")
          .update({
            date: updates.date,
            type: updates.type,
            title: updates.title,
            description: updates.description,
          })
          .in("id", ids)
          .select();

        if (error) throw error;

        const mappedEvents: CalendarEvent[] = (data || []).map((event) => ({
          id: event.id,
          date: event.date,
          type: event.type as EventType,
          title: event.title,
          description: event.description || undefined,
        }));

        setEvents(events.map((e) => {
          const updated = mappedEvents.find((u) => u.id === e.id);
          return updated || e;
        }));
        
        toast.success("Event updated");
        return mappedEvents[0];
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
      return null;
    }
  };

  return {
    events,
    loading,
    addEvent,
    addEvents,
    deleteEvent,
    updateEvent,
    refreshEvents: fetchEvents,
  };
};
