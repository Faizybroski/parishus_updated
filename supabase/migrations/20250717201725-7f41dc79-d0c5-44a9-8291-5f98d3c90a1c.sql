-- Fix the trigger - the admin records weren't being created properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
  profile_id uuid;
BEGIN
  -- Get the role from metadata, default to 'user'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  RAISE LOG 'Creating user with role: %, email: %', user_role, NEW.email;
  
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
    user_role::public.user_role,
    CASE WHEN user_role IN ('admin', 'superadmin') THEN true ELSE false END
  )
  RETURNING id INTO profile_id;

  RAISE LOG 'Profile created with ID: % for role: %', profile_id, user_role;

  -- If the role is admin or superadmin, create an admin record
  IF user_role IN ('admin', 'superadmin') THEN
    RAISE LOG 'Creating admin record for: %', NEW.email;
    
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
      'supabase_managed',
      true
    );
    
    RAISE LOG 'Admin record created successfully for: %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    -- Still return NEW so user creation doesn't fail
    RETURN NEW;
END;
$$;