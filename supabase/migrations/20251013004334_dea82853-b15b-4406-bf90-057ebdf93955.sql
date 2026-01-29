-- Create enum for event types
CREATE TYPE public.event_type AS ENUM (
  'np-travel',
  'sw-travel', 
  'together',
  'blackout',
  'us-holiday',
  'sg-holiday'
);

-- Create travel_events table
CREATE TABLE public.travel_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_travel_events_user_date ON public.travel_events(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.travel_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own events
CREATE POLICY "Users can view their own events"
  ON public.travel_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
  ON public.travel_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON public.travel_events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON public.travel_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_travel_events_updated_at
  BEFORE UPDATE ON public.travel_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();