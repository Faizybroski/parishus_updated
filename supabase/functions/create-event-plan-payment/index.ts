import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    if (!publishableKey) throw new Error("STRIPE_PUBLISHABLE_KEY is not set");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { event_id, user_id, plan_id } = await req.json();

    if (!event_id || !user_id || !plan_id) {
      throw new Error("event_id, user_id, and plan_id are required");
    }

    // Resolve profile from auth user_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("user_id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Duplicate RSVP guard
    const { data: existingRsvp } = await supabase
      .from("rsvps")
      .select("id")
      .eq("event_id", event_id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingRsvp) {
      throw new Error("You already have an RSVP for this event");
    }

    // Fetch and validate the plan
    const { data: plan, error: planError } = await supabase
      .from("event_plans")
      .select("*")
      .eq("id", plan_id)
      .eq("event_id", event_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      throw new Error("Plan not found or is no longer available");
    }

    // Capacity check
    if (plan.capacity !== null) {
      const { count } = await supabase
        .from("rsvps")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event_id)
        .eq("plan_id", plan_id)
        .eq("status", "confirmed");

      if ((count ?? 0) >= plan.capacity) {
        throw new Error(`The "${plan.title}" plan is sold out`);
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({
      email: profile.email,
      limit: 1,
    });

    const customerId =
      customers.data.length > 0
        ? customers.data[0].id
        : (await stripe.customers.create({ email: profile.email })).id;

    // Create PaymentIntent using the plan price
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100), // cents
      currency: "usd",
      customer: customerId,
      metadata: {
        event_id,
        user_id,
        plan_id,
        profile_id: profile.id,
        plan_title: plan.title,
      },
    });

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        publishableKey,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
