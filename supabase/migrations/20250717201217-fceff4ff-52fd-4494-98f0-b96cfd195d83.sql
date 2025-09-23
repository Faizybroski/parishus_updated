-- Fix the trigger to handle errors properly and ensure all required fields are provided
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
  
  -- Always create a profile record first
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
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(user_role::public.user_role, 'user'::public.user_role),
    CASE WHEN user_role IN ('admin', 'superadmin') THEN true ELSE false END
  );

  -- If the role is admin or superadmin, create an admin record
  -- But only if the email doesn't already exist in admins table
  IF user_role IN ('admin', 'superadmin') AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE email = NEW.email
  ) THEN
    INSERT INTO public.admins (
      email,
      first_name,
      last_name,
      role,
      password_hash,
      is_active
    )
    VALUES (
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      CASE 
        WHEN user_role = 'superadmin' THEN 'super_admin'::admin_role 
        ELSE 'moderator'::admin_role 
      END,
      'supabase_managed', -- Placeholder since we use Supabase auth
      true
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();