import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import type {
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement,
} from "@stripe/stripe-js";

function CheckoutForm({
  plan,
  planId,
  userName,
  userEmail,
  clientSecret,
}: {
  plan: any;
  planId: string;
  userName: string;
  userEmail: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
      const [postalCode, setPostalCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || loading) return;

      const cardNumberElement = elements.getElement(CardNumberElement);
  const cardExpiryElement = elements.getElement(CardExpiryElement);
  const cardCvcElement = elements.getElement(CardCvcElement);
  
  if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
    toast({ title: "Please fill in all card details" });
    setLoading(false);
    return;
  }

    setLoading(true);

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardNumberElement,
        billing_details: {
          name: userName,
          email: userEmail,
    address: { postal_code: postalCode },
        },
      },
    });

    if (result.error) {
      toast({
        title: "Card Error",
        description: result.error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const setupIntent = result.setupIntent;

    const { error: subscriptionError } = await supabase.functions.invoke(
      "create-subscription",
      {
        body: {
          plan_id: planId,
          setup_intent_id: setupIntent.id,
        },
      }
    );

    if (subscriptionError) {
      toast({
        title: "Subscription Failed",
        description: subscriptionError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Success",
      description: "Your subscription is now active!",
    });

    setLoading(false);
    navigate("/subscription");
  };

  return (
    
<form onSubmit={handleSubmit} className="space-y-6">
  <div>
    <label className="block text-sm mb-2">Card Number</label>
    <div className="p-3 bg-white rounded-md text-black">
      <CardNumberElement />
    </div>
  </div>

  <div className="grid grid-cols-2 gap-4">
    <div>
      <label className="block text-sm mb-2">Expiry Date</label>
      <div className="p-3 bg-white rounded-md text-black">
        <CardExpiryElement />
      </div>
    </div>
    <div>
      <label className="block text-sm mb-2">CVC</label>
      <div className="p-3 bg-white rounded-md text-black">
        <CardCvcElement />
      </div>
    </div>
  </div>

  <div>
    <label className="block text-sm mb-2">Postal Code</label>
    <input
      type="text"
      value={postalCode}
      onChange={(e) => setPostalCode(e.target.value.trim())}
      className="w-full px-3 py-2 rounded-md bg-white text-black"
      required
    />
  </div>

  <Button
    type="submit"
    disabled={!stripe || loading}
    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
  >
    {loading ? "Processing..." : "Pay Now"}
  </Button>
</form>
  );
}

export default function UserCheckout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { publishableKey, clientSecret, plan, planId, userName, userEmail } =
    location.state || {};

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  useEffect(() => {
    if (!publishableKey || !clientSecret || !plan || !planId || !userEmail) {
      navigate("/subscription");
    } else {
      setStripePromise(loadStripe(publishableKey));
    }
  }, [publishableKey, clientSecret, plan, planId, userEmail]);

  if (!stripePromise) {
    return <div className="text-center py-20">Loading checkout...</div>;
  }

  return (
 <div className="min-h-screen bg-[#121212] text-white px-4 py-10 flex flex-col items-center">
  <div className="w-full max-w-2xl space-y-6">

    <Card className="bg-[#1e1e1e] text-white border-none shadow-lg">          
      <CardHeader>
            <CardTitle>User Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Full Name</label>
              <input
                type="text"
                readOnly
                value={userName}
                className="w-full p-2 border rounded bg-muted text-foreground"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email Address</label>
              <input
                type="email"
                readOnly
                value={userEmail}
                className="w-full p-2 border rounded bg-muted text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-lg font-semibold">{plan.name}</div>
            <div className="text-2xl font-bold">
              ${plan.price} / {plan.interval}
            </div>
            <p className="text-muted-foreground">{plan.description}</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>Unlimited event creation</li>
              <li>Premium access</li>
              <li>Advanced matching</li>
              <li>Priority support</li>
            </ul>
          </CardContent>
        </Card>
 <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-lg border border-neutral-800">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm
        plan={plan}
        planId={planId}
        userName={userName}
        userEmail={userEmail}
        clientSecret={clientSecret}
      />
    </Elements>
    </div>
      </div>
    </div>

  );
}
