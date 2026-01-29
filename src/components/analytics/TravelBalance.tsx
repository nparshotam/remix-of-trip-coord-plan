import { useMemo } from "react";
import { CalendarEvent, EventType } from "@/types/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, User, Home } from "lucide-react";

interface TravelBalanceProps {
  events: CalendarEvent[];
}

const TRAVEL_TYPES: EventType[] = ["np-travel", "sw-travel", "together", "np-work", "sw-work"];
const NP_SOLO_TYPES: EventType[] = ["np-travel", "np-work"];
const SW_SOLO_TYPES: EventType[] = ["sw-travel", "sw-work"];

const isWorldCupEvent = (event: CalendarEvent) => 
  event.title.toLowerCase().includes("world cup");

const DAYS_IN_YEAR = 365;

export const TravelBalance = ({ events }: TravelBalanceProps) => {
  const travelEvents = useMemo(() => 
    events.filter(e => TRAVEL_TYPES.includes(e.type) && !isWorldCupEvent(e)),
    [events]
  );

  const stats = useMemo(() => {
    const npPersonal = travelEvents.filter(e => e.type === "np-travel").length;
    const swPersonal = travelEvents.filter(e => e.type === "sw-travel").length;
    const togetherTravel = travelEvents.filter(e => e.type === "together").length;
    const npWork = travelEvents.filter(e => e.type === "np-work").length;
    const swWork = travelEvents.filter(e => e.type === "sw-work").length;

    const npTotal = npPersonal + npWork;
    const swTotal = swPersonal + swWork;
    
    // Percentages out of 365 days
    const npWorkPct = (npWork / DAYS_IN_YEAR) * 100;
    const npPersonalPct = (npPersonal / DAYS_IN_YEAR) * 100;
    const swWorkPct = (swWork / DAYS_IN_YEAR) * 100;
    const swPersonalPct = (swPersonal / DAYS_IN_YEAR) * 100;

    // Get unique dates for solo travel
    const npSoloDates = new Set(
      travelEvents
        .filter(e => NP_SOLO_TYPES.includes(e.type))
        .map(e => e.date)
    );
    
    const swSoloDates = new Set(
      travelEvents
        .filter(e => SW_SOLO_TYPES.includes(e.type))
        .map(e => e.date)
    );

    const allSoloDates = new Set([...npSoloDates, ...swSoloDates]);
    const daysApart = allSoloDates.size;
    const daysTogetherAtHome = DAYS_IN_YEAR - daysApart;
    const totalTogetherDays = daysTogetherAtHome + togetherTravel;
    const togetherPct = Math.round((totalTogetherDays / DAYS_IN_YEAR) * 100);

    return {
      npPersonal,
      swPersonal,
      togetherTravel,
      npWork,
      swWork,
      npTotal,
      swTotal,
      npWorkPct,
      npPersonalPct,
      swWorkPct,
      swPersonalPct,
      daysApart,
      daysTogetherAtHome,
      totalTogetherDays,
      togetherPct,
    };
  }, [travelEvents]);

  const YearBar = ({ 
    label, 
    workValue, 
    personalValue, 
    workPct, 
    personalPct,
    workColor, 
    personalColor 
  }: { 
    label: string; 
    workValue: number; 
    personalValue: number; 
    workPct: number;
    personalPct: number;
    workColor: string; 
    personalColor: string;
  }) => {
    const totalDays = workValue + personalValue;
    const homeDays = DAYS_IN_YEAR - totalDays;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground text-xs">
            {totalDays} days away / {DAYS_IN_YEAR}
          </span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden flex">
          <div 
            className={`h-full ${workColor} transition-all`}
            style={{ width: `${workPct}%` }}
          />
          <div 
            className={`h-full ${personalColor} transition-all`}
            style={{ width: `${personalPct}%` }}
          />
          {/* Remaining is muted (home) */}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            {workValue} work
          </span>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {personalValue} personal
          </span>
          <span className="flex items-center gap-1">
            <Home className="h-3 w-3" />
            {homeDays} home
          </span>
        </div>
      </div>
    );
  };

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
            {stats.totalTogetherDays} days together ({stats.daysTogetherAtHome} at home + {stats.togetherTravel} traveling)
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.daysApart} days apart this year
          </p>
        </div>

        {/* NP Year Bar */}
        <div className="pt-2 border-t">
          <YearBar 
            label="NP" 
            workValue={stats.npWork} 
            personalValue={stats.npPersonal}
            workPct={stats.npWorkPct}
            personalPct={stats.npPersonalPct}
            workColor="bg-np-work"
            personalColor="bg-np-travel"
          />
        </div>

        {/* SW Year Bar */}
        <div className="pt-2 border-t">
          <YearBar 
            label="SW" 
            workValue={stats.swWork} 
            personalValue={stats.swPersonal}
            workPct={stats.swWorkPct}
            personalPct={stats.swPersonalPct}
            workColor="bg-sw-work"
            personalColor="bg-sw-travel"
          />
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-3 pt-2 border-t text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-np-work" /> Work
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-np-travel" /> Personal
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted" /> Home
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
