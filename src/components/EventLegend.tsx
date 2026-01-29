import { EVENT_LABELS, EVENT_COLORS, EventType } from "@/types/calendar";

export const EventLegend = () => {
  const eventTypes: EventType[] = [
    "np-travel",
    "sw-travel",
    "together",
    "blackout",
    "us-holiday",
    "sg-holiday",
  ];

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
      {eventTypes.map((type) => (
        <div key={type} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${EVENT_COLORS[type]}`} />
          <span className="text-sm">{EVENT_LABELS[type]}</span>
        </div>
      ))}
    </div>
  );
};
