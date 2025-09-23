import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Check,
  X,
  HelpCircle,
  AlertTriangle,
  ArrowLeft,
  Share2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Event {
  is_paid: boolean;
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address: string;
  max_attendees: number;
  status: string;
  rsvp_deadline: string;
  cover_photo_url: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface UserRSVP {
  id: string;
  response_status: string;
  created_at: string;
}

const EventRSVP = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [event, setEvent] = useState<Event | null>(null);
  const [userRsvp, setUserRsvp] = useState<UserRSVP | null>(null);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventId && user) {
      fetchEvent();
    }
  }, [eventId, user]);

  const fetchEvent = async () => {
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select(
          `
          *,
          profiles!events_creator_id_fkey(first_name, last_name, email)
        `
        )
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;

      // Check if user has existing RSVP - need to get profile ID first
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user?.id)
        .single();

      if (profileError) throw profileError;

      const { data: rsvpData, error: rsvpError } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", profile.id)
        .single();

      if (rsvpError && rsvpError.code !== "PGRST116") {
        console.error("Error fetching RSVP:", rsvpError);
      }

      // Get confirmed RSVPs count
      const { data: confirmedRsvps, error: countError } = await supabase
        .from("rsvps")
        .select("id")
        .eq("event_id", eventId)
        .eq("response_status", "yes");

      if (countError) throw countError;

      setEvent(eventData);
      setUserRsvp(rsvpData);
      setConfirmedCount(confirmedRsvps?.length || 0);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({ title: "Error loading event", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const shareEvent = async (name: string, description: string, eventId: string) => {
    try {
      await navigator.share({
        title: name,
        text: description,
        url: window.location.origin + `/event/${eventId}/details`,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.origin + `/event/${eventId}/details`);
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };
  const handleRSVP = async (response: "yes" | "no" | "maybe") => {
    if (!user || !eventId) return;

    // Add confirmation for all responses
    const confirmed = window.confirm(
      `Are you sure you want to RSVP "${response}" to this event?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      if (userRsvp) {
        // Update existing RSVP
        const { error } = await supabase
          .from("rsvps")
          .update({ response_status: response })
          .eq("id", userRsvp.id);

        if (error) throw error;

        toast({ title: `RSVP updated to "${response}"` });
      } else {
        // Create new RSVP directly
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError;

        const { error } = await supabase.from("rsvps").insert({
          event_id: eventId,
          user_id: profile.id,
          response_status: response,
        });

        if (error) throw error;

        toast({ title: `RSVP submitted: "${response}"` });
      }

      // Refresh data
      await fetchEvent();
    } catch (error) {
      console.error("Error submitting RSVP:", error);
      toast({ title: "Error submitting RSVP", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            Event Not Found
          </h1>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isEventPast = new Date(event.date_time) < new Date();
  const isRSVPDeadlinePassed =
    event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date();
  const isEventFull = confirmedCount >= event.max_attendees;
  const canRSVP =
    !isEventPast && !isRSVPDeadlinePassed && event.status === "active";

  const getResponseColor = (response: string) => {
    switch (response) {
      case "yes":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "no":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "maybe":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        {/* Event Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {event.cover_photo_url && (
              <img
                src={event.cover_photo_url}
                alt={event.name}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}

            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold text-foreground">
                  {event.name}
                </h1>
                <Badge
                  className={
                    event.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {event.status}
                </Badge>
              </div>

              <p className="text-lg text-muted-foreground">
                {event.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {format(
                          new Date(event.date_time),
                          "EEEE, MMMM d, yyyy"
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.date_time), "h:mm a")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{event.location_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location_address}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        {confirmedCount}/{event.max_attendees} confirmed
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {Math.max(0, event.max_attendees - confirmedCount)}{" "}
                        spots remaining
                      </p>
                    </div>
                  </div>

                  {event.rsvp_deadline && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">RSVP Deadline</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.rsvp_deadline), "PPP p")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Hosted by {event.profiles.first_name}{" "}
                  {event.profiles.last_name}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>RSVP to this Event</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current RSVP Status */}
            {userRsvp && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Your current RSVP:
                </p>
                <Badge className={getResponseColor(userRsvp.response_status)}>
                  {userRsvp.response_status || "pending"}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Submitted on {format(new Date(userRsvp.created_at), "PPP p")}
                </p>
              </div>
            )}

            {/* Warning Messages */}
            {isEventPast && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  This event has already passed. RSVPs are no longer accepted.
                </p>
              </div>
            )}

            {isRSVPDeadlinePassed && !isEventPast && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                  The RSVP deadline has passed. New RSVPs are no longer
                  accepted.
                </p>
              </div>
            )}

            {isEventFull && canRSVP && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-orange-800 dark:text-orange-200 text-sm">
                  This event is currently full. You can still RSVP "Maybe" to be
                  added to the waitlist.
                </p>
              </div>
            )}

            {event.status === "cancelled" && (
              <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  This event has been cancelled. RSVPs are no longer accepted.
                </p>
              </div>
            )}
            {!event.is_paid && (
              <Button
              variant="outline"
              size="sm"
              onClick={() => shareEvent(event.name, event.description, event.id)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
            )}
            {/* RSVP Buttons */}
            {/* {canRSVP && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleRSVP('yes')}
                  disabled={submitting || (isEventFull && userRsvp?.response_status !== 'yes')}
                  className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  <span>Yes, I'll attend</span>
                </Button>
                
                <Button
                  onClick={() => handleRSVP('maybe')}
                  disabled={submitting}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Maybe</span>
                </Button>
                
                <Button
                  onClick={() => handleRSVP('no')}
                  disabled={submitting}
                  variant="outline"
                  className="flex items-center justify-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Can't attend</span>
                </Button>
              </div>
            )} */}

            {userRsvp && canRSVP && (
              <p className="text-sm text-muted-foreground text-center">
                You can change your RSVP response until the deadline.
              </p>
            )}

            {!canRSVP && !userRsvp && (
              <p className="text-center text-muted-foreground">
                RSVPs are not currently being accepted for this event.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventRSVP;
