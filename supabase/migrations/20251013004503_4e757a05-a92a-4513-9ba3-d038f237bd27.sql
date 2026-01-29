-- Drop existing RLS policies that require authentication
DROP POLICY IF EXISTS "Users can view their own events" ON public.travel_events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.travel_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.travel_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.travel_events;

-- Make user_id nullable since we don't have authentication
ALTER TABLE public.travel_events ALTER COLUMN user_id DROP NOT NULL;

-- Create public access policies
CREATE POLICY "Anyone can view events"
  ON public.travel_events
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create events"
  ON public.travel_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update events"
  ON public.travel_events
  FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete events"
  ON public.travel_events
  FOR DELETE
  USING (true);