-- Add work-specific travel types to the event_type enum
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'np-work';
ALTER TYPE public.event_type ADD VALUE IF NOT EXISTS 'sw-work';