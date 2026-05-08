import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: "2023-08-16"
});
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // const authHeader = req.headers.get("Authorization");
    // const token = authHeader?.replace("Bearer ", "");
    // if (!token) throw new Error("No auth token provided");
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    const { user_id } = await req.json();
    const {data: user, error: userError} = await supabaseClient.from('profiles').select("email").eq("user_id", user_id).single();
    if (userError || !user?.email) throw userError || new Error("User not authenticated");
    const { data: profile, error: profileError } = await supabaseClient.from("profiles").select("id").eq("email", user.email).single();
    if (profileError) throw profileError;
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });
    if (customers.data.length === 0) {
      const pendingData = {
        user_id: profile.user_id,
        status: "pending",
        plan: null,
        amount: null,
        updated_at: new Date().toISOString()
      };
      await supabaseClient.from("payments").insert(pendingData);
      return new Response(JSON.stringify({
        subscribed: false
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      });
    }
    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: [
        "data.default_payment_method"
      ]
    });
    const activeSubscription = subscriptions.data.find((sub)=>sub.status === "active" || sub.status === "trialing");
    const hasActiveSub = Boolean(activeSubscription);
    const subscriptionId = activeSubscription?.id || null;
    const subscriptionTier = activeSubscription?.items?.data?.[0]?.price?.recurring?.interval === "year" ? "yearly" : activeSubscription?.items?.data?.[0]?.price?.recurring?.interval === "month" ? "monthly" : null;
    const subscriptionStart = activeSubscription?.current_period_start ? new Date(activeSubscription.current_period_start * 1000).toISOString() : null;
    const subscriptionEnd = activeSubscription?.current_period_end ? new Date(activeSubscription.current_period_end * 1000).toISOString() : null;
    const subscriptionPrice = activeSubscription?.items?.data?.[0]?.price?.unit_amount || null;
    const { data: existingPayment, error: selectError } = await supabaseClient.from("payments").select("id").eq("user_id", profile.id).single();
    if (selectError && selectError.code !== "PGRST116") throw selectError;
    const paymentData = {
      user_id: profile.id,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
      status: hasActiveSub ? "completed" : "pending",
      plan: subscriptionTier,
      amount: (subscriptionPrice / 100).toFixed(2),
      subscription_start: subscriptionStart,
      subscription_end: subscriptionEnd,
      updated_at: new Date().toISOString()
    };
    let dbResponse;
    if (existingPayment) {
      dbResponse = await supabaseClient.from("payments").update(paymentData).eq("user_id", profile.id);
    } else {
      dbResponse = await supabaseClient.from("payments").insert(paymentData);
    }
    if (dbResponse.error) throw dbResponse.error;
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      plan: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Subscription check failed",
      message: err.message || err.toString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 500
    });
  }
});
