import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Place {
  id: string;
  name: string;
  order_index: number;
}

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  // Serialize order updates to avoid deadlocks/timeouts
  const isUpdatingRef = useRef(false);
  const pendingOrderRef = useRef<Place[] | null>(null);

  const fetchPlaces = async () => {
    try {
      const { data, error } = await supabase
        .from("travel_places")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPlaces(data || []);
    } catch (error) {
      console.error("Error fetching places:", error);
      toast.error("Failed to load places");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();

    // Subscribe to real-time changes
    const channel = supabase
      .channel("travel_places_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "travel_places",
        },
        () => {
          fetchPlaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addPlace = async (name: string) => {
    const maxOrder = places.length > 0 
      ? Math.max(...places.map(p => p.order_index))
      : -1;

    const tempId = crypto.randomUUID();
    const optimisticPlace = {
      id: tempId,
      name,
      order_index: maxOrder + 1,
    };

    // Optimistic update
    setPlaces([...places, optimisticPlace]);

    try {
      const { data, error } = await supabase
        .from("travel_places")
        .insert({
          name,
          order_index: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp ID with real ID from database
      setPlaces(prev => prev.map(p => p.id === tempId ? data : p));
      toast.success("Place added!");
    } catch (error) {
      // Rollback on error
      setPlaces(prev => prev.filter(p => p.id !== tempId));
      console.error("Error adding place:", error);
      toast.error("Failed to add place");
    }
  };

  const deletePlace = async (id: string) => {
    // Store the deleted place for rollback
    const deletedPlace = places.find(p => p.id === id);
    
    // Optimistic update
    setPlaces(prev => prev.filter(p => p.id !== id));

    try {
      const { error } = await supabase
        .from("travel_places")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Place removed!");
    } catch (error) {
      // Rollback on error
      if (deletedPlace) {
        setPlaces(prev => [...prev, deletedPlace].sort((a, b) => a.order_index - b.order_index));
      }
      console.error("Error deleting place:", error);
      toast.error("Failed to remove place");
    }
  };

  // Process queued order updates sequentially
  const processOrderQueue = async () => {
    while (pendingOrderRef.current) {
      const toApply = pendingOrderRef.current;
      pendingOrderRef.current = null;

      try {
        const updates = toApply.map((place, index) => ({
          id: place.id,
          name: place.name,
          order_index: index,
        }));

        const { error } = await supabase
          .from("travel_places")
          .upsert(updates);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating places order:", error);
        toast.error("Failed to update order");
        await fetchPlaces();
      }
    }
    isUpdatingRef.current = false;
  };

  const updatePlacesOrder = (updatedPlaces: Place[]) => {
    // Update local state immediately for smooth UI
    setPlaces(updatedPlaces);

    // Queue latest state; collapse rapid calls into one save
    pendingOrderRef.current = updatedPlaces;

    if (isUpdatingRef.current) return;
    isUpdatingRef.current = true;
    void processOrderQueue();
  };


  return {
    places,
    loading,
    addPlace,
    deletePlace,
    updatePlacesOrder,
    refreshPlaces: fetchPlaces,
  };
}
