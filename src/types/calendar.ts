export type EventType = 
  | "np-travel" 
  | "sw-travel" 
  | "together" 
  | "blackout" 
  | "us-holiday" 
  | "sg-holiday";

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD format
  type: EventType;
  title: string;
  description?: string;
}

export const EVENT_LABELS: Record<EventType, string> = {
  "np-travel": "NP Travel",
  "sw-travel": "SW Travel",
  "together": "Together",
  "blackout": "Blackout Dates",
  "us-holiday": "US Public Holiday",
  "sg-holiday": "Singapore Public Holiday",
};

export const EVENT_COLORS: Record<EventType, string> = {
  "np-travel": "bg-np-travel",
  "sw-travel": "bg-sw-travel",
  "together": "bg-together",
  "blackout": "bg-blackout",
  "us-holiday": "bg-us-holiday",
  "sg-holiday": "bg-sg-holiday",
};
