-- Drop existing policies for reservations
DROP POLICY IF EXISTS "Users can create their own reservations" ON public.reservations;

-- Create new policy that properly handles the profile relationship
CREATE POLICY "Users can create their own reservations" 
ON public.reservations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = reservations.user_id 
    AND profiles.user_id = auth.uid()
  )
);