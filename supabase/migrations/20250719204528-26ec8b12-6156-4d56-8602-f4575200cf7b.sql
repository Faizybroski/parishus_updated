-- Create reservations table for RSVP management
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL,
  reservation_type TEXT NOT NULL DEFAULT 'standard',
  reservation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Create policies for reservations
CREATE POLICY "Users can view their own reservations" 
ON public.reservations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations" 
ON public.reservations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations" 
ON public.reservations 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view reservations for their events" 
ON public.reservations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.events 
  WHERE events.id = reservations.event_id 
  AND events.creator_id = auth.uid()
));

CREATE POLICY "Admin users can view all reservations" 
ON public.reservations 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

CREATE POLICY "Admin users can manage all reservations" 
ON public.reservations 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::user_role, 'superadmin'::user_role]));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();