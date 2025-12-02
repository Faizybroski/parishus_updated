import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, CreditCard, Loader2 } from "lucide-react";
import { LoaderText } from "@/components/loader/Loader";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  Heart,
  UserCheck,
  Edit,
  Share2,
  Star,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useProfile } from "@/hooks/useProfile";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import bcrypt from "bcryptjs";

interface Event {
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
  is_password_protected: boolean;
  password_hash: string;
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

const RSVPDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const { user } = useAuth();
  const { restaurants } = useRestaurants();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const { profile } = useProfile();
  const [isRSVPLoading, setIsRSVPLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const subscriptionStatus = useSubscriptionStatus(profile?.id);
  const [password, setPassword] = useState("");

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
          rsvps (
            id,
            user_id,
            status,
            created_at,
            profiles:user_id (
              first_name,
              last_name,
              profile_photo_url,
              email
            )
          )
        `
        )
        .eq("id", eventId)
        .single();
      if (error) throw error;
      setEvent(data);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaidRSVP = async () => {
    if (!eventId || !user?.id) return;
    setIsPaying(true);
    try {
      if (event.is_password_protected) {
        // const correctPassword = await bcrypt.compare(
        //   password.trim(),
        //   event.password_hash
        // );

        // if (!correctPassword) {
        //   toast({
        //     title: "Incorrect Password",
        //     description:
        //       "The Password you entered for RSVP this event is incorrect",
        //     variant: "destructive",
        //   });
        //   return;
        // }
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
              date: event.date_time,
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
              date: event.date_time,
            },
          });
        }
      }
    } catch (err) {
      setIsPaying(false);
    }
  };

  const handleRSVP = async () => {
    if (!user || !userProfileId || !event) return;

    const hasRSVP = (event.rsvps || []).some(
      (rsvp) => rsvp.user_id === userProfileId
    );

    toast({
      title: hasRSVP ? "Cancel your RSVP?" : "Confirm RSVP?",
      description: hasRSVP
        ? "Are you sure you want to cancel your RSVP?"
        : "Do you want to RSVP to this event?",
      action: (
        <div className="flex gap-2">
          <Button
            variant={hasRSVP ? "destructive" : "default"}
            onClick={async () => {
              try {
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
                      .eq("status", "confirmed") // optional if you're tracking status
                      .gte("created_at", startOfMonth.toISOString());

                    if (error) {
                      console.error(
                        "Failed to fetch RSVP count",
                        error.message
                      );
                      toast({
                        title: "Error",
                        description:
                          "Couldn't check your RSVP limit. Try again.",
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

                      // 🔁 Delay navigation to subscription page
                      setTimeout(() => {
                        navigate("/subscription");
                      }, 1500);

                      return;
                    }
                  }

                  if (event.is_password_protected) {
                    // const correctPassword = await bcrypt.compare(
                    //   password.trim(),
                    //   event.password_hash
                    // );

                    // if (!correctPassword) {
                    //   toast({
                    //     title: "Incorrect Password",
                    //     description:
                    //       "The Password you entered for RSVP this event is incorrect",
                    //     variant: "destructive",
                    //   });
                    //   return;
                    // }
                    const { error: rsvpError } = await supabase
                      .from("rsvps")
                      .insert({
                        event_id: eventId,
                        user_id: userProfileId,
                        status: "confirmed",
                        date: event.date_time,
                      });
                    if (rsvpError) throw rsvpError;

                    const { error: reservationError } = await supabase
                      .from("reservations")
                      .insert({
                        event_id: eventId,
                        user_id: userProfileId,
                        reservation_type: "standard",
                        reservation_status: "confirmed",
                        date: event.date_time,
                      });
                    if (reservationError) throw reservationError;

                    const { data: eventData, error: eventError } =
                      await supabase
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
                        userProfileId < otherUserId
                          ? userProfileId
                          : otherUserId;
                      const userBId =
                        userProfileId < otherUserId ? otherUserId : user.id;

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
                    return;
                  } else {
                    const { error: rsvpError } = await supabase
                      .from("rsvps")
                      .insert({
                        event_id: eventId,
                        user_id: userProfileId,
                        status: "confirmed",
                        date: event.date_time,
                      });
                    if (rsvpError) throw rsvpError;

                    const { error: reservationError } = await supabase
                      .from("reservations")
                      .insert({
                        event_id: eventId,
                        user_id: userProfileId,
                        reservation_type: "standard",
                        reservation_status: "confirmed",
                        date: event.date_time,
                      });
                    if (reservationError) throw reservationError;

                    const { data: eventData, error: eventError } =
                      await supabase
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
                        userProfileId < otherUserId
                          ? userProfileId
                          : otherUserId;
                      const userBId =
                        userProfileId < otherUserId ? otherUserId : user.id;

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
                  }
                }

                fetchEvent();
              } catch (error) {
                console.error("Error handling RSVP:", error);
                toast({
                  title: "Error",
                  description: "Failed to update RSVP",
                  variant: "destructive",
                });
              }
            }}
          >
            Yes
          </Button>
          <Button variant="outline">No</Button>
        </div>
      ),
    });
  };

  useEffect(() => {
    if (!event?.date_time) return;
    const targetDate = new Date(event.date_time);
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({
          days: "00",
          hours: "00",
          minutes: "00",
          seconds: "00",
        });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(seconds).padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [event?.date_time]);

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
          <Link to="/events">
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
  const isCreator = event.creator_id === userProfileId;
  const rsvps = event.rsvps || [];
  const hasRSVP = rsvps.some((rsvp) => rsvp.user_id === userProfileId);
  const confirmedRSVPs = rsvps.filter((rsvp) => rsvp.status === "confirmed");
  const spotsLeft = event.max_attendees - confirmedRSVPs.length;
  const isUpcoming = eventDate > new Date();
  const rsvpDeadline = new Date(event.rsvp_deadline);
  rsvpDeadline.setDate(rsvpDeadline.getDate());
  const isBeforeDeadline = now <= rsvpDeadline;
  const isPastEvent = eventDate < now;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md bg-secondary p-6 rounded-3xl shadow-lg space-y-6 relative">
        <Link to="/">
          <Button
            variant="ghost"
            className="absolute top-4 left-4 text-muted-foreground hover:bg-transparent text-lg hover:text-[#c4b0a2]"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </Link>
        <div className="text-center mt-6">
          {isPastEvent && (
            <>
              <h3 className="text-xl font-semibold text-muted-foreground">
                This event is ended
              </h3>
              <h2 className="text-xl font-semibold text-[#c4b0a2] font-script">
                {event.name}
              </h2>
            </>
          )}
          {!isPastEvent && isBeforeDeadline && (
            <h2 className="text-xl font-semibold">
              RSVP for <span className="text-[#c4b0a2]">{event.name}</span> till{" "}
              <span className="text-[#c4b0a2]">
                {format(rsvpDeadline, "eeee")}
              </span>
              !
            </h2>
          )}
          {!isPastEvent && !isBeforeDeadline && (
            <h2 className="text-xl font-semibold text-[#c4b0a2]">
              {event.name}
            </h2>
          )}
        </div>
        <div className="flex justify-center gap-4 text-center text-muted-foreground font-bold text-3xl">
          <div>
            <div className="text-[#c4b0a2]">{timeLeft.days}</div>
            <span className="text-sm font-normal text-muted-foreground">
              days
            </span>
          </div>
          <div>:</div>
          <div>
            <div className="text-[#c4b0a2]">{timeLeft.hours}</div>
            <span className="text-sm font-normal text-muted-foreground">
              hours
            </span>
          </div>
          <div>:</div>
          <div>
            <div className="text-[#c4b0a2]">{timeLeft.minutes}</div>
            <span className="text-sm font-normal text-muted-foreground">
              minutes
            </span>
          </div>
          <div>:</div>
          <div>
            <div className="text-[#c4b0a2]">{timeLeft.seconds}</div>
            <span className="text-sm font-normal text-muted-foreground">
              seconds
            </span>
          </div>
        </div>
        {!isPastEvent && (
          <p className="text-center text-sm text-gray-300">
            RSVP Deadline: {format(rsvpDeadline, "eeee hh:mm a")}
          </p>
        )}
        <div className="bg-[#c4b0a2] p-4 rounded-xl">
          {isPastEvent && (
            <p className="text-center text-sm font-semibold mb-3">
              <span className="text-muted">
                {confirmedRSVPs.length} attended this event
              </span>
            </p>
          )}
          {!isPastEvent && (
            <p className="text-center text-sm font-semibold mb-3">
              Only{" "}
              <span className="text-yellow-200">
                {spotsLeft} more spot(s) left
              </span>
            </p>
          )}
          <div className="flex justify-center items-center gap-2">
            <div className="flex -space-x-3">
              {confirmedRSVPs.slice(0, 3).map((rsvp, i) => (
                <img
                  key={rsvp.id}
                  className="w-9 h-9 rounded-full border-2 border-white"
                  src={
                    rsvp.profiles?.profile_photo_url ||
                    "https://i.pravatar.cc/40"
                  }
                  alt={`user${i}`}
                />
              ))}
            </div>
            <Users className=" w-5 h-5 ml-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex justify-between items-center text-center px-2 text-sm">
          <div className="flex flex-col items-center gap-1">
            <Calendar className="w-5 h-5 text-[#c4b0a2]" />
            <span>{format(eventDate, "MMM d")}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <MapPin className="w-5 h-5 text-[#c4b0a2]" />
            <span>{event.location_name}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-[#c4b0a2]" />
            <span>{format(eventDate, "h:mm a")}</span>
          </div>
        </div>

        {isUpcoming &&
          spotsLeft > 0 &&
          !isCreator &&
          !event.is_password_protected && (
            <>
              {isBeforeDeadline ? (
                !event.event_fee || event.event_fee == 0 ? (
                  <Button
                    onClick={handleRSVP}
                    className={`w-full ${hasRSVP ? "" : ""}`}
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
                        ? "bg-primary hover:bg-secondary"
                        : "bg-seconday hover:bg-primary/90"
                    }`}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Going - Cancel RSVP
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (!event.explore) {
                        if (subscriptionStatus === "free") {
                          toast({
                            title: "Premium Required",
                            description:
                              "You need a premium subscription to RSVP private paid events.",
                            variant: "destructive",
                          });
                          setTimeout(() => {
                            navigate("/subscription");
                          }, 1200);
                          return;
                        }
                      }
                      handlePaidRSVP();
                    }}
                    disabled={isPaying}
                    className="w-full bg-primary hover:bg-secondary text-muted-foreground flex items-center justify-center"
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
                  className="w-full bg-gray-400 text-muted-foreground cursor-not-allowed"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  RSVP Closed
                </Button>
              )}
            </>
          )}

        {isUpcoming &&
          spotsLeft > 0 &&
          !isCreator &&
          event.is_password_protected && (
            <>
              {isBeforeDeadline ? (
                // If event is FREE
                !event.event_fee || event.event_fee == 0 ? (
                  hasRSVP ? (
                    <Button onClick={handleRSVP} className="w-full">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Going - Cancel RSVP
                    </Button>
                  ) : (
                    <>
                      {/* ✅ Show password input if event is protected */}
                      {event.is_password_protected && (
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password to RSVP"
                          className="w-full mb-2"
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
                          handleRSVP();
                        }}
                        className="w-full"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        RSVP to Event
                      </Button>
                    </>
                  )
                ) : // If event is PAID
                hasRSVP ? (
                  <Button onClick={handleRSVP} className="w-full">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Going - Cancel RSVP
                  </Button>
                ) : (
                  <>
                    {/* ✅ Add password field for paid + protected events */}
                    {event.is_password_protected && (
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password to RSVP"
                        className="w-full mb-2"
                      />
                    )}

                    <Button
                      onClick={async () => {
                        if (event.explore) {
                          if (subscriptionStatus === "free") {
                            toast({
                              title: "Premium Required",
                              description:
                                "You need a premium subscription to RSVP private paid events.",
                              variant: "destructive",
                            });
                            setTimeout(() => {
                              navigate("/subscription");
                            }, 1200);
                            return;
                          }
                        }

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

                        handlePaidRSVP();
                      }}
                      disabled={isPaying}
                      className="w-full text-white flex items-center justify-center"
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
                  </>
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
      </div>
    </div>
  );
};

export default RSVPDetails;
