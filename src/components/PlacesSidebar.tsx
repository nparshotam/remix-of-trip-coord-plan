import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, MapPin } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlaces } from "@/hooks/usePlaces";

export function PlacesSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { places: dbPlaces, addPlace, deletePlace, updatePlacesOrder } = usePlaces();
  const [newPlace, setNewPlace] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [localPlaces, setLocalPlaces] = useState(dbPlaces);

  // Sync local places with database places when not dragging
  useEffect(() => {
    if (!draggedId) {
      setLocalPlaces(dbPlaces);
    }
  }, [dbPlaces, draggedId]);

  const places = draggedId ? localPlaces : dbPlaces;

  const handleAddPlace = () => {
    if (!newPlace.trim()) return;
    addPlace(newPlace.trim());
    setNewPlace("");
  };

  const handleDeletePlace = (id: string) => {
    deletePlace(id);
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = localPlaces.findIndex((p) => p.id === draggedId);
    const targetIndex = localPlaces.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newPlaces = [...localPlaces];
    const [draggedItem] = newPlaces.splice(draggedIndex, 1);
    newPlaces.splice(targetIndex, 0, draggedItem);

    // Update local state only during drag (optimistic UI, no database call)
    setLocalPlaces(newPlaces);
  };

  const handleDragEnd = () => {
    if (draggedId) {
      // Save final order to database when drag completes
      const reorderedPlaces = localPlaces.map((place, index) => ({
        ...place,
        order_index: index,
      }));
      
      // Use the database update function
      updatePlacesOrder(reorderedPlaces);
    }
    setDraggedId(null);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-80"} collapsible="icon">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Places to Visit
          </h2>
        )}
        <SidebarTrigger />
      </div>

      <SidebarContent>
        {!collapsed && (
          <div className="p-4 space-y-2 border-b border-sidebar-border">
            <Input
              placeholder="Add a place..."
              value={newPlace}
              onChange={(e) => setNewPlace(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddPlace();
                }
              }}
            />
            <Button onClick={handleAddPlace} className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Place
            </Button>
          </div>
        )}

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Your List</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {places.length === 0 && !collapsed && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No places yet. Add one above!
                </div>
              )}
              {places.map((place) => (
                <SidebarMenuItem
                  key={place.id}
                  draggable
                  onDragStart={() => handleDragStart(place.id)}
                  onDragOver={(e) => handleDragOver(e, place.id)}
                  onDragEnd={handleDragEnd}
                  className="cursor-move"
                >
                  <div className="flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent group">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-sm truncate">{place.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeletePlace(place.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
