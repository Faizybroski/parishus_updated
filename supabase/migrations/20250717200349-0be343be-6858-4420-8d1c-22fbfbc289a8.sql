-- First, let's update the handle_new_user function to properly handle all roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the role from metadata, default to 'user'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Always create a profile record
  INSERT INTO public.profiles (
    user_id, 
    email, 
    first_name, 
    last_name, 
    role,
    onboarding_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    user_role::public.user_role,
    CASE WHEN user_role IN ('admin', 'superadmin') THEN true ELSE false END
  );

  -- If the role is admin or superadmin, also create an admin record
  IF user_role IN ('admin', 'superadmin') THEN
    INSERT INTO public.admins (
      email,
      first_name,
      last_name,
      role,
      password_hash,
      is_active
    )
    VALUES (
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      CASE WHEN user_role = 'superadmin' THEN 'super_admin'::admin_role ELSE 'moderator'::admin_role END,
      'supabase_auth', -- Placeholder since we're using Supabase auth
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();