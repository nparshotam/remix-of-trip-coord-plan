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
    };
  }, [travelEvents]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Travel Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Work vs Personal */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <Briefcase className="h-4 w-4" />
              Work Travel
            </span>
            <span className="flex items-center gap-1">
              Personal Travel
              <User className="h-4 w-4" />
            </span>
          </div>
          <div className="relative h-4 rounded-full bg-muted overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-np-work transition-all"
              style={{ width: `${stats.workPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{stats.workTotal} days ({stats.workPct}%)</span>
            <span>{stats.personalTotal} days ({100 - stats.workPct}%)</span>
          </div>
        </div>

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
            {stats.together} days traveling together out of {stats.totalDays} total travel days
          </p>
        </div>

        {/* Individual Breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-2">
            <p className="text-sm font-medium text-np-travel">NP Travel</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Personal:</span>
                <span className="font-medium">{stats.npPersonal} days</span>
              </div>
              <div className="flex justify-between">
                <span>Work:</span>
                <span className="font-medium">{stats.npWork} days</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ Together:</span>
                <span>{stats.together} days</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-sw-travel">SW Travel</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Personal:</span>
                <span className="font-medium">{stats.swPersonal} days</span>
              </div>
              <div className="flex justify-between">
                <span>Work:</span>
                <span className="font-medium">{stats.swWork} days</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>+ Together:</span>
                <span>{stats.together} days</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
