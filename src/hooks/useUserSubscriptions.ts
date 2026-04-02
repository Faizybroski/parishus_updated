import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("payments")
        .select(
          `
          id,
          user_id,
          status,
          plan,
          amount,
          subscription_start,
          subscription_end,
          profiles (
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .order("updated_at", { ascending: false });

      if (profile.role === "user") {
        query = query.eq("user_id", profile.id);
      }

      const { data, error } = await query;

      if (!error) setSubscriptions(data || []);
      setLoading(false);
    };

    fetchSubscriptions();
  }, []);

  return { subscriptions, loading };
};
