import EventAnalyticsDashboard from "@/components/analytics/EventAnalytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";
import { sendEventInvite } from "@/lib/sendInvite";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Edit,
  Heart,
  Loader2,
  MapPin,
  Share2,
  Hourglass,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

interface Event {
  is_paid: boolean;
  id: string;
  name: string;
  description: string;
  date_time: string;
  rsvp_deadline: string;
  location_name: string;
  location_address: string;
  restaurant_id: string | null;
  max_attendees: number;
  dining_style: string;
  dietary_theme: string;
  event_fee: number | null;
  tags: string[];
  cover_photo_url: string;
  creator_id: string;
  status: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    profile_photo_url: string;
    email: string;
    user_id: string;
    username: string;
  };
  restaurants?: {
    name: string;
    city: string;
    country: string;
    full_address: string;
  };
  rsvps?: Array<{
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    profiles?: {
      first_name: string;
      last_name: string;
      profile_photo_url: string;
    };
  }>;
}

const EventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const invitedUser = location.state?.invitedUser || null;
  const [isPaying, setIsPaying] = useState(false);
  const [payments, setPayments] = useState([]);
  const { user } = useAuth();
  const { restaurants } = useRestaurants();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [eventReviews, setEventReviews] = useState<any[]>([]);
  const [showRSVPConfirm, setShowRSVPConfirm] = useState(false);
  const { profile } = useProfile();
  const subscriptionStatus = useSubscriptionStatus(profile?.id);
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    const fetchPayments = async () => {
      const getPaymentsByEventId = async (eventId) => {
        const { data, error } = await supabase
          .from("events_payments")
          .select("*")
          .eq("event_id", eventId);
        if (error) {
          console.error("Error fetching payments:", error.message);
          return [];
        }
        return data;
      };
      const data = await getPaymentsByEventId(event.id);
      setPayments(data);
    };
    if (event?.id) {
      fetchPayments();
    }
  }, [event?.id]);

  useEffect(() => {
    if (!profile || !profile.id || !eventId || !event?.creator_id) return;
    if (!event || !event.creator_id) return;

    if (profile.id === event.creator_id) return;
    supabase
      .rpc("log_event_view", {
        p_event_id: eventId,
        p_user_id: profile.id,
      })
      .then(({ error }) => {
        if (error) {
          console.error("Error logging view:", error);
        } else {
          console.log("View logged successfully");
        }
      });
  }, [profile?.id, profile, eventId, event?.creator_id, event]);

  useEffect(() => {
    const checkInterest = async () => {
      if (!profile || !profile.id || !eventId) return;

      const { data, error } = await supabase
        .from("event_analytics_logs")
        .select("id")
        .eq("event_id", eventId)
        .eq("user_id", profile.id)
        .eq("action", "interest")
        .maybeSingle();

      if (!error && data) {
        setIsInterested(true);
      }
    };

    checkInterest();
  }, [profile, eventId]);

  const handleInterest = async () => {
    if (!profile) {
      toast({ title: "Login required" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.rpc("toggle_event_interest", {
      p_event_id: eventId,
      p_user_id: profile.id,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update interest.",
        variant: "destructive",
      });
    } else {
      setIsInterested((prev) => !prev); // optimistic toggle
    }
  };

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        setUserProfileId(profile?.id || null);
      }
    };

    getUserProfile().then(() => {
      if (eventId) {
        fetchEvent();
        fetchEventReviews();
      }
    });
  }, [eventId, user]);

  const fetchEvent = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
        *,
        profiles:creator_id (
          first_name,
          user_id,
          last_name,
          profile_photo_url,
          username,
          email
        ),
        restaurants:restaurant_id (
          name,
          city,
          country,
          full_address
        ),
        rsvps (
          id,
          user_id,
          status,
          created_at,
          profiles:user_id (
            id,
            first_name,
            user_id,
            last_name,
            profile_photo_url,
            email,
            payments:payments_user_id_fkey (
              id,
              status,
              updated_at
            )
          )
        )
      `
        )
        .eq("id", eventId)
        .single();
      if (error) throw error;
      setEvent(data);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEventReviews = async () => {
    if (!eventId) return;

    try {
      const { data, error } = await supabase
        .from("feedback")
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          profiles:user_id (
            first_name,
            last_name,
            profile_photo_url
          )
        `
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEventReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setEventReviews([]);
    }
  };

  const handlePaidRSVP = async () => {
    if (!eventId || !user?.id) return;
    setIsPaying(true);
    try {
      const { data: response, error } = await supabase.functions.invoke(
        "create-event-payment-intent",
        {
          body: { event_id: eventId, user_id: user.id },
        }
      );

      const parsed =
        typeof response === "string" ? JSON.parse(response) : response;

      if (parsed?.client_secret && parsed?.publishableKey) {
        setIsPaying(false);
        navigate("/payment-checkout", {
          state: {
            clientSecret: parsed.client_secret,
            publishableKey: parsed.publishableKey,
            eventId: eventId,
            userName:
              user?.user_metadata?.full_name ||
              `${profile?.first_name ?? ""} ${
                profile?.last_name ?? ""
              }`.trim() ||
              "Guest User",
            userEmail: user?.email || "unknown@example.com",
          },
        });
      }
    } catch (err) {
      setIsPaying(false);
    }
  };

  //   const handleRSVP = async () => {
  //   if (!user || !userProfileId || !event) return;

  //   const hasRSVP = (event.rsvps || []).some(
  //     (rsvp) => rsvp.user_id === userProfileId
  //   );

  //   const userConfirmed = await new Promise((resolve) => {
  //     toast({
  //       title: hasRSVP ? "Cancel your RSVP?" : "Confirm RSVP?",
  //       description: hasRSVP
  //         ? "Are you sure you want to cancel your RSVP?"
  //         : "Do you want to RSVP to this event?",
  //       action: (
  //         <div className="flex gap-2">
  //           <Button onClick={() => resolve(true)}>Yes</Button>
  //           <Button variant="outline" onClick={() => resolve(false)}>No</Button>
  //         </div>
  //       ),
  //     });
  //   });

  //   if (!userConfirmed) return;

  //   try {
  //     if (hasRSVP) {
  //       const { error } = await supabase
  //         .from("rsvps")
  //         .delete()
  //         .eq("event_id", eventId)
  //         .eq("user_id", userProfileId);
  //       if (error) throw error;

  //       const { error: reservationError } = await supabase
  //         .from("reservations")
  //         .delete()
  //         .eq("event_id", eventId)
  //         .eq("user_id", userProfileId);
  //       if (reservationError) console.log("No reservation found");

  //       const { error: paymentUpdateError } = await supabase
  //         .from("events_payments")
  //         .update({ payment_status: "refunded" })
  //         .eq("event_id", eventId)
  //         .eq("creator_id", profile.user_id);
  //       if (paymentUpdateError) {
  //         console.error(
  //           "Failed to update payment status:",
  //           paymentUpdateError.message
  //         );
  //       }

  //       toast({
  //         title: "RSVP Cancelled",
  //         description: "You're no longer attending this event.",
  //       });
  //     } else {
  //       const { error: rsvpError } = await supabase
  //         .from("rsvps")
  //         .insert({
  //           event_id: eventId,
  //           user_id: userProfileId,
  //           status: "confirmed",
  //         });
  //       if (rsvpError) throw rsvpError;

  //       const { error: reservationError } = await supabase
  //         .from("reservations")
  //         .insert({
  //           event_id: eventId,
  //           user_id: userProfileId,
  //           reservation_type: "standard",
  //           reservation_status: "confirmed",
  //         });
  //       if (reservationError) throw reservationError;

  //       const { data: eventData, error: eventError } = await supabase
  //         .from("events")
  //         .select("location_name")
  //         .eq("id", eventId)
  //         .single();
  //       if (eventError) throw eventError;

  //       const locationName = eventData?.location_name;

  //       const { data: restaurantData, error: restaurantError } = await supabase
  //         .from("restaurants")
  //         .select("*")
  //         .eq("name", locationName)
  //         .single();
  //       if (restaurantError) throw restaurantError;

  //       const {
  //         id: restaurant_id,
  //         name: restaurant_name,
  //         longitude: restaurant_long,
  //         latitude: restaurant_lat,
  //       } = restaurantData;

  //       const { data: visit, error: visitError } = await supabase
  //         .from("restaurant_visits")
  //         .insert({
  //           user_id: user.id,
  //           restaurant_id,
  //           restaurant_name,
  //           latitude: restaurant_long,
  //           longitude: restaurant_lat,
  //           visited_at: new Date().toISOString(),
  //         })
  //         .select()
  //         .single();
  //       if (visitError) throw visitError;

  //       const { data: sameRestaurantVisits } = await supabase
  //         .from("restaurant_visits")
  //         .select("user_id")
  //         .eq("restaurant_id", restaurant_id)
  //         .neq("user_id", userProfileId);

  //       for (const match of sameRestaurantVisits || []) {
  //         const otherUserId = match.user_id;
  //         const userAId =
  //           userProfileId < otherUserId ? userProfileId : otherUserId;
  //         const userBId =
  //           userProfileId < otherUserId ? otherUserId : user.id;

  //         const { data: existingCrossedPath } = await supabase
  //           .from("crossed_paths_log")
  //           .select("*")
  //           .eq("user_a_id", userAId)
  //           .eq("user_b_id", userBId)
  //           .eq("restaurant_id", restaurant_id)
  //           .single();

  //         if (existingCrossedPath) {
  //           await supabase
  //             .from("crossed_paths_log")
  //             .update({
  //               cross_count: existingCrossedPath.cross_count + 1,
  //               updated_at: new Date().toISOString(),
  //             })
  //             .eq("id", existingCrossedPath.id);
  //         } else {
  //           await supabase.from("crossed_paths_log").insert({
  //             user_a_id: userAId,
  //             user_b_id: userBId,
  //             restaurant_id,
  //             restaurant_name,
  //             location_lat: restaurant_long,
  //             location_lng: restaurant_lat,
  //             cross_count: 1,
  //           });

  //           const { data: existingPath } = await supabase
  //             .from("crossed_paths")
  //             .select("*")
  //             .eq("user1_id", userAId)
  //             .eq("user2_id", userBId)
  //             .single();

  //           if (!existingPath) {
  //             await supabase.from("crossed_paths").insert({
  //               user1_id: userAId,
  //               user2_id: userBId,
  //               location_name: restaurant_name,
  //               location_lat: restaurant_long,
  //               location_lng: restaurant_lat,
  //               is_active: true,
  //             });
  //           }
  //         }
  //       }

  //       toast({
  //         title: "RSVP Confirmed!",
  //         description: "You're now attending this event.",
  //       });

  //       navigate("/rsvp-success");
  //     }

  //     fetchEvent(); // Refresh event data after all operations

  //   } catch (error) {
  //     console.error("Error handling RSVP:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to update RSVP",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleRSVP = async () => {
    if (!user || !userProfileId || !event) {
      toast({
        title: "Almost There!",
        description:
          "You’ll need to sign in or sign up before you can RSVP and join this event.",
      });
      navigate("/", { state: { startStep: 1 } });
      return;
    }
    setShowRSVPConfirm(true);
  };

  const confirmRSVP = async () => {
    setShowRSVPConfirm(false); // Hide Modal
    try {
      // --- Send Email via Supabase Edge Function ---
      if (invitedUser?.email) {
        const inviterName = `${profile?.first_name} ${profile?.last_name}`;
        const profileSlug = profile.email.split("@")[0];
        const eventLink = `${window.location.origin}/event/${eventId}/details`;
        const profileLink = `${window.location.origin}/profile/${profileSlug}`;

        await sendEventInvite({
          to: invitedUser.email,
          subject: `${inviterName} invited you to ${event.name}!`,
          text: `Hi ${invitedUser.first_name}`,
          html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border-radius: 12px; background-color: #f9fafb; color: #333; line-height: 1.6;">
      
      <h1 style="color: #111; text-align: center;">🎉 You're Invited!</h1>
      <p style="text-align: center; font-size: 16px; margin-top: -8px;">
        <strong>${inviterName}</strong> has invited you to a special dinner on Parish.
      </p>
      
      <div style="background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: 20px;">
        <h2 style="margin: 0 0 12px; color: #0055ff;">${event.name}</h2>
        
        <p><strong>📅 Date & Time:</strong> ${new Date(
          event.date_time
        ).toLocaleString()}</p>
        <p><strong>📍 Location:</strong> ${event.location_name} <span style="margin: 2px 0; font-size: 14px; color: #d4a373;">
         – ${event.location_address}
      </span></p>
        <p><strong>⏳ RSVP By:</strong> ${new Date(
          event.rsvp_deadline
        ).toLocaleDateString()}</p>
        
        ${
          event.description
            ? `<p style="margin-top: 12px; font-style: italic; color: #555;">"${event.description}"</p>`
            : ""
        }
      </div>
      
      <div style="text-align: center; margin-top: 24px;">
        <a href="${eventLink}" style="display: inline-block; background: #0055ff; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 8px;">View Event & RSVP</a>
        <a href="${profileLink}" style="display: inline-block; background: #f3f4f6; color: #111; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 8px;">View ${inviterName}'s Profile</a>
      </div>
      
      <p style="margin-top: 32px; font-size: 14px; text-align: center; color: #666;">
        Don’t miss out — spots may be limited!<br/>
        We can’t wait to see you there 🍽️
      </p>
    </div>
  `,
        });
      }

      // --- Store Notification in DB ---
      if (invitedUser?.id) {
        await supabase.from("notifications").insert({
          title: "Invited to event",
          user_id: invitedUser.id,
          type: "event_invite",
          message: `${profile?.first_name} invited you to ${event.name}`,
          is_read: false,
        });
      }
      // --- Same Supabase Logic Here --- (No Changes)
      // If hasRSVP => cancel RSVP flow
      // Else => RSVP, Reservations, Crossed Paths etc.
      // ... (Keep it as is)

      const hasRSVP = (event.rsvps || []).some(
        (rsvp) => rsvp.user_id === userProfileId
      );

      if (hasRSVP) {
        const { error } = await supabase
          .from("rsvps")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userProfileId);
        if (error) throw error;

        const { error: reservationError } = await supabase
          .from("reservations")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", userProfileId);
        if (reservationError) console.log("No reservation found");

        const { error: paymentUpdateError } = await supabase
          .from("events_payments")
          .update({ payment_status: "refunded" })
          .eq("event_id", eventId)
          .eq("creator_id", profile.user_id);
        if (paymentUpdateError) {
          console.error(
            "Failed to update payment status:",
            paymentUpdateError.message
          );
        }

        toast({
          title: "RSVP Cancelled",
          description: "You're no longer attending this event.",
        });
      } else {
        if (
          subscriptionStatus === "free" &&
          (!event.event_fee || event.event_fee == 0)
        ) {
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);

          const { count, error } = await supabase
            .from("rsvps")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userProfileId)
            .eq("status", "confirmed") // Optional: if you track cancellations
            .gte("created_at", startOfMonth.toISOString());

          if (error) {
            console.error("Failed to fetch RSVP count", error.message);
            toast({
              title: "Error",
              description: "Couldn't check your RSVP limit. Try again.",
              variant: "destructive",
            });
            return;
          }

          if (count >= 2) {
            toast({
              title: "RSVP Limit Reached",
              description:
                "Free users can RSVP to only 2 free events per month.",
              variant: "destructive",
            });

            // 🔁 Delay navigation for 1.5 seconds to let the toast show
            setTimeout(() => {
              navigate("/subscription");
            }, 1500);

            return;
          }
        }

        const { error: rsvpError } = await supabase.from("rsvps").insert({
          event_id: eventId,
          user_id: userProfileId,
          status: "confirmed",
        });
        if (rsvpError) throw rsvpError;

        const { error: reservationError } = await supabase
          .from("reservations")
          .insert({
            event_id: eventId,
            user_id: userProfileId,
            reservation_type: "standard",
            reservation_status: "confirmed",
          });
        if (reservationError) throw reservationError;

        const { data: eventData, error: eventError } = await supabase
          .from("events")
          .select("location_name")
          .eq("id", eventId)
          .single();
        if (eventError) throw eventError;

        const locationName = eventData?.location_name;

        const { data: restaurantData, error: restaurantError } = await supabase
          .from("restaurants")
          .select("*")
          .eq("name", locationName)
          .single();
        if (restaurantError) throw restaurantError;

        const {
          id: restaurant_id,
          name: restaurant_name,
          longitude: restaurant_long,
          latitude: restaurant_lat,
        } = restaurantData;

        const { data: visit, error: visitError } = await supabase
          .from("restaurant_visits")
          .insert({
            user_id: user.id,
            restaurant_id,
            restaurant_name,
            latitude: restaurant_long,
            longitude: restaurant_lat,
            visited_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (visitError) throw visitError;

        const { data: sameRestaurantVisits } = await supabase
          .from("restaurant_visits")
          .select("user_id")
          .eq("restaurant_id", restaurant_id)
          .neq("user_id", userProfileId);

        for (const match of sameRestaurantVisits || []) {
          const otherUserId = match.user_id;
          const userAId =
            userProfileId < otherUserId ? userProfileId : otherUserId;
          const userBId = userProfileId < otherUserId ? otherUserId : user.id;

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
          title: hasRSVP ? "RSVP Cancelled" : "RSVP Confirmed!",
          description: hasRSVP
            ? "You're no longer attending this event."
            : "You're now attending this event.",
        });

        navigate("/rsvp-success");
        fetchEvent();
      }
    } catch (error) {
      console.error("Error handling RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
    }
  };

  const shareEvent = async () => {
    try {
      await navigator.share({
        title: event?.name,
        text: event?.description,
        url: window.location.origin + `/event/${event?.id}/details`,
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(
        window.location.origin + `/event/${eventId}/details`
      );
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Event Not Found
          </h1>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/events")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const eventDate = new Date(event.date_time);
  const isCreator = event.creator_id === userProfileId;
  const rsvps = event.rsvps || [];
  const hasRSVP = rsvps.some((rsvp) => rsvp.user_id === userProfileId);
  const confirmedRSVPs = rsvps.filter((rsvp) => rsvp.status === "confirmed");
  const spotsLeft = event.max_attendees - confirmedRSVPs.length;
  const isUpcoming = eventDate > new Date();
  const rsvpDeadline = new Date(event.rsvp_deadline);
  rsvpDeadline.setDate(rsvpDeadline.getDate());
  const isBeforeDeadline = now <= rsvpDeadline;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          {isCreator && (
            <Button
              variant="ghost"
              onClick={() => navigate("/events")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          )}
          {!isCreator && (
            <Button
              variant="ghost"
              onClick={() => navigate("/explore")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          )}
          {!isCreator && isBeforeDeadline && (
            <Button
              onClick={handleInterest}
              disabled={loading}
              className={
                isInterested
                  ? "bg-sage-green hover:bg-sage-green/90 mb-4"
                  : "bg-peach-gold hover:bg-peach-gold/90 mb-4"
              }
            >
              {loading
                ? "Updating..."
                : isInterested
                ? "Interested"
                : "Show Interest"}
            </Button>
          )}
        </div>

        {showRSVPConfirm && (
          <Dialog open={showRSVPConfirm} onOpenChange={setShowRSVPConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {hasRSVP ? "Cancel RSVP?" : "Confirm RSVP?"}
                </DialogTitle>
                <DialogDescription>
                  {hasRSVP
                    ? "Are you sure you want to cancel your RSVP?"
                    : "Do you want to RSVP to this event?"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRSVPConfirm(false)}
                >
                  No
                </Button>
                <Button
                  variant={hasRSVP ? "destructive" : "default"}
                  onClick={confirmRSVP}
                >
                  Yes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Event Cover Image */}
        {event.cover_photo_url && (
          <div className="relative w-full flex items-center justify-center bg-black h-64 mb-8 rounded-lg overflow-hidden">
            <img
              src={event.cover_photo_url}
              alt={event.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{event.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={event.profiles.profile_photo_url} />
                        <AvatarFallback>
                          {event.profiles.first_name[0]}
                          {event.profiles.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        Hosted by{" "}
                        <Link to={`/profile/${event.profiles.username}`}>
                          {event.profiles.first_name} {event.profiles.last_name}
                        </Link>
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!event.is_paid && (
                      <Button variant="outline" size="sm" onClick={shareEvent}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    )}

                    {isCreator && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/event/${event.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{event.description}</p>

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {event.event_fee !== null && event.event_fee > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Price</h4>
                    <Badge variant="outline">${event.event_fee}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(eventDate, "EEEE, MMMM d, yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">Date</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(eventDate, "h:mm a")}
                      </p>
                      <p className="text-sm text-muted-foreground">Time</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{event.location_name}</p>
                      {event.restaurants && (
                        <p className="text-sm text-peach-gold">
                          {event.restaurants.name} - {event.restaurants.city},{" "}
                          {event.restaurants.country}
                        </p>
                      )}
                      {event.location_address && (
                        <p className="text-sm text-muted-foreground">
                          {event.location_address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {confirmedRSVPs.length} / {event.max_attendees}{" "}
                        attending
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {spotsLeft > 0
                          ? `${spotsLeft} spots left`
                          : "Event full"}
                      </p>
                    </div>
                  </div>
                </div>

                {event.rsvp_deadline && (
                  <div className="flex items-center space-x-3">
                    <Hourglass className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(
                          new Date(event.rsvp_deadline),
                          "EEEE, MMMM d, yyyy h:mm a"
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        RSVP Deadline
                      </p>
                    </div>
                  </div>
                )}

                {event.dining_style && (
                  <div>
                    <h4 className="font-medium mb-2">Dining Style</h4>
                    <Badge variant="outline">
                      {event.dining_style.replace("_", " ")}
                    </Badge>
                  </div>
                )}

                {event.dietary_theme && (
                  <div>
                    <h4 className="font-medium mb-2">Dietary Theme</h4>
                    <Badge variant="outline">
                      {event.dietary_theme.replace("_", " ")}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {isCreator && (
              <Card>
                <EventAnalyticsDashboard
                  eventId={event.id}
                  subscriptionStatus={subscriptionStatus}
                />
              </Card>
            )}

            {isCreator && (
              <Card>
                <CardHeader>
                  <CardTitle>Payments History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payments?.length > 0 ? (
                    <div className="mt-8">
                      <div className="overflow-x-auto rounded-lg border border-muted">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-muted text-muted-foreground uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2">Name</th>
                              <th className="px-4 py-2">Email</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {payments.map((payment, index) => (
                              <tr key={index} className="border-t border-muted">
                                <td className="px-4 py-2">
                                  {payment.user_name}
                                </td>
                                <td className="px-4 py-2">
                                  {payment.user_email}
                                </td>
                                <td className="px-4 py-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                      payment.payment_status === "paid"
                                        ? "bg-green-100 text-green-800"
                                        : payment.payment_status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : payment.payment_status === "failed"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {payment.payment_status}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  {format(
                                    new Date(payment.created_at),
                                    "MMM d, yyyy"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 text-sm text-muted-foreground italic">
                      No payments recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Reviews Section */}
            {eventReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Reviews ({eventReviews.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Average Rating */}
                    {eventReviews.length > 0 && (
                      <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {(
                              eventReviews.reduce(
                                (sum, review) => sum + review.rating,
                                0
                              ) / eventReviews.length
                            ).toFixed(1)}
                          </div>
                          <div className="flex items-center justify-center mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <=
                                  Math.round(
                                    eventReviews.reduce(
                                      (sum, review) => sum + review.rating,
                                      0
                                    ) / eventReviews.length
                                  )
                                    ? "text-peach-gold fill-current"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            Based on {eventReviews.length} review
                            {eventReviews.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Individual Reviews */}
                    {eventReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="space-y-2">
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={review.profiles?.profile_photo_url}
                            />
                            <AvatarFallback>
                              {review.profiles?.first_name?.[0] || "U"}
                              {review.profiles?.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {review.profiles?.first_name || "Anonymous"}{" "}
                                {review.profiles?.last_name || "User"}
                              </span>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= review.rating
                                        ? "text-peach-gold fill-current"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground">
                                {review.comment}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(review.created_at),
                                "MMM d, yyyy"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {eventReviews.length > 3 && (
                      <p className="text-sm text-muted-foreground text-center">
                        And {eventReviews.length - 3} more review
                        {eventReviews.length - 3 !== 1 ? "s" : ""}...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* RSVP Card */}
            <Card>
              <CardHeader>
                <CardTitle>Join Event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{confirmedRSVPs.length}</p>
                  <p className="text-sm text-muted-foreground">
                    People attending
                  </p>
                </div>

                {isUpcoming && spotsLeft > 0 && !isCreator && (
                  <>
                    {isBeforeDeadline ? (
                      !event.event_fee || event.event_fee == 0 ? (
                        <Button
                          onClick={handleRSVP}
                          className={`w-full ${
                            hasRSVP
                              ? "bg-sage-green hover:bg-sage-green/90"
                              : "bg-peach-gold hover:bg-peach-gold/90"
                          }`}
                        >
                          {hasRSVP ? (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Going - Cancel RSVP
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-2" />
                              RSVP to Event
                            </>
                          )}
                        </Button>
                      ) : hasRSVP ? (
                        <Button
                          onClick={handleRSVP}
                          className={`w-full ${
                            hasRSVP
                              ? "bg-sage-green hover:bg-sage-green/90"
                              : "bg-peach-gold hover:bg-peach-gold/90"
                          }`}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Going - Cancel RSVP
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            if (subscriptionStatus === "free") {
                              toast({
                                title: "Premium Required",
                                description:
                                  "You need a premium subscription to RSVP for paid events.",
                                variant: "destructive",
                              });
                              setTimeout(() => {
                                navigate("/subscription");
                              }, 1200);
                              return;
                            }
                            handlePaidRSVP();
                          }}
                          disabled={isPaying}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                        >
                          {isPaying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay ${event.event_fee} to RSVP
                            </>
                          )}
                        </Button>
                      )
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-gray-400 text-white cursor-not-allowed"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        RSVP Closed
                      </Button>
                    )}
                  </>
                )}

                {isCreator && !hasRSVP && (
                  <div className="text-center mt-2">
                    <Badge variant="outline" className="px-3 py-1">
                      You're the host
                    </Badge>
                  </div>
                )}

                {spotsLeft === 0 && !isCreator && (
                  <div className="text-center">
                    <Badge variant="secondary" className="px-3 py-1">
                      Event Full
                    </Badge>
                  </div>
                )}

                {event.event_fee !== null &&
                  event.event_fee > 0 &&
                  isCreator && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Total Collected
                      </p>
                      <p className="text-xl font-semibold text-peach-gold">
                        ${confirmedRSVPs.length * event.event_fee}
                      </p>
                    </div>
                  )}

                {!isUpcoming && hasRSVP && (
                  <div className="space-y-2">
                    <Badge
                      variant="secondary"
                      className="px-3 py-1 w-full justify-center"
                    >
                      Event Ended
                    </Badge>
                    <Button
                      onClick={() => navigate("/feedback")}
                      className="w-full bg-peach-gold hover:bg-peach-gold/90"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Leave Review
                    </Button>
                  </div>
                )}

                {!isUpcoming && !hasRSVP && (
                  <div className="text-center">
                    <Badge variant="secondary" className="px-3 py-1">
                      Event Ended
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendees */}
            {/* {confirmedRSVPs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendees ({confirmedRSVPs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {confirmedRSVPs.slice(0, 5).map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="flex items-center space-x-3"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rsvp.profiles?.profile_photo_url} />
                          <AvatarFallback>
                            {rsvp.profiles?.first_name?.[0] || "U"}
                            {rsvp.profiles?.last_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {rsvp.profiles?.first_name || "Unknown"}{" "}
                          {rsvp.profiles?.last_name || "User"}
                        </span>
                      </div>
                    ))}
                    {confirmedRSVPs.length > 5 && (
                      <p className="text-sm text-muted-foreground">
                        And {confirmedRSVPs.length - 5} more...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )} */}

            {confirmedRSVPs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attendees ({confirmedRSVPs.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <div className="space-y-3">
                    {confirmedRSVPs.map((rsvp) => (
                      <div
                        key={rsvp.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={rsvp.profiles?.profile_photo_url}
                            />
                            <AvatarFallback>
                              {rsvp.profiles?.first_name?.[0] || "U"}
                              {rsvp.profiles?.last_name?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {rsvp.profiles?.first_name || "Unknown"}{" "}
                              {rsvp.profiles?.last_name || "User"}
                              {rsvp.profiles.payments?.[0]?.status ===
                              "completed" ? (
                                <span className="px-2 py-1 text-xs font-semibold text-black bg-yellow-400 rounded-full ml-2">
                                  🌟 Paid
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold text-white bg-[rgb(0,30,83)] rounded-full ml-2">
                                  {" "}
                                  🆓 Free
                                </span>
                              )}
                            </span>
                            {isCreator && (
                              <span className="text-xs text-muted-foreground">
                                {rsvp.profiles?.email || "No email"}
                              </span>
                            )}
                          </div>
                        </div>
                        {isCreator && event.event_fee ? (
                          <span className="text-sm text-peach-gold font-semibold">
                            ${event.event_fee}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
