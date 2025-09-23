-- Create custom types
CREATE TYPE dining_style AS ENUM ('adventurous', 'foodie_enthusiast', 'local_lover', 'comfort_food', 'health_conscious', 'social_butterfly');
CREATE TYPE dietary_preference AS ENUM ('vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'keto', 'paleo', 'halal', 'kosher', 'no_restrictions');
CREATE TYPE gender_identity AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say');
CREATE TYPE admin_role AS ENUM ('super_admin', 'moderator');
CREATE TYPE notification_type AS ENUM ('rsvp_confirmation', 'event_reminder', 'crossed_paths_match', 'feedback_request', 'general');
CREATE TYPE event_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  dining_style dining_style,
  dietary_preferences dietary_preference[],
  gender_identity gender_identity,
  job_title TEXT,
  location_city TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  profile_photo_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  date_time TIMESTAMPTZ NOT NULL,
  location_name TEXT,
  location_address TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  cover_photo_url TEXT,
  max_attendees INTEGER DEFAULT 10,
  tags TEXT[],
  dining_style dining_style,
  dietary_theme dietary_preference,
  status event_status DEFAULT 'active',
  is_mystery_dinner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create RSVPs table
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  is_running_late BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create crossed_paths table
CREATE TABLE public.crossed_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  location_name TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  CHECK (user1_id != user2_id)
);

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  flagged_users UUID[],
  is_addressed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role admin_role NOT NULL DEFAULT 'moderator',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan subscription_plan,
  amount INTEGER, -- in cents
  currency TEXT DEFAULT 'usd',
  status payment_status DEFAULT 'pending',
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crossed_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view other profiles for events" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.rsvps r 
    JOIN public.events e ON r.event_id = e.id 
    WHERE (r.user_id = auth.uid() OR e.creator_id = auth.uid()) 
    AND profiles.user_id = r.user_id
  )
);

-- Create RLS policies for events
CREATE POLICY "Users can view all active events" ON public.events FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create events" ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING (auth.uid() = creator_id);

-- Create RLS policies for rsvps
CREATE POLICY "Users can view RSVPs for their events" ON public.rsvps FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = rsvps.event_id 
    AND (e.creator_id = auth.uid() OR rsvps.user_id = auth.uid())
  )
);
CREATE POLICY "Users can create their own RSVPs" ON public.rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RSVPs" ON public.rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own RSVPs" ON public.rsvps FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for crossed_paths
CREATE POLICY "Users can view their own crossed paths" ON public.crossed_paths FOR SELECT USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);
CREATE POLICY "System can insert crossed paths" ON public.crossed_paths FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their crossed paths" ON public.crossed_paths FOR UPDATE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);

-- Create RLS policies for feedback
CREATE POLICY "Users can view feedback for their events" ON public.feedback FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = feedback.event_id 
    AND (e.creator_id = auth.uid() OR feedback.user_id = auth.uid())
  )
);
CREATE POLICY "Users can create their own feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own feedback" ON public.feedback FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.payments FOR UPDATE USING (true);

-- Admin policies (bypass RLS with service role)
CREATE POLICY "Service role can manage all data" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Service role can manage all events" ON public.events FOR ALL USING (true);
CREATE POLICY "Service role can manage all rsvps" ON public.rsvps FOR ALL USING (true);
CREATE POLICY "Service role can manage all crossed_paths" ON public.crossed_paths FOR ALL USING (true);
CREATE POLICY "Service role can manage all feedback" ON public.feedback FOR ALL USING (true);
CREATE POLICY "Service role can manage all notifications" ON public.notifications FOR ALL USING (true);
CREATE POLICY "Service role can manage all payments" ON public.payments FOR ALL USING (true);

-- Admin table policies
CREATE POLICY "Admins can view all admins" ON public.admins FOR SELECT USING (true);
CREATE POLICY "Super admins can manage admins" ON public.admins FOR ALL USING (true);
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('event-photos', 'event-photos', true);

-- Create storage policies
CREATE POLICY "Profile photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
CREATE POLICY "Users can upload their own profile photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own profile photos" ON storage.objects FOR UPDATE USING (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own profile photos" ON storage.objects FOR DELETE USING (
  bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Event photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'event-photos');
CREATE POLICY "Users can upload event photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-photos');
CREATE POLICY "Users can update event photos" ON storage.objects FOR UPDATE USING (bucket_id = 'event-photos');
CREATE POLICY "Users can delete event photos" ON storage.objects FOR DELETE USING (bucket_id = 'event-photos');