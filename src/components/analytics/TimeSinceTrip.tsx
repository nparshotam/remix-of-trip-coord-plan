import { useMemo } from "react";
import { CalendarEvent, EventType, EVENT_LABELS } from "@/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Plane } from "lucide-react";

interface TimeSinceTripProps {
  events: CalendarEvent[];
}

const TRAVEL_TYPES: EventType[] = ["np-travel", "sw-travel", "together", "np-work", "sw-work"];

const isWorldCupEvent = (event: CalendarEvent) => 
  event.title.toLowerCase().includes("world cup");

export const TimeSinceTrip = ({ events }: TimeSinceTripProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const travelEvents = useMemo(() => 
    events
      .filter(e => TRAVEL_TYPES.includes(e.type) && !isWorldCupEvent(e))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [events]
  );

  const stats = useMemo(() => {
    if (travelEvents.length === 0) {
      return { lastTrip: null, nextTrip: null, daysSince: 0, daysUntil: 0 };
    }

    // Find last trip (most recent date before today)
    const pastTrips = travelEvents.filter(e => new Date(e.date + 'T00:00:00') < today);
    const lastTripEvent = pastTrips.length > 0 ? pastTrips[pastTrips.length - 1] : null;

    // Find next trip (earliest date >= today)
    const futureTrips = travelEvents.filter(e => new Date(e.date + 'T00:00:00') >= today);
    const nextTripEvent = futureTrips.length > 0 ? futureTrips[0] : null;

    // Calculate days
    const daysSince = lastTripEvent 
      ? Math.floor((today.getTime() - new Date(lastTripEvent.date + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const daysUntil = nextTripEvent
      ? Math.floor((new Date(nextTripEvent.date + 'T00:00:00').getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      lastTrip: lastTripEvent,
      nextTrip: nextTripEvent,
      daysSince,
      daysUntil,
    };
  }, [travelEvents, today]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Trip Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Days Since Last Trip */}
        <div className="text-center p-4 rounded-lg bg-muted/50">
          {stats.lastTrip ? (
            <>
              <div className="text-4xl font-bold text-primary">{stats.daysSince}</div>
              <div className="text-sm text-muted-foreground mt-1">days since last trip</div>
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stats.lastTrip.title}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(stats.lastTrip.date)}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">No past trips found</div>
          )}
        </div>

        {/* Days Until Next Trip */}
        <div className="text-center p-4 rounded-lg bg-together/10 border border-together/20">
          {stats.nextTrip ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Plane className="h-5 w-5 text-together" />
                <span className="text-sm font-medium text-together">Next Adventure</span>
              </div>
              <div className="text-4xl font-bold text-together">{stats.daysUntil}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {stats.daysUntil === 0 ? "Today!" : stats.daysUntil === 1 ? "day to go!" : "days to go!"}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{stats.nextTrip.title}</span>
              </div>
              <Badge variant="secondary" className="mt-2">
                {formatDate(stats.nextTrip.date)}
              </Badge>
            </>
          ) : (
            <div className="text-muted-foreground py-4">
              No upcoming trips scheduled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
