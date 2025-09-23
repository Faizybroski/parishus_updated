-- Fix existing admin/superadmin users who don't have admin records
INSERT INTO public.admins (
  email,
  first_name,
  last_name,
  role,
  password_hash,
  is_active
)
SELECT 
  p.email,
  p.first_name,
  p.last_name,
  CASE 
    WHEN p.role = 'superadmin' THEN 'super_admin'::admin_role 
    ELSE 'moderator'::admin_role 
  END,
  'supabase_managed',
  true
FROM profiles p
LEFT JOIN admins a ON p.email = a.email
WHERE p.role IN ('admin', 'superadmin') 
  AND a.email IS NULL;

-- Also ensure their onboarding is marked as completed
UPDATE profiles 
SET onboarding_completed = true 
WHERE role IN ('admin', 'superadmin') 
  AND onboarding_completed = false;