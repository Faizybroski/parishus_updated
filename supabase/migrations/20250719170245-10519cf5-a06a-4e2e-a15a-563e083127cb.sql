-- Update RSVP system for Yes/No/Maybe responses
-- Create RSVP status enum
CREATE TYPE public.rsvp_status AS ENUM ('yes', 'no', 'maybe', 'pending');

-- Add RSVP status to existing rsvps table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rsvps' AND column_name = 'response_status') THEN
        ALTER TABLE public.rsvps ADD COLUMN response_status public.rsvp_status DEFAULT 'pending';
    END IF;
END $$;

-- Add RSVP deadline to events table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'rsvp_deadline') THEN
        ALTER TABLE public.events ADD COLUMN rsvp_deadline timestamp with time zone;
    END IF;
END $$;

-- Add admin notifications for events
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'admin_notification_email') THEN
        ALTER TABLE public.events ADD COLUMN admin_notification_email text;
    END IF;
END $$;

-- Create event invitations table for tracking invites
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  invitation_status text DEFAULT 'sent'
);

-- Enable RLS on event_invitations
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_invitations
CREATE POLICY "Users can view their own invitations" 
ON public.event_invitations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Event creators can manage invitations" 
ON public.event_invitations 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events 
    WHERE events.id = event_invitations.event_id 
    AND events.creator_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all invitations" 
ON public.event_invitations 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'superadmin')
  )
);

-- Update RSVP policies to include response status
DROP POLICY IF EXISTS "Users can update their own RSVPs" ON public.rsvps;
CREATE POLICY "Users can update their own RSVPs" 
ON public.rsvps 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Function to automatically notify admins when RSVP is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_on_rsvp()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for event creator
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  )
  SELECT 
    events.creator_id,
    'rsvp_received',
    'New RSVP Received',
    'Someone has responded to your event: ' || events.name,
    jsonb_build_object(
      'event_id', NEW.event_id,
      'rsvp_id', NEW.id,
      'response_status', NEW.response_status
    )
  FROM public.events 
  WHERE events.id = NEW.event_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for RSVP notifications
DROP TRIGGER IF EXISTS trigger_notify_admin_on_rsvp ON public.rsvps;
CREATE TRIGGER trigger_notify_admin_on_rsvp
  AFTER INSERT OR UPDATE OF response_status ON public.rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_rsvp();