-- Manually confirm the unconfirmed admin user
UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmed_at = NOW(),
  updated_at = NOW()
WHERE email = 'globalsmtp20254@gmail.com' AND email_confirmed_at IS NULL;