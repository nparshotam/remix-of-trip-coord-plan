import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CalendarEvent, EVENT_LABELS } from "@/types/calendar";
import { Edit, Trash2 } from "lucide-react";

interface EventDetailsDialogProps {
  event: (CalendarEvent & { dateRange?: { start: string; end: string }; relatedEventIds?: string[] }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (event: CalendarEvent & { dateRange?: { start: string; end: string }; relatedEventIds?: string[] }) => void;
  onDelete: (ids: string | string[]) => void;
}

export const EventDetailsDialog = ({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: EventDetailsDialogProps) => {
  if (!event) return null;

  const handleDelete = () => {
    if (event.relatedEventIds && event.relatedEventIds.length > 0) {
      onDelete(event.relatedEventIds);
    } else {
      onDelete(event.id);
    }
    onOpenChange(false);
  };

  const handleEdit = () => {
    onEdit(event);
    onOpenChange(false);
  };

  const isRange = event.dateRange && event.dateRange.start !== event.dateRange.end;
  const dateDisplay = isRange 
    ? `${event.dateRange!.start} to ${event.dateRange!.end}`
    : event.date;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{event.title}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="mt-4 block space-y-2">
              <span className="block">
                <span className="font-semibold">Type:</span> {EVENT_LABELS[event.type]}
              </span>
              <span className="block">
                <span className="font-semibold">Date:</span> {dateDisplay}
              </span>
              {event.description && (
                <span className="block">
                  <span className="font-semibold">Description:</span>
                  <span className="block mt-1">{event.description}</span>
                </span>
              )}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
