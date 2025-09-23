import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import axios from "axios";
import { randomUUID } from "crypto";

export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type PlanInsert = Database["public"]["Tables"]["plans"]["Insert"];
export type PlanUpdate = Database["public"]["Tables"]["plans"]["Update"];

export const usePlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    fetchPlans();
  }, []);
  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPlans(data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };
  const createPlan = async (
    plan: Omit<PlanInsert, "creator_id" | "stripe_price_id">
  ) => {
    if (!user || !profile) {
      return { data: null, error: new Error("Unauthorized") };
    }

    try {
      const { data: profileCheck, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profile.id)
        .single();

      if (profileError || !profileCheck) {
        throw new Error("Profile not found");
      }
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke(
      "stripe-plans-management",
      {
        body: {
          name: plan.name,
          description: plan.description,
          price: parseFloat(plan.price),
          interval: plan.interval,
          creator_id:profile.id,
        },
      }
    );

    if (functionError || !functionResponse || !functionResponse.stripe_price_id) {
      throw new Error(functionError?.message || "Stripe function error");
    }
      localStorage.setItem("planUpdated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("planUpdated"));
      await fetchPlans();
      return { error: null };
    } catch (error) {
      return { data: null, error };
    }
  };
  const getPlanById = async (id: string) => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .single();

    return { data, error };
  };

  const updatePlan = async (id: string, updates: PlanUpdate) => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .update({ ...updates, created_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      localStorage.setItem("planUpdated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("planUpdated"));
      await fetchPlans();

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
      localStorage.setItem("planUpdated", Date.now().toString());
      window.dispatchEvent(new CustomEvent("planUpdated"));
      await fetchPlans();
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const canEdit = () => {
    if (!profile) return false;
    return profile.role === "admin";
  };

  const canDelete = () => {
    if (!profile) return false;
    return profile.role === "admin";
  };

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    refetch: fetchPlans,
    canEdit,
    getPlanById,
    canDelete,
  };
};
