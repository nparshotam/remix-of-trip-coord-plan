import { useMemo } from "react";
import { CalendarEvent, EventType, EVENT_LABELS } from "@/types/calendar";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlyDistributionProps {
  events: CalendarEvent[];
}

const TRAVEL_TYPES: EventType[] = ["np-travel", "sw-travel", "together", "np-work", "sw-work"];
const WORK_TYPES: EventType[] = ["np-work", "sw-work"];
const PERSONAL_TYPES: EventType[] = ["np-travel", "sw-travel", "together"];

const COLORS: Record<EventType, string> = {
  "np-travel": "hsl(var(--np-travel))",
  "sw-travel": "hsl(var(--sw-travel))",
  "together": "hsl(var(--together))",
  "np-work": "hsl(var(--np-work))",
  "sw-work": "hsl(var(--sw-work))",
  "blackout": "hsl(var(--blackout))",
  "us-holiday": "hsl(var(--us-holiday))",
  "sg-holiday": "hsl(var(--sg-holiday))",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MonthlyDistribution = ({ events }: MonthlyDistributionProps) => {
  const travelEvents = useMemo(() => 
    events.filter(e => TRAVEL_TYPES.includes(e.type)),
    [events]
  );

  const monthlyData = useMemo(() => {
    const data = MONTHS.map((month, index) => {
      const monthEvents = travelEvents.filter(e => {
        const eventMonth = new Date(e.date + 'T00:00:00').getMonth();
        return eventMonth === index;
      });

      const workDays = monthEvents.filter(e => WORK_TYPES.includes(e.type)).length;
      const personalDays = monthEvents.filter(e => PERSONAL_TYPES.includes(e.type)).length;

      return {
        month,
        work: workDays,
        personal: personalDays,
        total: workDays + personalDays,
      };
    });

    return data;
  }, [travelEvents]);

  const maxDays = Math.max(...monthlyData.map(d => d.total), 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Travel Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, maxDays]} tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const work = payload.find(p => p.dataKey === 'work')?.value || 0;
                    const personal = payload.find(p => p.dataKey === 'personal')?.value || 0;
                    return (
                      <div className="bg-background border rounded-lg p-2 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm" style={{ color: 'hsl(var(--np-work))' }}>Work: {work} days</p>
                        <p className="text-sm" style={{ color: 'hsl(var(--np-travel))' }}>Personal: {personal} days</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="work" name="Work Travel" stackId="a" fill="hsl(var(--np-work))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="personal" name="Personal Travel" stackId="a" fill="hsl(var(--together))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
