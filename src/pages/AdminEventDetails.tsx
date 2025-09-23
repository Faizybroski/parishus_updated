import React, { useState, useEffect } from "react";
import EventAnalyticsDashboard from "@/components/analytics/EventAnalytics";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRestaurants } from "@/hooks/useRestaurants";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Hourglass,
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

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address: string;
  rsvp_deadline: string;
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

const AdminEventDetails = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const [payments, setPayments] = useState([]);
  const { user } = useAuth();
  const { restaurants } = useRestaurants();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  const [eventReviews, setEventReviews] = useState<any[]>([]);
  const { profile } = useProfile();
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
            last_name,
            profile_photo_url,
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
        window.location.origin + `/event/${event?.id}/details`
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
          <Button onClick={() => navigate("/admin/events")}>
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/events")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>

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
                        Hosted by {event.profiles.first_name}{" "}
                        {event.profiles.last_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={shareEvent}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                    {!isCreator && (
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

            <Card>
              <EventAnalyticsDashboard
                eventId={event.id}
                subscriptionStatus={"premium"}
              />
            </Card>

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
                              <td className="px-4 py-2">{payment.user_name}</td>
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
                              {rsvp.profiles?.first_name || "Unknown"}{" "}
                              {rsvp.profiles?.last_name || "User"}
                            </span>
                            {!isCreator && (
                              <span className="text-xs text-muted-foreground">
                                {rsvp.profiles?.email || "No email"}
                              </span>
                            )}
                          </div>
                        </div>
                        {!isCreator && event.event_fee ? (
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

export default AdminEventDetails;
