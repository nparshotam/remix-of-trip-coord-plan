-- Create travel_places table
CREATE TABLE public.travel_places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.travel_places ENABLE ROW LEVEL SECURITY;

-- Create policies for open access (no auth needed)
CREATE POLICY "Anyone can view places" 
ON public.travel_places 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create places" 
ON public.travel_places 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update places" 
ON public.travel_places 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete places" 
ON public.travel_places 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_travel_places_updated_at
BEFORE UPDATE ON public.travel_places
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();