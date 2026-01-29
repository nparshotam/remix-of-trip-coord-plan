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
const WORK_TYPES: EventType[] = ["np-work", "sw-work"];
const PERSONAL_TYPES: EventType[] = ["np-travel", "sw-travel", "together"];

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

    const npTotal = npPersonal + npWork + together;
    const swTotal = swPersonal + swWork + together;
    const workTotal = npWork + swWork;
    const personalTotal = npPersonal + swPersonal + together;
    const totalDays = travelEvents.length;
    
    // Together time percentage
    const togetherPct = totalDays > 0 ? Math.round((together / totalDays) * 100) : 0;
    
    // Work vs Personal balance
    const workPct = totalDays > 0 ? Math.round((workTotal / totalDays) * 100) : 0;

    // Max for bar scaling
    const maxIndividual = Math.max(npPersonal, swPersonal, npWork, swWork, 1);

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
      workPct,
      maxIndividual,
    };
  }, [travelEvents]);

  const BarRow = ({ label, value, color, max }: { label: string; value: number; color: string; max: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-medium">{value} days</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`}
          style={{ width: `${max > 0 ? (value / max) * 100 : 0}%` }}
        />
      </div>
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Travel Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        {/* Individual Breakdown with Bars */}
        <div className="space-y-3 pt-2 border-t">
          <p className="text-sm font-medium flex items-center gap-1">
            <User className="h-4 w-4" />
            Personal Travel
          </p>
          <div className="space-y-2 pl-2">
            <BarRow label="NP Travel" value={stats.npPersonal} color="bg-np-travel" max={stats.maxIndividual} />
            <BarRow label="SW Travel" value={stats.swPersonal} color="bg-sw-travel" max={stats.maxIndividual} />
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t">
          <p className="text-sm font-medium flex items-center gap-1">
            <Briefcase className="h-4 w-4" />
            Work Travel
          </p>
          <div className="space-y-2 pl-2">
            <BarRow label="NP Work" value={stats.npWork} color="bg-np-work" max={stats.maxIndividual} />
            <BarRow label="SW Work" value={stats.swWork} color="bg-sw-work" max={stats.maxIndividual} />
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-center">
          <div>
            <p className="text-2xl font-bold">{stats.personalTotal}</p>
            <p className="text-xs text-muted-foreground">Personal days</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.workTotal}</p>
            <p className="text-xs text-muted-foreground">Work days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
