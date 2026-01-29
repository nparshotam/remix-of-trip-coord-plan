import { useState, useMemo } from "react";
import { CalendarEvent, EventType, EVENT_LABELS } from "@/types/calendar";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TravelAnalyticsProps {
  events: CalendarEvent[];
}

const TRAVEL_TYPES: EventType[] = ["np-travel", "sw-travel", "together"];

const COLORS: Record<EventType, string> = {
  "np-travel": "hsl(var(--np-travel))",
  "sw-travel": "hsl(var(--sw-travel))",
  "together": "hsl(var(--together))",
  "blackout": "hsl(var(--blackout))",
  "us-holiday": "hsl(var(--us-holiday))",
  "sg-holiday": "hsl(var(--sg-holiday))",
};

interface TripGroup {
  title: string;
  type: EventType;
  dates: string[];
  startDate: string;
  endDate: string;
  days: number;
}

export const TravelAnalytics = ({ events }: TravelAnalyticsProps) => {
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripGroup | null>(null);

  // Filter to only travel types
  const travelEvents = useMemo(() => 
    events.filter(e => TRAVEL_TYPES.includes(e.type)),
    [events]
  );

  // Group consecutive events into trips
  const tripGroups = useMemo(() => {
    const groups: TripGroup[] = [];
    const sortedEvents = [...travelEvents].sort((a, b) => a.date.localeCompare(b.date));
    
    sortedEvents.forEach(event => {
      // Find existing group with same title and type where this date is consecutive
      const existingGroup = groups.find(g => {
        if (g.title !== event.title || g.type !== event.type) return false;
        const lastDate = new Date(g.endDate);
        const eventDate = new Date(event.date);
        const diffDays = (eventDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 1 && diffDays >= 0;
      });

      if (existingGroup) {
        existingGroup.dates.push(event.date);
        if (event.date > existingGroup.endDate) existingGroup.endDate = event.date;
        if (event.date < existingGroup.startDate) existingGroup.startDate = event.date;
        existingGroup.days = existingGroup.dates.length;
      } else {
        groups.push({
          title: event.title,
          type: event.type,
          dates: [event.date],
          startDate: event.date,
          endDate: event.date,
          days: 1,
        });
      }
    });

    return groups;
  }, [travelEvents]);

  // Pie chart data
  const pieData = useMemo(() => {
    return TRAVEL_TYPES.map(type => {
      const typeTrips = tripGroups.filter(g => g.type === type);
      const totalDays = typeTrips.reduce((sum, g) => sum + g.days, 0);
      return {
        name: EVENT_LABELS[type],
        value: totalDays,
        type,
        trips: typeTrips.length,
      };
    }).filter(d => d.value > 0);
  }, [tripGroups]);

  // Filtered trips for selected type
  const filteredTrips = useMemo(() => {
    if (!selectedType) return [];
    return tripGroups
      .filter(g => g.type === selectedType)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [tripGroups, selectedType]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePieClick = (data: { type: EventType }) => {
    setSelectedType(data.type);
    setSelectedTrip(null);
  };

  const handleBack = () => {
    if (selectedTrip) {
      setSelectedTrip(null);
    } else {
      setSelectedType(null);
    }
  };

  // Summary stats
  const totalDays = pieData.reduce((sum, d) => sum + d.value, 0);
  const totalTrips = tripGroups.length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {(selectedType || selectedTrip) && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle>
            {selectedTrip 
              ? selectedTrip.title 
              : selectedType 
                ? EVENT_LABELS[selectedType] 
                : "Travel Analytics"}
          </CardTitle>
        </div>
        {!selectedType && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{totalTrips} trips</span>
            <span>{totalDays} days</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!selectedType && !selectedTrip && (
          <div className="h-[300px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(_, index) => handlePieClick(pieData[index])}
                    className="cursor-pointer"
                    label={({ name, value, trips }) => `${value}d / ${trips} trips`}
                    labelLine={true}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.type]}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{data.value} days</p>
                            <p className="text-sm text-muted-foreground">{data.trips} trips</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No travel events found
              </div>
            )}
          </div>
        )}

        {selectedType && !selectedTrip && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Badge 
                className="text-white"
                style={{ backgroundColor: COLORS[selectedType] }}
              >
                {filteredTrips.reduce((sum, t) => sum + t.days, 0)} total days
              </Badge>
              <span className="text-sm text-muted-foreground">
                across {filteredTrips.length} trips
              </span>
            </div>
            {filteredTrips.map((trip, index) => (
              <div
                key={`${trip.title}-${trip.startDate}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => setSelectedTrip(trip)}
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{trip.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(trip.startDate)}
                      {trip.days > 1 && ` - ${formatDate(trip.endDate)}`}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{trip.days} days</Badge>
              </div>
            ))}
          </div>
        )}

        {selectedTrip && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge 
                className="text-white"
                style={{ backgroundColor: COLORS[selectedTrip.type] }}
              >
                {EVENT_LABELS[selectedTrip.type]}
              </Badge>
              <Badge variant="secondary">{selectedTrip.days} days</Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDate(selectedTrip.startDate)}
                  {selectedTrip.days > 1 && ` - ${formatDate(selectedTrip.endDate)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{selectedTrip.title}</span>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">All dates:</p>
              <div className="flex flex-wrap gap-1">
                {selectedTrip.dates.sort().map(date => (
                  <Badge key={date} variant="outline" className="text-xs">
                    {formatDate(date)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
