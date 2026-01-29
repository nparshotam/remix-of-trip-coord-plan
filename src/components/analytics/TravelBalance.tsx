import { useMemo } from "react";
import { CalendarEvent, EventType, EVENT_LABELS } from "@/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, User } from "lucide-react";

interface TravelBalanceProps {
  events: CalendarEvent[];
}

const TRAVEL_TYPES: EventType[] = ["np-travel", "sw-travel", "together", "np-work", "sw-work"];

const isWorldCupEvent = (event: CalendarEvent) => 
  event.title.toLowerCase().includes("world cup");

export const TravelBalance = ({ events }: TravelBalanceProps) => {
  const travelEvents = useMemo(() => 
    events.filter(e => TRAVEL_TYPES.includes(e.type) && !isWorldCupEvent(e)),
    [events]
  );

  const stats = useMemo(() => {
    const npPersonal = travelEvents.filter(e => e.type === "np-travel").length;
    const swPersonal = travelEvents.filter(e => e.type === "sw-travel").length;
    const together = travelEvents.filter(e => e.type === "together").length;
    const npWork = travelEvents.filter(e => e.type === "np-work").length;
    const swWork = travelEvents.filter(e => e.type === "sw-work").length;

    const npTotal = npPersonal + npWork;
    const swTotal = swPersonal + swWork;
    const workTotal = npWork + swWork;
    const personalTotal = npPersonal + swPersonal + together;
    const totalDays = travelEvents.length;
    
    // Together time percentage
    const togetherPct = totalDays > 0 ? Math.round((together / totalDays) * 100) : 0;
    
    // Work percentages for each person
    const npWorkPct = npTotal > 0 ? Math.round((npWork / npTotal) * 100) : 0;
    const swWorkPct = swTotal > 0 ? Math.round((swWork / swTotal) * 100) : 0;

    return {
      npPersonal,
      swPersonal,
      together,
      npWork,
      swWork,
      npTotal,
      swTotal,
      workTotal,
      personalTotal,
      totalDays,
      togetherPct,
      npWorkPct,
      swWorkPct,
    };
  }, [travelEvents]);

  const SplitBar = ({ 
    label, 
    workValue, 
    personalValue, 
    workPct, 
    workColor, 
    personalColor 
  }: { 
    label: string; 
    workValue: number; 
    personalValue: number; 
    workPct: number; 
    workColor: string; 
    personalColor: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs">
          {workValue + personalValue} days total
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden flex">
        <div 
          className={`h-full ${workColor} transition-all`}
          style={{ width: `${workPct}%` }}
        />
        <div 
          className={`h-full ${personalColor} transition-all`}
          style={{ width: `${100 - workPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3" />
          {workValue} work
        </span>
        <span className="flex items-center gap-1">
          {personalValue} personal
          <User className="h-3 w-3" />
        </span>
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Travel Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Together Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-1">
              <Users className="h-4 w-4" />
              Together Time
            </span>
            <Badge variant="secondary" className="bg-together/20 text-together">
              {stats.togetherPct}%
            </Badge>
          </div>
          <Progress value={stats.togetherPct} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {stats.together} days together out of {stats.totalDays} total
          </p>
        </div>

        {/* NP Balance Bar */}
        <div className="pt-2 border-t">
          <SplitBar 
            label="NP Travel" 
            workValue={stats.npWork} 
            personalValue={stats.npPersonal}
            workPct={stats.npWorkPct}
            workColor="bg-np-work"
            personalColor="bg-np-travel"
          />
        </div>

        {/* SW Balance Bar */}
        <div className="pt-2 border-t">
          <SplitBar 
            label="SW Travel" 
            workValue={stats.swWork} 
            personalValue={stats.swPersonal}
            workPct={stats.swWorkPct}
            workColor="bg-sw-work"
            personalColor="bg-sw-travel"
          />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-np-work" /> Work
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-np-travel" /> Personal
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
