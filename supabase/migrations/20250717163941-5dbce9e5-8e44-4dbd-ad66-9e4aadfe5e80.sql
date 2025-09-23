-- Seed admin accounts
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'superadmin@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Super", "last_name": "Admin"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Admin", "last_name": "User"}',
  false,
  'authenticated'
);

-- Seed sample users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'user1@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "John", "last_name": "Doe"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'user2@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Jane", "last_name": "Smith"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'user3@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Mike", "last_name": "Johnson"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'user4@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Sarah", "last_name": "Wilson"}',
  false,
  'authenticated'
),
(
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'user5@gmail.com',
  crypt('123123123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "David", "last_name": "Brown"}',
  false,
  'authenticated'
);

-- Create admin entries
INSERT INTO public.admins (email, password_hash, first_name, last_name, role)
SELECT 
  email,
  encrypted_password,
  raw_user_meta_data->>'first_name',
  raw_user_meta_data->>'last_name',
  CASE 
    WHEN email = 'superadmin@gmail.com' THEN 'super_admin'::admin_role
    ELSE 'moderator'::admin_role
  END
FROM auth.users 
WHERE email IN ('superadmin@gmail.com', 'admin@gmail.com');

-- Create profiles for all users
INSERT INTO public.profiles (user_id, email, first_name, last_name, onboarding_completed, dining_style, dietary_preferences, gender_identity, job_title, location_city)
SELECT 
  id,
  email,
  raw_user_meta_data->>'first_name',
  raw_user_meta_data->>'last_name',
  true,
  CASE 
    WHEN email = 'user1@gmail.com' THEN 'foodie_enthusiast'::dining_style
    WHEN email = 'user2@gmail.com' THEN 'health_conscious'::dining_style
    WHEN email = 'user3@gmail.com' THEN 'adventurous'::dining_style
    WHEN email = 'user4@gmail.com' THEN 'social_butterfly'::dining_style
    ELSE 'local_lover'::dining_style
  END,
  CASE 
    WHEN email = 'user1@gmail.com' THEN ARRAY['vegetarian']::dietary_preference[]
    WHEN email = 'user2@gmail.com' THEN ARRAY['vegan', 'gluten_free']::dietary_preference[]
    WHEN email = 'user3@gmail.com' THEN ARRAY['no_restrictions']::dietary_preference[]
    WHEN email = 'user4@gmail.com' THEN ARRAY['dairy_free']::dietary_preference[]
    ELSE ARRAY['no_restrictions']::dietary_preference[]
  END,
  CASE 
    WHEN email IN ('user1@gmail.com', 'user3@gmail.com', 'user5@gmail.com') THEN 'male'::gender_identity
    ELSE 'female'::gender_identity
  END,
  CASE 
    WHEN email = 'user1@gmail.com' THEN 'Software Engineer'
    WHEN email = 'user2@gmail.com' THEN 'Marketing Manager'
    WHEN email = 'user3@gmail.com' THEN 'Graphic Designer'
    WHEN email = 'user4@gmail.com' THEN 'Product Manager'
    WHEN email = 'user5@gmail.com' THEN 'Data Analyst'
    WHEN email = 'admin@gmail.com' THEN 'Admin'
    ELSE 'Super Admin'
  END,
  CASE 
    WHEN email = 'user1@gmail.com' THEN 'Brooklyn, NY'
    WHEN email = 'user2@gmail.com' THEN 'Manhattan, NY'
    WHEN email = 'user3@gmail.com' THEN 'Queens, NY'
    WHEN email = 'user4@gmail.com' THEN 'Brooklyn, NY'
    ELSE 'Manhattan, NY'
  END
FROM auth.users;

-- Create sample events
INSERT INTO public.events (name, description, date_time, location_name, location_address, creator_id, dining_style, dietary_theme, max_attendees)
SELECT 
  'Supper Club Social',
  'Join us for an elegant evening of fine dining and great conversation. Perfect for meeting new people who share your passion for excellent food.',
  (CURRENT_DATE + INTERVAL '7 days' + TIME '19:00:00')::timestamptz,
  'The Garden Cafe',
  '123 Garden Street, Brooklyn, NY 11201',
  p.id,
  'foodie_enthusiast'::dining_style,
  'no_restrictions'::dietary_preference,
  12
FROM public.profiles p 
WHERE p.email = 'admin@gmail.com'
LIMIT 1;

INSERT INTO public.events (name, description, date_time, location_name, location_address, creator_id, dining_style, dietary_theme, max_attendees)
SELECT 
  'Vegan Networking Dinner',
  'A plant-based dining experience for professionals looking to network while enjoying delicious vegan cuisine.',
  (CURRENT_DATE + INTERVAL '8 days' + TIME '18:30:00')::timestamptz,
  'Green Table NYC',
  '456 Eco Avenue, Manhattan, NY 10001',
  p.id,
  'health_conscious'::dining_style,
  'vegan'::dietary_preference,
  8
FROM public.profiles p 
WHERE p.email = 'user1@gmail.com'
LIMIT 1;

-- Create sample RSVPs
INSERT INTO public.rsvps (event_id, user_id, status)
SELECT 
  e.id,
  p.id,
  'confirmed'
FROM public.events e
CROSS JOIN public.profiles p
WHERE e.name = 'Supper Club Social' 
AND p.email IN ('user1@gmail.com', 'user2@gmail.com', 'user3@gmail.com')
LIMIT 3;

INSERT INTO public.rsvps (event_id, user_id, status)
SELECT 
  e.id,
  p.id,
  'confirmed'
FROM public.events e
CROSS JOIN public.profiles p
WHERE e.name = 'Vegan Networking Dinner' 
AND p.email IN ('user2@gmail.com', 'user4@gmail.com')
LIMIT 2;

-- Create sample crossed paths
INSERT INTO public.crossed_paths (user1_id, user2_id, location_name, location_lat, location_lng)
SELECT 
  p1.id,
  p2.id,
  'Central Park',
  40.785091,
  -73.968285
FROM public.profiles p1
CROSS JOIN public.profiles p2
WHERE p1.email = 'user1@gmail.com' AND p2.email = 'user2@gmail.com'
LIMIT 1;

INSERT INTO public.crossed_paths (user1_id, user2_id, location_name, location_lat, location_lng)
SELECT 
  p1.id,
  p2.id,
  'Brooklyn Bridge',
  40.706086,
  -73.996864
FROM public.profiles p1
CROSS JOIN public.profiles p2
WHERE p1.email = 'user3@gmail.com' AND p2.email = 'user4@gmail.com'
LIMIT 1;