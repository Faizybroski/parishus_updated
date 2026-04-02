import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export const useProfile = () => {
  // const [profile, setProfile] = useState<Profile | null>(null);
  const [profile, setProfile] = useState(null);
  const lastFetchedUserId = useRef<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // useEffect(() => {
  //   // if (user) {
  //   // if (user && !profileLoaded) {
  //   //   fetchProfile();
  //   // } else {
  //   //   setProfile(null);
  //   //   setLoading(false);
  //   // }
  //   if (!user || lastFetchedUserId.current === user.id) return;
  //   lastFetchedUserId.current = user.id;
  //   fetchProfile();
  // }, [user]);
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      lastFetchedUserId.current = null;
      return;
    }

    if (lastFetchedUserId.current === user.id) return;

    lastFetchedUserId.current = user.id;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
  };
};
