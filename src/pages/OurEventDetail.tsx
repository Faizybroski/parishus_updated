import React, { useEffect, useRef, useState } from "react";
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
import { LoaderText } from "@/components/loader/Loader";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useRestaurants } from "@/hooks/useRestaurants";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { supabase } from "@/integrations/supabase/client";
import { sendEventInvite } from "@/lib/sendInvite";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  CreditCard,
  Upload,
  Edit,
  Heart,
  Trash,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ChevronLeft,
  MapPin,
  Share2,
  Hourglass,
  Star,
  UserCheck,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { TikTokPlayer } from "@/components/tiktok/TikTokPlayer";
import MapContainer from "@/components/map/MapContainer";
import { Input } from "@/components/ui/input";
import bcrypt from "bcryptjs";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  Autoplay,
  Navigation,
  Pagination,
  EffectFade,
  EffectCreative,
} from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

interface Event {
  is_paid: boolean;
  id: string;
  name: string;
  description: string;
  date_time: string;
  rsvp_deadline: string;
  location_name: string;
  location_address: string;
  location_lng: string;
  location_lat: string;
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
  is_password_protected: boolean;
  password_hash: string;
  guest_list: boolean;
  tiktok: boolean;
  tiktok_Link: string;
  imageGallery: boolean;
  imageGalleryLinks: Array<string>;
  features: boolean;
  eventEndDateTime: string;
  recurrence: boolean;
  recurrence_dates: Array<string>;
  event_features: Array<{
    image: string;
    title: string;
    description: string;
    url: string;
    start_date: string;
    start_time: string;
    end_date: string;
    end_time: string;
  }>;
  title_font: string;
  accent_color: string;
  accent_bg: string;
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
      username: string;
    };
  }>;
}

