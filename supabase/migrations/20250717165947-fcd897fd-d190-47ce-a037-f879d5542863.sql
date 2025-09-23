-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin', 'superadmin');

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies for admin access
CREATE POLICY "Admin users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "SuperAdmin users can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.get_current_user_role() = 'superadmin');

-- RLS policies for events (admins can manage all events)
CREATE POLICY "Admin users can view all events" 
ON public.events 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

CREATE POLICY "Admin users can manage all events" 
ON public.events 
FOR ALL 
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- RLS policies for feedback (admins can view all feedback)
CREATE POLICY "Admin users can view all feedback" 
ON public.feedback 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- RLS policies for payments (admins can view all payments)
CREATE POLICY "Admin users can view all payments" 
ON public.payments 
FOR SELECT 
USING (public.get_current_user_role() IN ('admin', 'superadmin'));

-- Update the handle_new_user function to include role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;