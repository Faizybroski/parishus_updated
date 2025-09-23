// hooks/useSubscriptionStatus.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSubscriptionStatus = (userId: string | undefined) => {
  const [status, setStatus] = useState<'free' | 'premium' | 'loading'>('loading');

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId) return setStatus('free');
      const { data, error } = await supabase
        .from('payments')
        .select('status, subscription_end')
        .eq('user_id', userId)
        .order('subscription_end', { ascending: false })
        .limit(1)
        .single();

      if (
        error ||
        !data ||
        data.status !== 'completed' ||
        (data.subscription_end && new Date(data.subscription_end) < new Date())
      ) {
        setStatus('free');
      } else {
        setStatus('premium');
      }
    };

    fetchSubscription();
  }, [userId]);

  return status;
};
