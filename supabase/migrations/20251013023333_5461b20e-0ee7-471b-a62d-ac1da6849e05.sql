-- Enable realtime for travel_events table
ALTER TABLE public.travel_events REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.travel_events;