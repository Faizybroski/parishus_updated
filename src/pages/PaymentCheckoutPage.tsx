import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Elements,
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { CreditCard, Calendar, Lock, MapPin, Loader2 } from "lucide-react";
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

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  name: string;
  date_time: string;
  location_name: string;
}

export default function PaymentCheckoutPage() {
  const location = useLocation();
  const [event, setEvent] = useState<Event | null>(null);
  const { clientSecret, publishableKey, eventId, userName, userEmail } =
    location.state || {};
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    if (eventId) {
      fetchEventDetails(eventId);
    }
  }, [eventId]);

  const fetchEventDetails = async (id: string) => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
    if (!error) setEvent(data);
  };

  useEffect(() => {
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey));
    }
  }, [publishableKey]);

  if (!clientSecret || !stripePromise)
    return <div className="text-white text-center mt-10">Loading...</div>;

  return (
    // <div className="min-h-screen bg-[#121212] text-white px-4 py-10">
    //   <h1 className="text-3xl font-bold text-center mb-10">Secure Payment</h1>
    //   <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    //     <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-lg col-span-1">
    //       <Elements stripe={stripePromise} options={{ clientSecret }}>
    //         <CheckoutForm
    //           userName={userName}
    //           userEmail={userEmail}
    //           clientSecret={clientSecret}
    //           eventId={eventId}
    //         />
    //       </Elements>
    //     </div>
    //     {event && (
    //       <Card>
    //         <CardHeader>
    //           <CardTitle>Event Info</CardTitle>
    //         </CardHeader>
    //         <CardContent className="space-y-3">
    //           <div className="text-lg font-semibold">{event.name}</div>
    //           <div className="text-sm text-muted-foreground">
    //             {event.date_time} – {event.location_name}
    //           </div>
    //           <p className="text-muted-foreground">{event.description}</p>
    //         </CardContent>
    //       </Card>
    //     )}
    //     <Card>
    //       <CardHeader>
    //         <CardTitle>User Info</CardTitle>
    //       </CardHeader>
    //       <CardContent className="space-y-3">
    //         <div className="text-lg font-semibold">
    //           <strong>Name:</strong> {userName}
    //         </div>
    //         <div className="text-sm text-muted-foreground">
    //           <strong>Email:</strong> {userEmail}
    //         </div>
    //       </CardContent>
    //     </Card>
    //   </div>
    // </div>

 <div className="min-h-screen bg-[#121212] text-white px-4 py-10 flex flex-col items-center">
  <div className="w-full max-w-2xl space-y-6">

    {/* User Info Card */}
    <Card className="bg-[#1e1e1e] text-white border-none shadow-lg">
      <CardHeader>
        <CardTitle>👤 User Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-lg font-semibold">
          <strong>Name:</strong> {userName}
        </div>
        <div className="text-muted-foreground">
          <strong>Email:</strong> {userEmail}
        </div>
      </CardContent>
    </Card>

    {/* Event Info Card */}
    {event && (
      <Card className="bg-[#1e1e1e] text-white border-none shadow-lg">
        <CardHeader>
          <CardTitle>🎉 Event Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="text-lg font-semibold">{event.name}</div>
          <div className="text-muted-foreground">
            {event.date_time} – {event.location_name}
          </div>
          <p className="text-muted-foreground">{event.description}</p>
        </CardContent>
      </Card>
    )}

    {/* Payment Form */}
    <div className="bg-[#1e1e1e] p-6 rounded-2xl shadow-lg border border-neutral-800">
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm
          userName={userName}
          userEmail={userEmail}
          clientSecret={clientSecret}
          eventId={eventId}
        />
      </Elements>
    </div>

  </div>
</div>

  );
}

function CheckoutForm({ userName, userEmail, clientSecret, eventId }) {
  const stripe = useStripe();
  const elements = useElements();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
    const [postalCode, setPostalCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) return;
    setLoading(true);

    // const cardNumberElement = elements.getElement(CardNumberElement) as StripeCardNumberElement | null;

    // if (!cardNumberElement) {
    //   setLoading(false);
    //   toast({ title: "Please enter card details" });
    //   return;
    // }

    // const result = await stripe.confirmCardPayment(clientSecret, {
    //   payment_method: {
    //     card: cardNumberElement,
    //     billing_details: {
    //       name: userName,
    //       email: userEmail,   
    //                 address: {
    //         postal_code: postalCode,
    //       },
    //     },
    //   },
    // });

    const cardNumberElement = elements.getElement(CardNumberElement);
const cardExpiryElement = elements.getElement(CardExpiryElement);
const cardCvcElement = elements.getElement(CardCvcElement);

if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
  toast({ title: "Please fill in all card details" });
  setLoading(false);
  return;
}