const OurEventDetails = () => {
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
  const [showAllReviews, setShowAllReviews] = useState(false);
  const visibleReviews = showAllReviews
    ? eventReviews
    : eventReviews.slice(0, 3);
  const [showRSVPConfirm, setShowRSVPConfirm] = useState(false);
  const { profile } = useProfile();
  const subscriptionStatus = useSubscriptionStatus(profile?.id);
  const [isInterested, setIsInterested] = useState(false);
  const [password, setPassword] = useState("");
  const [showRecurrenceDialog, setShowRecurrenceDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const prevRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const url = event?.cover_photo_url;
    if (!url) return;

    setIsLoaded(false); // optional: reset when URL changes

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;

    img.onload = () => setIsLoaded(true);
  }, [event?.cover_photo_url]);

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
            username,
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
            username,
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

  const handleCopy = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Copied!",
        description: "Copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Failed",
        description: "Could not copy the page URL.",
        variant: "destructive",
      });
    }
  };

  const handlePaidRSVP = async () => {
    if (!eventId || !user?.id) return;
    setIsPaying(true);
    try {
      if (event.is_password_protected) {
        const correctPassword = await bcrypt.compare(
          password.trim(),
          event.password_hash
        );

        if (!correctPassword) {
          toast({
            title: "Incorrect Password",
            description:
              "The Password you entered for RSVP this event is incorrect",
            variant: "destructive",
          });
          setIsPaying(false);
          return;
        }

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
              date: event.recurrence ? selectedDate : event.date_time,
            },
          });
        }
      } else {
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
              date: event.recurrence ? selectedDate : event.date_time,
            },
          });
        }
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
      setLoadingStatus(true);
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
                <p><strong>📍 Location:</strong> ${
                  event.location_name
                } <span style="margin: 2px 0; font-size: 14px; color: #d4a373;">
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

        if (event.is_password_protected) {
          const correctPassword = await bcrypt.compare(
            password.trim(),
            event.password_hash
          );

          if (!correctPassword) {
            toast({
              title: "Incorrect Password",
              description:
                "The Password you entered for RSVP this event is incorrect",
              variant: "destructive",
            });
            return;
          }

          const { error: rsvpError } = await supabase.from("rsvps").insert({
            event_id: eventId,
            user_id: userProfileId,
            status: "confirmed",
            date: event.recurrence ? selectedDate : event.date_time,
          });
          if (rsvpError) throw rsvpError;

          const { error: reservationError } = await supabase
            .from("reservations")
            .insert({
              event_id: eventId,
              user_id: userProfileId,
              reservation_type: "standard",
              reservation_status: "confirmed",
              date: event.recurrence ? selectedDate : event.date_time,
            });
          if (reservationError) throw reservationError;

          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("location_name")
            .eq("id", eventId)
            .single();
          if (eventError) throw eventError;

          const locationName = eventData?.location_name;

          const { data: restaurantData, error: restaurantError } =
            await supabase
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
          return;
        } else {
          const { error: rsvpError } = await supabase.from("rsvps").insert({
            event_id: eventId,
            user_id: userProfileId,
            status: "confirmed",
            date: event.recurrence ? selectedDate : event.date_time,
          });
          if (rsvpError) throw rsvpError;

          const { error: reservationError } = await supabase
            .from("reservations")
            .insert({
              event_id: eventId,
              user_id: userProfileId,
              reservation_type: "standard",
              reservation_status: "confirmed",
              date: event.recurrence ? selectedDate : event.date_time,
            });
          if (reservationError) throw reservationError;

          const { data: eventData, error: eventError } = await supabase
            .from("events")
            .select("location_name")
            .eq("id", eventId)
            .single();
          if (eventError) throw eventError;

          const locationName = eventData?.location_name;

          const { data: restaurantData, error: restaurantError } =
            await supabase
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
      }
      setLoadingStatus(false);
    } catch (error) {
      console.error("Error handling RSVP:", error);
      toast({
        title: "Error",
        description: "Failed to update RSVP",
        variant: "destructive",
      });
    }
  };

  const deleteEvent = (eventId: string) => {
    toast({
      title: "Are you sure?",
      description: "This will permanently delete your event.",
      action: (
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={async () => {
              const { error } = await supabase
                .from("events")
                .delete()
                .eq("id", eventId)
                .eq("creator_id", userProfileId);

              if (error) {
                toast({
                  title: "Error",
                  description: error.message || "Failed to delete event",
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Event deleted",
                  description: "Your event has been deleted successfully",
                });
                navigate("/events");
              }
            }}
          >
            Yes
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // just dismiss toast
              toast({
                title: "Cancelled",
                description: "Event deletion cancelled.",
              });
            }}
          >
            No
          </Button>
        </div>
      ),
    });
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
      <div className="min-h-screen pt-16 flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground font-script">
            Event Not Found
          </h1>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Link to={"/events"}>
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const eventDate = new Date(event.date_time);
  const eventEndDate = new Date(event.eventEndDateTime);
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
    <div
      className="min-h-screen bg-background relative z-0 pt-16"
      style={
        {
          "--accent-bg": event.accent_bg,
          background: " var(--accent-bg)",
          transition: "background 0.5s ease",
        } as React.CSSProperties
      }
    >
      {event.cover_photo_url && (
        <div
          className={`fixed top-0 left-0 w-full z-[-1] transition-opacity duration-500 ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            height: "45vh",
            backgroundImage: `url(${event.cover_photo_url})`,
            backgroundSize: "cover",
            backgroundPosition: "top",
            backgroundRepeat: "no-repeat",
            zIndex: -1,
            // Remove blur here since we want the background color to blur
          }}
        >
          <div className="absolute inset-0 backdrop-blur-lg"></div>
          <div
            className="absolute bottom-0 w-full"
            style={{
              height: "50vh", // adjust how gradual the fade is
              background: `linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--accent-bg) 100%)`,
            }}
          />
        </div>
      )}
      <div
        className="absolute top-0 left-0 w-full h-full z-[-2]"
        style={{
          background: `var(--accent-bg)`,
          filter: "blur(8px)",
        }}
      />
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row gap-6 p-6">
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
                    style={{
                      backgroundColor: event.accent_color,
                    }}
                  >
                    No
                  </Button>
                  <Button
                    variant={hasRSVP ? "destructive" : "default"}
                    onClick={confirmRSVP}
                    style={{
                      backgroundColor: event.accent_color,
                    }}
                  >
                    Yes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="flex-1 space-y-6 min-w-0 order-first lg:order-none">
            <div className="relative lg:hidden">
              <div className="absolute  lg:hidden left-1 -top-5 z-50">
                {isCreator && (
                  <Link to={"/events"}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-transparent hover:bg-transparent"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {!isCreator && (
                  <Link to={"/explore"}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-transparent hover:bg-transparent"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="block lg:hidden mb-4 flex justify-center">
              <div className="bg-primary rounded-md flex items-center justify-center relative overflow-hidden cursor-pointer group aspect-[4/5] w-full max-w-sm mx-auto">
                <img
                  src={event.cover_photo_url}
                  alt="Event flyer"
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
            </div>
            <Card className="space-y-2 bg-transparent border-none shadow-none">
              <div className="lg:flex hidden">
                {isCreator && (
                  <Link to={"/events"}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-transparent hover:bg-transparent"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                {!isCreator && (
                  <Link to={"/explore"}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-transparent hover:bg-transparent"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
              <div className="border-t border-gray-300 mx-6" />
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-y-1.5 lg:gap-y-2">
                  {/* LEFT SIDE */}
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                      <AvatarImage src={event.profiles.profile_photo_url} />
                      <AvatarFallback className="text-lg sm:text-xl">
                        {event.profiles.first_name[0]}
                        {event.profiles.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    <span className="text-base sm:text-lg md:text-xl font-medium truncate text-black">
                      {!isCreator ? (
                        <Link to={`/profile/${event.profiles.username}`}>
                          {event.profiles.first_name} {event.profiles.last_name}
                        </Link>
                      ) : (
                        <Link to="/profile">
                          {event.profiles.first_name} {event.profiles.last_name}
                        </Link>
                      )}
                    </span>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {!isCreator && isBeforeDeadline && (
                      <Button
                        onClick={handleInterest}
                        disabled={loading}
                        variant="outline"
                        size="icon"
                        className="p-2 bg-transparent hover:bg-transparent border-none transition-colors duration-200"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={`h-5 w-5 transition-all duration-200 ${
                              isInterested
                                ? "fill-red-500 text-red-500"
                                : "fill-transparent text-black"
                            }`}
                          />
                        )}
                      </Button>
                    )}

                    {!event.is_paid && !isCreator && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-transparent text-black hover:bg-transparent border-none"
                        onClick={shareEvent}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    )}

                    {isCreator && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="bg-transparent text-black hover:bg-transparent border-none"
                        onClick={shareEvent}
                      >
                        <Share2 className="h-5 w-5" />
                      </Button>
                    )}

                    {isCreator && (
                      <Link to={`/event/${event.id}/edit`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="bg-transparent text-black hover:bg-transparent border-none"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      </Link>
                    )}

                    {isCreator && (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          deleteEvent(event.id);
                        }}
                        size="icon"
                        className="bg-transparent text-black hover:bg-transparent border-none"
                      >
                        <Trash className="h-5 w-5" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-transparent text-black hover:bg-transparent border-none"
                      onClick={handleCopy}
                    >
                      <Upload className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  style={{ fontFamily: event.title_font }}
                  className="mb-5 leading-tight text-[2.2rem] xsm:text-[2.8rem] sm:text-[2.5rem] md:text-[3rem] lg:text-[3rem] xl:text-[4rem]"
                >
                  {event.name}
                </div>
                <div>
                  <Link
                    to={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${event.location_name}, ${event.location_address}`
                    )}`}
                    className="text-[1.2rem] font-semibold"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {event.location_name}
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[1.1rem] sm:text-[1.2rem] font-semibold leading-snug">
                  <span>
                    {format(eventDate, "EE, MMM d")} at{" "}
                    {format(eventDate, "h:mm a")}
                  </span>
                  {event.eventEndDateTime && (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>
                        {format(eventEndDate, "EE, MMM d")} at{" "}
                        {format(eventEndDate, "h:mm a")}
                      </span>
                    </>
                  )}
                </div>
                {event.event_fee !== null && event.event_fee > 0 && (
                  <div className="flex">
                    <h4 className="font-medium mb-2 mr-2">Price: </h4> ${" "}
                    {event.event_fee}
                  </div>
                )}

                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="bg-transparent backdrop-blur-md bg-white/10 hover:bg-white/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="space-y-2 bg-transparent shadow-none border-none">
              <div className="border-t border-gray-300 mx-6" />
              <CardHeader className="space-y-6">
                <CardTitle>
                  <p className="bg-transparent">{event.description}</p>
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="space-y-2 bg-transparent shadow-none border-none">
              <div className="border-t border-gray-300 mx-6" />
              <CardHeader className="pt-1"></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 " />
                    <div>
                      <p className="font-medium">
                        <Link
                          to={`https://www.google.com/maps?q=${encodeURIComponent(
                            `${event.location_name}, ${event.location_address}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {event.location_name}
                        </Link>
                      </p>

                      {event.location_address && (
                        <p className="text-sm ">
                          <Link
                            to={`https://www.google.com/maps?q=${encodeURIComponent(
                              `${event.location_name}, ${event.location_address}`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {event.location_address}
                          </Link>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 " />
                    <div>
                      <p className="font-medium">
                        {confirmedRSVPs.length} / {event.max_attendees}{" "}
                        attending
                      </p>
                      <p className="text-sm">
                        {spotsLeft > 0
                          ? `${spotsLeft} spots left`
                          : "Event full"}
                      </p>
                    </div>
                  </div>
                </div>

                {event.rsvp_deadline && (
                  <div className="flex items-center space-x-3">
                    <Hourglass className="h-5 w-5" />
                    <div>
                      <p className="font-medium">
                        {format(event.rsvp_deadline, "EE, MMM d")}
                        {" at "}
                        {format(event.rsvp_deadline, "h:mm a")}
                      </p>
                      <p className="text-sm">RSVP Deadline</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {event.dining_style && (
                    <div>
                      <h4 className="font-medium mb-2">Dining Style</h4>
                      <Badge
                        variant="secondary"
                        className="bg-transparent backdrop-blur-md bg-white/10 hover:bg-white/10 cursor-default"
                      >
                        {event.dining_style.replace("_", " ")}
                      </Badge>
                    </div>
                  )}

                  {event.dietary_theme && (
                    <div>
                      <h4 className="font-medium mb-2">Dietary Theme</h4>
                      <Badge
                        variant="secondary"
                        className="bg-transparent backdrop-blur-md bg-white/10 hover:bg-white/10 cursor-default"
                      >
                        {event.dietary_theme.replace("_", " ")}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {event.guest_list && confirmedRSVPs.length > 0 && !isCreator && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader className="space-y-6">
                  <CardTitle>
                    <p className=" bg-transparent">
                      {confirmedRSVPs.length === 1
                        ? `${confirmedRSVPs[0].profiles?.first_name} is going`
                        : `${confirmedRSVPs[0].profiles?.first_name} and ${
                            confirmedRSVPs.length - 1
                          } others are going`}
                    </p>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {confirmedRSVPs.slice(0, 10).map((rsvp) => (
                    <div
                      key={rsvp.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={rsvp.profiles?.profile_photo_url} />
                          <AvatarFallback>
                            {rsvp.profiles?.first_name?.[0] || "U"}
                            {rsvp.profiles?.last_name?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <Link to={`/profile/${rsvp.profiles?.username}`}>
                          {rsvp.profiles?.first_name || "Unknown"}{" "}
                          {rsvp.profiles?.last_name || "User"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {isCreator && event.recurrence && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader>
                  <CardTitle>Recurrence</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {event.recurrence_dates.map((date, i) => {
                    const d = new Date(date);

                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center
                   bg-transparent backdrop-blur-md bg-white/10
                   border border-white/20 rounded-xl
                   py-4 px-5 min-h-[90px]
                   text-center
                   hover:bg-white/20 hover:shadow-lg
                   transition-all duration-200"
                      >
                        <span className="text-sm font-semibold">
                          {format(d, "EEE, MMM d")}
                        </span>
                        <span className="text-xs opacity-80 mt-1">
                          {format(d, "h:mm a")}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card className="space-y-2 bg-transparent shadow-none border-none">
              <div className="border-t border-gray-300 mx-6" />
              <CardHeader className="pt-1"></CardHeader>
              <CardContent>
                <MapContainer
                  lat={Number(event.location_lat)}
                  lng={Number(event.location_lng)}
                  name={event.location_name}
                  add={event.location_address}
                />
              </CardContent>
            </Card>

            {event.features && event.event_features.length > 0 && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader className="pt-1"></CardHeader>
                <CardContent className="space-y-4">
                  <div className="mt-4 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4">
                      {event.event_features.map((feature, i) => {
                        const start =
                          feature.start_date && feature.start_time
                            ? new Date(
                                `${feature.start_date}T${feature.start_time}`
                              )
                            : null;
                        const end =
                          feature.end_date && feature.end_time
                            ? new Date(
                                `${feature.end_date}T${feature.end_time}`
                              )
                            : null;

                        const formatDateTime = (dt: Date) => {
                          const date = dt.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                          });
                          const time = dt
                            .toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })
                            .toLowerCase();
                          return `${date} ${time}`;
                        };

                        return (
                          <Link
                            key={i}
                            to={feature.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className=" group block bg-transparent overflow-hidden"
                          >
                            <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
                              <img
                                src={feature.image || "/placeholder.png"}
                                alt={feature.title || "Feature image"}
                                onError={(e) =>
                                  (e.currentTarget.src = "/placeholder.png")
                                }
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            </div>

                            <div className="pt-4 space-y-2">
                              <h3 className="font-semibold text-lg">
                                {feature.title || "Untitled Feature"}
                              </h3>

                              {feature.description && (
                                <p className="text-sm line-clamp-2">
                                  {feature.description}
                                </p>
                              )}

                              {feature.start_date && feature.start_time && (
                                <div className="text-xs">
                                  <span className="py-1 rounded-md">
                                    {formatDateTime(start!)}
                                    {end ? ` - ${formatDateTime(end)}` : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {event.imageGallery && event.imageGalleryLinks.length > 0 && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader className="pt-1" />
                <CardContent>
                  <div className="relative w-full max-w-sm mx-auto">
                    <Swiper
                      modules={[Navigation, EffectFade, Pagination]}
                      effect="fade"
                      speed={700}
                      fadeEffect={{ crossFade: true }}
                      slidesPerView={1}
                      loop={true}
                      allowTouchMove={false} // disables swipe/drag
                      navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                      }}
                      pagination={{
                        type: "fraction",
                      }}
                      onBeforeInit={(swiper) => {
                        if (typeof swiper.params.navigation !== "boolean") {
                          swiper.params.navigation.prevEl = prevRef.current;
                          swiper.params.navigation.nextEl = nextRef.current;
                        }
                      }}
                      className="w-full"
                    >
                      {event.imageGalleryLinks.map((img, i) => (
                        <SwiperSlide key={i} className="relative w-full h-full">
                          <img
                            src={img}
                            alt={`slide-${i}`}
                            className="w-full h-full object-cover rounded-md transition-opacity duration-700"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>

                    {/* Custom buttons */}
                    <div
                      ref={prevRef}
                      className="absolute top-1/2 left-2 -translate-y-1/2 z-20 cursor-pointer text-black bg-white/20 backdrop-blur-md p-2 lg:p-3 md:p-3 sm:p-3 rounded-full hover:bg-white/30 transition-colors duration-200 flex items-center justify-center shadow-md"
                    >
                      <ArrowLeft className="w-3 h-3 lg:w-5 lg:h-5 md:w-4 md:h-4" />
                    </div>

                    <div
                      ref={nextRef}
                      className="absolute top-1/2 right-2 -translate-y-1/2 z-20 cursor-pointer text-black bg-white/20 backdrop-blur-md p-2 lg:p-3 md:p-3 sm:p-3 rounded-full hover:bg-white/30 transition-colors duration-200 flex items-center justify-center shadow-md"
                    >
                      <ArrowRight className="w-3 h-3 lg:w-5 lg:h-5 md:w-4 md:h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {event.tiktok && event.tiktok_Link && (
              // <Card className="space-y-2 bg-transparent shadow-none border-none">
              //   <div className="border-t border-gray-300 mx-6" />
              //   <CardHeader className="pt-1"></CardHeader>
              //   <CardContent className="space-y-6">
              <TikTokPlayer url={event.tiktok_Link} />
              //   </CardContent>
              // </Card>
            )}

            {eventReviews.length > 0 && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Reviews ({eventReviews.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventReviews.length > 0 && (
                      <div className="py-4 px-7 bg-muted/50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        {/* Rating Box */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold">
                              {(
                                eventReviews.reduce(
                                  (sum, review) => sum + review.rating,
                                  0
                                ) / eventReviews.length
                              ).toFixed(1)}
                            </div>

                            {/* Stars */}
                            <div className="flex items-center justify-center mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <=
                                    Math.round(
                                      eventReviews.reduce(
                                        (s, r) => s + r.rating,
                                        0
                                      ) / eventReviews.length
                                    )
                                      ? "fill-[yellow] text-[yellow]"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Vertical Divider (desktop only) */}
                          {/* <div className="hidden sm:block w-px h-10 bg-gray-300 opacity-40" /> */}
                        </div>

                        {/* Text */}
                        <p className="text-sm text-muted-foreground text-center sm:text-left">
                          Based on {eventReviews.length} review
                          {eventReviews.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    {visibleReviews.map((review) => (
                      <div
                        key={review.id}
                        className="space-y-2 border p-3 rounded-lg"
                      >
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
                                <Link
                                  to={`/profile/${review.profiles.username}`}
                                  className="font-bold"
                                >
                                  {review.profiles.first_name}{" "}
                                  {review.profiles.last_name}
                                </Link>
                              </span>

                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= review.rating
                                        ? "fill-[yellow] text-[yellow]"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>

                            {review.comment && (
                              <p className="text-sm">{review.comment}</p>
                            )}

                            <p className="text-xs">
                              {format(new Date(review.created_at), "d MMM yyy")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {eventReviews.length > 3 && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="text-sm text-muted-foreground underline w-full text-center mt-2"
                      >
                        {showAllReviews
                          ? "Show Less Reviews"
                          : `View All ${eventReviews.length} Reviews`}
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {isCreator && (
              <EventAnalyticsDashboard
                eventId={event.id}
                eventColor={event.accent_color}
                subscriptionStatus={subscriptionStatus}
              />
            )}

            {isCreator && event.event_fee !== null && event.event_fee > 0 && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader>
                  <CardTitle>Payments History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {payments?.length > 0 ? (
                    <div className="mt-8">
                      <div className="overflow-x-auto rounded-lg border border-muted">
                        <table className="min-w-full text-sm text-left">
                          <thead className="bg-muted uppercase tracking-wider">
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
                    <div className="mt-6 text-sm italic">
                      No payments recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* {event.guest_list && confirmedRSVPs.length > 0 && !isCreator && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader>
                  <CardTitle>Attendees ({confirmedRSVPs.length})</CardTitle>
                </CardHeader>
                <CardContent>
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
                              <Link to={`/profile/${rsvp.profiles?.username}`}>
                                {rsvp.profiles?.first_name || "Unknown"}{" "}
                                {rsvp.profiles?.last_name || "User"}
                              </Link>
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
                          <span className="text-sm   font-semibold">
                            ${event.event_fee}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )} */}

            {confirmedRSVPs.length > 0 && isCreator && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader>
                  <CardTitle>Attendees ({confirmedRSVPs.length})</CardTitle>
                </CardHeader>
                <CardContent>
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
                              <Link to={`/profile/${rsvp.profiles?.username}`}>
                                {rsvp.profiles?.first_name || "Unknown"}{" "}
                                {rsvp.profiles?.last_name || "User"}
                              </Link>
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
                          <span className="text-sm   font-semibold">
                            ${event.event_fee}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="space-y-2 bg-transparent shadow-none border-none pb-4 md:pb-8 sm:pb-12">
              <div className="border-t border-gray-300 mx-6" />
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
                      <p className="text-xl font-semibold  ">
                        ${confirmedRSVPs.length * event.event_fee}
                      </p>
                    </div>
                  )}

                {!isUpcoming && hasRSVP && (
                  <div className="space-y-2 flex gap-3 flex-col">
                    <Button
                      variant="secondary"
                      className="bg-transparent backdrop-blur-md bg-white/10 hover:bg-white/10 flex justify-center cursor-default"
                    >
                      Event Ended
                    </Button>
                    <Link to={"/feedback"}>
                      <Button
                        className="w-full"
                        style={{ backgroundColor: event.accent_color }}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Leave Review
                      </Button>
                    </Link>
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
          </div>

          <div className="lg:w-1/3 flex flex-col space-y-4 lg:sticky lg:top-6 lg:self-start order-last lg:order-none hidden lg:flex">
            <div className="aspect-[4/5] w-full ">
              <img
                src={event.cover_photo_url}
                alt="Event flyer"
                className="w-full h-full object-cover rounded-md"
              />
            </div>
          </div>
        </div>

        {isUpcoming &&
          spotsLeft > 0 &&
          !isCreator &&
          !event.is_password_protected && (
            <div className="fixed bottom-4 left-0 right-0 px-4 sm:px-6 md:px-14 lg:px-36 z-50">
              {isBeforeDeadline ? (
                !event.event_fee || event.event_fee == 0 ? (
                  <Button
                    onClick={() => {
                      if (hasRSVP) {
                        handleRSVP();
                      }
                      if (event.recurrence && !hasRSVP) {
                        setShowRecurrenceDialog(true);
                        return;
                      }
                      if (!event.recurrence) {
                        handleRSVP();
                      }
                    }}
                    className={`w-full ${hasRSVP ? "" : ""}`}
                    style={{
                      backgroundColor: event.accent_color,
                    }}
                    disabled={loadingStatus}
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
                    className={`w-full ${hasRSVP ? "" : ""}`}
                    style={{
                      backgroundColor: event.accent_color,
                    }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Going - Cancel RSVP
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      // if (subscriptionStatus === "free") {
                      //   toast({
                      //     title: "Premium Required",
                      //     description:
                      //       "You need a premium subscription to RSVP for paid events.",
                      //     variant: "destructive",
                      //   });
                      //   setTimeout(() => {
                      //     navigate("/subscription");
                      //   }, 1200);
                      //   return;
                      // }

                      if (event.recurrence && !hasRSVP) {
                        setShowRecurrenceDialog(true);
                        return;
                      }
                      if (!event.recurrence) {
                        handlePaidRSVP();
                      }
                    }}
                    disabled={isPaying}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center"
                    style={{
                      backgroundColor: event.accent_color,
                    }}
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
                  style={{
                    backgroundColor: event.accent_color,
                  }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  RSVP Closed
                </Button>
              )}
            </div>
          )}

        {isUpcoming &&
          spotsLeft > 0 &&
          !isCreator &&
          event.is_password_protected && (
            <div className="fixed bottom-4 left-0 right-0 px-4 sm:px-6 md:px-14 lg:px-36 z-50">
              {isBeforeDeadline ? (
                // If event is FREE
                !event.event_fee || event.event_fee == 0 ? (
                  hasRSVP ? (
                    <Button
                      onClick={handleRSVP}
                      className="w-full"
                      style={{ backgroundColor: event.accent_color }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Going - Cancel RSVP
                    </Button>
                  ) : (
                    <div className="flex flex-col lg:flex-row gap-3">
                      {event.is_password_protected && (
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password to RSVP"
                          className="w-[90%] mb-2 bg-transparent backdrop-blur-md bg-white/10"
                        />
                      )}
                      <Button
                        onClick={async () => {
                          if (event.is_password_protected && !password.trim()) {
                            toast({
                              title: "Password Required",
                              description: "Please enter the event password.",
                              variant: "destructive",
                            });
                            return;
                          }
                          const correctPassword = await bcrypt.compare(
                            password.trim(),
                            event.password_hash
                          );
                          if (!correctPassword) {
                            toast({
                              title: "Incorrect Password",
                              description:
                                "The Password you entered for RSVP this event is incorrect",
                              variant: "destructive",
                            });
                            return;
                          }

                          if (event.recurrence && !hasRSVP) {
                            setShowRecurrenceDialog(true);
                            return;
                          }
                          if (!event.recurrence) {
                            handleRSVP();
                          }
                          if (event.recurrence) {
                            setShowRecurrenceDialog(true); // show dialog instead
                            return;
                          }

                          handleRSVP();
                        }}
                        className="flex-1 lg:w-auto text-sm sm:text-base items-center justify-center flex-nowrap"
                        style={{
                          backgroundColor: event.accent_color,
                        }}
                        disabled={loadingStatus}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        RSVP to Event
                      </Button>
                    </div>
                  )
                ) : // If event is PAID
                hasRSVP ? (
                  <Button
                    onClick={handleRSVP}
                    className="w-full"
                    style={{ backgroundColor: event.accent_color }}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Going - Cancel RSVP
                  </Button>
                ) : (
                  <div className="flex flex-col lg:flex-row gap-3">
                    {event.is_password_protected && (
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full mb-2 bg-transparent backdrop-blur-md bg-white/10"
                      />
                    )}

                    <Button
                      onClick={async () => {
                        // if (subscriptionStatus === "free") {
                        //   toast({
                        //     title: "Premium Required",
                        //     description:
                        //       "You need a premium subscription to RSVP for paid events.",
                        //     variant: "destructive",
                        //   });
                        //   setTimeout(() => navigate("/subscription"), 1200);
                        //   return;
                        // }

                        if (event.is_password_protected && !password.trim()) {
                          toast({
                            title: "Password Required",
                            description: "Please enter the event password.",
                            variant: "destructive",
                          });
                          return;
                        }
                        const correctPassword = await bcrypt.compare(
                          password.trim(),
                          event.password_hash
                        );
                        if (!correctPassword) {
                          toast({
                            title: "Incorrect Password",
                            description:
                              "The Password you entered for RSVP this event is incorrect",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (event.recurrence && !hasRSVP) {
                          setShowRecurrenceDialog(true);
                          return;
                        }
                        if (!event.recurrence) {
                          handlePaidRSVP();
                        }

                        if (event.recurrence && !hasRSVP) {
                          setShowRecurrenceDialog(true);
                          return;
                        }
                      }}
                      disabled={isPaying}
                      className="w-full lg:w-auto flex-1"
                      style={{ backgroundColor: event.accent_color }}
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          <span className="">Pay ${event.event_fee}</span>
                        </>
                      )}
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  disabled
                  className="w-full bg-gray-400 text-white cursor-not-allowed"
                  style={{ backgroundColor: event.accent_color }}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  RSVP Closed
                </Button>
              )}
            </div>
          )}
      </div>
      <Dialog
        open={showRecurrenceDialog}
        onOpenChange={setShowRecurrenceDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select a Date</DialogTitle>
            <DialogDescription>
              Choose one of the available recurrence dates. You may also
              unselect.
            </DialogDescription>
          </DialogHeader>

          {/* Selected date preview */}
          {selectedDate && (
            <div className="p-3 rounded-md bg-blue-50 text-blue-700 text-sm font-medium mb-3">
              Selected: {new Date(selectedDate).toLocaleString()}
            </div>
          )}

          <div className="flex flex-col gap-3 mt-2">
            {event.recurrence_dates?.map((date) => {
              const formatted = new Date(date).toLocaleString();
              const isSelected = selectedDate === date;

              return (
                <Button
                  key={date}
                  onClick={() => {
                    // toggle logic
                    if (isSelected) {
                      setSelectedDate(null); // deselect
                      return;
                    }

                    setSelectedDate(date); // select
                  }}
                  className={`w-full ${
                    isSelected
                      ? "ring-2 ring-blue-500 bg-blue-100 text-blue-800"
                      : ""
                  }`}
                  variant={isSelected ? "secondary" : "default"}
                >
                  {formatted}
                </Button>
              );
            })}
          </div>

          {/* Continue/Confirm button */}
          <Button
            disabled={!selectedDate}
            onClick={() => {
              if (!event.event_fee) {
                handleRSVP();
              } else {
                handlePaidRSVP();
              }
              setShowRecurrenceDialog(false);
            }}
            className="mt-4 w-full"
            style={{ backgroundColor: event.accent_color }}
          >
            Confirm RSVP
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OurEventDetails;

{
  /* {event.imageGallery && event.imageGalleryLinks.length > 0 && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader className="pt-1"></CardHeader>
                <CardContent>
                  <div className="my-2 pb-2 w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 px-1">
                      {event.imageGalleryLinks.map((img) => (
                        <div
                          key={img}
                          className="relative aspect-[4/5] rounded-md overflow-hiddenbg-secondary hover:bg-secondary/70 transition-colors"
                        >
                          <img
                            src={img}
                            alt={`image ${img}`}
                            className="absolute rounded-md inset-0 w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )} */
}

{
  /* RSVP Card */
}

{
  /* Attendees */
}
{
  /* {confirmedRSVPs.length > 0 && (
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
            )} */
}

{
  /* {event.recurrence && (
              <Card className="space-y-2 bg-transparent shadow-none border-none">
                <div className="border-t border-gray-300 mx-6" />
                <CardHeader>
                  <CardTitle>Recurrence</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 justify-between">
                  {event.recurrence_dates.map((date, i) => {
                    const d = new Date(date);
                    return (
                      <div
                        key={i}
                        className="bg-transparent backdrop-blur-md bg-white/10 border rounded-xl py-4 px-5  hover:shadow-md transition-all"
                      >
                        <div className="">
                          <span>
                            {format(d, "EE, MMM d")}
                            <br />
                            {format(d, "h:mm a")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )} */
}

{
  /* {isCreator && event.event_fee ? (
                        <span className="text-sm   font-semibold">
                          ${event.event_fee}
                        </span>
                      ) : null} */
}

{
  /* <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            <Link to={`/profile/${rsvp.profiles?.username}`}>
                              {rsvp.profiles?.first_name || "Unknown"}{" "}
                              {rsvp.profiles?.last_name || "User"}
                            </Link>
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
                        </div> */
}

{
  /* <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8"> */
}

{
  /* Header */
}
{
  /* <div className="mb-8 flex justify-between items-center">
          {isCreator && (
            <Link to={"/events"}>
              <Button
                variant="ghost"
                className="mb-4"
                style={{
                  backgroundColor: event.accent_color,
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          )}
          {!isCreator && (
            <Link to={"/explore"}>
              <Button
                variant="ghost"
                className="mb-4"
                style={{
                  backgroundColor: event.accent_color,
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Events
              </Button>
            </Link>
          )} */
}
{
  /* {!isCreator && isBeforeDeadline && (
            <Button
              onClick={handleInterest}
              disabled={loading}
              className={isInterested ? "mb-4" : "mb-4"}
            >
              {loading
                ? "Updating..."
                : isInterested
                ? "Interested"
                : "Show Interest"}
            </Button>
          )} */
}
{
  /* </div> */
}
