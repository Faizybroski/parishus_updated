import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

interface SubscriptionData {
  subscribed: boolean;
  plan?: string;
  subscription_end?: string;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  interval: string;
  stripe_price_id: string;
}

export default function Subscription() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      checkSubscriptionStatus();
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .order("price");
    if (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "Failed to load plans.",
        variant: "destructive",
      });
    } else {
      setPlans(data);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "check-subscription"
      );
      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan_id: string) => {
    setCheckoutLoading(plan_id);

    try {
      const selectedPlan = plans.find((p) => p.stripe_price_id === plan_id);
      if (!selectedPlan) throw new Error("Plan not found");

      const { data, error } = await supabase.functions.invoke(
        "create-setup-intent",
        {
          body: { plan_id },
        }
      );

      if (error || !data.client_secret) {
        throw new Error("Failed to initiate checkout");
      }

      navigate("/user-checkout", {
        state: {
          clientSecret: data.client_secret,
          publishableKey: data.publishableKey,
          planId: plan_id,
          plan: selectedPlan,
          userName:
            user?.user_metadata?.full_name ||
            `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
            "Guest User",
          userEmail: user?.email || "unknown@example.com",
        },
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate checkout",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    navigate("/manage-subscriptions");
  };

  const features = [
    "Unlimited event creation",
    "Premium event access",
    "Advanced matching algorithm",
    "Priority customer support",
    "Exclusive member events",
    "Enhanced profile visibility",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-64"></div>
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-96 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground">
            Unlock premium features and enhance your dining experience
          </p>
        </div>

        {subscription?.subscribed && (
          <Card className="mb-8 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Current Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {subscription.plan?.toUpperCase()} PLAN
                  </Badge>
                  {subscription.subscription_end && (
                    <p className="text-sm text-muted-foreground">
                      Renews on{" "}
                      {new Date(
                        subscription.subscription_end
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <Button onClick={handleManageSubscription} variant="outline">
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative ${index === 1 ? "border-primary" : ""}`}
            >
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Zap className="h-3 w-3 mr-1" />
                    Best Value
                  </Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full mb-6"
                  onClick={() => handleSubscribe(plan.stripe_price_id)}
                  disabled={!!checkoutLoading || subscription?.subscribed}
                >
                  {checkoutLoading === plan.stripe_price_id
                    ? "Loading..."
                    : subscription?.subscribed
                    ? "Current Plan"
                    : "Get Started"}
                </Button>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={checkSubscriptionStatus}>
            Refresh Subscription Status
          </Button>
        </div>
      </div>
    </div>
  );
}
