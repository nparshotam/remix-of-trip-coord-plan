import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Calendar } from "@/components/ui/calendar";
import { EventType, EVENT_LABELS } from "@/types/calendar";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlaces } from "@/hooks/usePlaces";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { type: EventType; title: string; description?: string; startDate: string; endDate: string }) => void;
  onUpdate?: (data: { 
    id: string; 
    type: EventType; 
    title: string; 
    description?: string; 
    date: string;
    relatedEventIds?: string[];
    dateRange?: { start: string; end: string };
  }) => void;
  dateRange: { start: string; end?: string; type?: EventType };
  editingEvent?: { 
    id: string; 
    date: string; 
    type: EventType; 
    title: string; 
    description?: string;
    dateRange?: { start: string; end: string };
    relatedEventIds?: string[];
  } | null;
}

export const EventModal = ({ open, onOpenChange, onSave, onUpdate, dateRange, editingEvent }: EventModalProps) => {
  const { places, refreshPlaces } = usePlaces();
  const [type, setType] = useState<EventType>(dateRange.type || "np-travel");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [openCombobox, setOpenCombobox] = useState(false);

  // Update form when editing or creating
  useEffect(() => {
    if (editingEvent) {
      setType(editingEvent.type);
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || "");
      if (editingEvent.dateRange) {
        setStartDate(new Date(editingEvent.dateRange.start + "T00:00:00"));
        setEndDate(new Date(editingEvent.dateRange.end + "T00:00:00"));
      } else {
        setStartDate(new Date(editingEvent.date + "T00:00:00"));
        setEndDate(new Date(editingEvent.date + "T00:00:00"));
      }
    } else {
      setTitle("");
      setDescription("");
      if (dateRange.start) {
        setStartDate(new Date(dateRange.start + "T00:00:00"));
      }
      if (dateRange.end) {
        setEndDate(new Date(dateRange.end + "T00:00:00"));
      } else if (dateRange.start) {
        setEndDate(new Date(dateRange.start + "T00:00:00"));
      }
      if (dateRange.type) {
        setType(dateRange.type);
      }
    }
  }, [dateRange, editingEvent]);

  useEffect(() => {
    if (open) {
      refreshPlaces();
    }
  }, [open]);

  useEffect(() => {
    if (openCombobox) {
      refreshPlaces();
    }
  }, [openCombobox]);

  const handleSave = () => {
    if (title.trim() && startDate) {
      if (editingEvent && onUpdate) {
        // Update existing event or range
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : startDateStr;
        onUpdate({
          id: editingEvent.id,
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          date: startDateStr,
          relatedEventIds: editingEvent.relatedEventIds,
          dateRange: { start: startDateStr, end: endDateStr },
        });
      } else if (endDate) {
        // Create new event(s)
        const startDateStr = format(startDate, "yyyy-MM-dd");
        const endDateStr = format(endDate, "yyyy-MM-dd");
        onSave({
          type,
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: startDateStr,
          endDate: endDateStr,
        });
      }
      setTitle("");
      setDescription("");
      onOpenChange(false);
    }
  };

  const formatDateRange = () => {
    if (dateRange.end && dateRange.end !== dateRange.start) {
      return `${dateRange.start} to ${dateRange.end}`;
    }
    return dateRange.start;
  };

  const getDaysCount = () => {
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {editingEvent ? `Editing event for ${editingEvent.date}` : `Create an event for ${formatDateRange()}`}
            <span className="block text-sm font-medium mt-1">
              {getDaysCount()} {getDaysCount() === 1 ? 'day' : 'days'}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">Event Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as EventType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    defaultMonth={startDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    defaultMonth={endDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className="w-full justify-between"
                >
                  {title || "Select a place or type custom title..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 z-50 bg-popover" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search places or type custom title..." 
                    value={title}
                    onValueChange={setTitle}
                  />
                  <CommandList>
                    <CommandEmpty>Type to add custom title</CommandEmpty>
                    <CommandGroup heading="Saved Places">
                      <div className="max-h-[200px] overflow-y-auto">
                        {places
                          .filter(place => 
                            place.name.toLowerCase().includes(title.toLowerCase())
                          )
                          .map((place) => (
                            <CommandItem
                              key={place.id}
                              value={place.name}
                              onSelect={(currentValue) => {
                                setTitle(currentValue);
                                setOpenCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  title === place.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {place.name}
                            </CommandItem>
                          ))}
                      </div>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes about this event..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !startDate || (!editingEvent && !endDate)}>
            {editingEvent ? "Update Event" : "Save Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