const { paymentMethod, error } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardNumberElement,  
  billing_details: {
    name: userName,
    email: userEmail,
    address: { postal_code: postalCode },
  },
});

if (error) {
  toast({ title: error.message });
  setLoading(false);
  return;
}

const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: paymentMethod.id,
});

    if (result?.paymentIntent?.status === "succeeded") {
      const userId = profile.user_id;

      const { data: response, error } = await supabase.functions.invoke(
        "payment-complete",
        {
          body: {
            eventId,
            userId,
            userName,
            userEmail,
            paymentIntentId: result.paymentIntent.id,
            paymentStatus: result.paymentIntent.status,
          },
        }
      );

      if (!error && response?.success === true) {
        await supabase.from("rsvps").insert({
          event_id: eventId,
          user_id: profile.id,
          status: "confirmed",
        });

        await supabase.from("reservations").insert({
          event_id: eventId,
          user_id: profile.id,
          reservation_type: "standard",
          reservation_status: "confirmed",
        });

        const { data: eventData } = await supabase
          .from("events")
          .select("location_name")
          .eq("id", eventId)
          .single();

        const locationName = eventData?.location_name;

        const { data: restaurantData } = await supabase
          .from("restaurants")
          .select("*")
          .eq("name", locationName)
          .single();

        const {
          id: restaurant_id,
          name: restaurant_name,
          longitude: restaurant_long,
          latitude: restaurant_lat,
        } = restaurantData;

        const { data: visit } = await supabase
          .from("restaurant_visits")
          .insert({
            user_id: profile.id,
            restaurant_id,
            restaurant_name,
            latitude: restaurant_long,
            longitude: restaurant_lat,
            visited_at: new Date().toISOString(),
          })
          .select()
          .single();

        const { data: sameRestaurantVisits } = await supabase
          .from("restaurant_visits")
          .select("user_id")
          .eq("restaurant_id", restaurant_id)
          .neq("user_id", profile.id);

        for (const match of sameRestaurantVisits || []) {
          const otherUserId = match.user_id;
          const userAId = profile.id < otherUserId ? profile.id : otherUserId;
          const userBId = profile.id < otherUserId ? otherUserId : profile.id;

          const { data: existingCrossedPath } = await supabase
            .from("crossed_paths_log")
            .select("*")
            .eq("user_a_id", userAId)
            .eq("user_b_id", userBId)
            .eq("restaurant_id", restaurant_id)
            .single();

          if (existingCrossedPath) {
            await supabase
              .from("crossed_paths_log")
              .update({
                cross_count: existingCrossedPath.cross_count + 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingCrossedPath.id);
          } else {
            await supabase.from("crossed_paths_log").insert({
              user_a_id: userAId,
              user_b_id: userBId,
              restaurant_id,
              restaurant_name,
              location_lat: restaurant_long,
              location_lng: restaurant_lat,
              cross_count: 1,
            });

            const { data: existingPath } = await supabase
              .from("crossed_paths")
              .select("*")
              .eq("user1_id", userAId)
              .eq("user2_id", userBId)
              .single();

            if (!existingPath) {
              await supabase.from("crossed_paths").insert({
                user1_id: userAId,
                user2_id: userBId,
                location_name: restaurant_name,
                location_lat: restaurant_long,
                location_lng: restaurant_lat,
                is_active: true,
              });
            }
          }
        }

        toast({
          title: "RSVP Confirmed!",
          description: "You're now attending this event.",
        });

        navigate("/rsvp-success");
      } else {
        console.error("Payment was successful but backend failed:", error || response);
        alert("Payment done, but something went wrong on our end.");
      }
    }

    setLoading(false);
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
      className="w-full p-3 rounded-md bg-white text-black"
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
