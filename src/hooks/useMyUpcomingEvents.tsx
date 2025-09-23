import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';


interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  cover_photo_url?: string;
  tags?: string[];
  max_attendees: number;
  creator_id: string;
  is_mystery_dinner: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
  };
  rsvps?: {
    id: string;
    status: string;
    user_id: string;
  }[];
  rsvp_count?: number;
  user_rsvp?: {
    id: string;
    status: string;
  }[];
}

export const useMyUpcomingEvents = () => {
  const { user } = useAuth();
  const [myUpcomingEvents, setMyUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    const fetchUpcoming = async () => {
      setLoading(true);
      hasFetched.current = true;

      if (!user) {
        setMyUpcomingEvents([]);
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile?.id) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      const { data: events, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          profiles:creator_id (
            first_name,
            last_name,
            profile_photo_url
          ),
          rsvps!inner (
            id,
            status,
            user_id
          )
        `)
        .eq('rsvps.user_id', profile.id)
        .eq('rsvps.status', 'confirmed')
        .gt('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(2);

      if (eventError) {
        console.error('Error fetching upcoming events:', eventError);
        setMyUpcomingEvents([]);
        setLoading(false);
        return;
      }

      const enrichedEvents = (events || []).map(event => ({
        ...event,
        rsvp_count: event.rsvps?.filter(r => r.status === 'confirmed').length || 0,
        user_rsvp: event.rsvps?.filter(r => r.user_id === profile.id) || []
      }));

      setMyUpcomingEvents(enrichedEvents);
      setLoading(false);
    };

    fetchUpcoming();
  }, [user]);

  return { myUpcomingEvents, loading };
};