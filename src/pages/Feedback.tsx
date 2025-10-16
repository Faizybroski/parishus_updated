import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LoaderText } from "@/components/loader/Loader";

interface Event {
  id: string;
  name: string;
  date_time: string;
  location_name: string;
  cover_photo_url: string;
}

interface FeedbackData {
  id?: string;
  event_id: string;
  rating: number;
  comment: string;
  flagged_users: string[];
}

const Feedback = () => {
  // const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
  const [dummyEvent, setDummyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({
    event_id: "",
    rating: 0,
    comment: "",
    flagged_users: [],
  });
  const [existingFeedback, setExistingFeedback] = useState<FeedbackData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile) {
      fetchAttendedEvents();
    }
  }, [profile]);

  const fetchAttendedEvents = async () => {
    if (!profile) return;

    try {
      // Get events user has RSVP'd to and that have already happened
      const { data, error } = await supabase
        .from("rsvps")
        .select(
          `
          event_id,
          events!inner (
            id,
            name,
            date_time,
            location_name,
            cover_photo_url
          )
        `
        )
        .eq("user_id", profile.id)
        .eq("status", "confirmed")
        .lt("events.date_time", new Date().toISOString());

      if (error) {
        console.error("Error fetching attended events:", error);
        setAttendedEvents([]);
        return;
      }

      const events =
        data?.map((rsvp: any) => rsvp.events).filter(Boolean) || [];
      // setAttendedEvents(events);

      const attendedEvents = [
        {
          id: 1,
          name: "The Maple Harvest Dinner",
          date_time: "2025-09-30T19:00:00Z",
          location_name: "The Willow Room, Toronto",
          cover_photo_url:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 2,
          name: "Vancouver Tech Meetup",
          date_time: "2025-10-05T17:30:00Z",
          location_name: "Innovation Hub, Vancouver",
          cover_photo_url:
            "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 3,
          name: "Calgary Art & Coffee Night",
          date_time: "2025-09-22T20:00:00Z",
          location_name: "Artisan Café, Calgary",
          cover_photo_url:
            "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 4,
          name: "Ottawa Entrepreneurs Gathering",
          date_time: "2025-10-01T18:00:00Z",
          location_name: "ByWard Market Hall, Ottawa",
          cover_photo_url:
            "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 5,
          name: "Halifax Music & Brunch",
          date_time: "2025-09-28T11:00:00Z",
          location_name: "Seaside Lounge, Halifax",
          cover_photo_url:
            "https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1000&q=80",
        },
      ];
      setDummyEvents(attendedEvents);
    } catch (error: any) {
      console.error("Error in fetchAttendedEvents:", error);
      setAttendedEvents([]);
      toast({
        title: "Error",
        description: "Failed to load attended events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingFeedback = async (eventId: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingFeedback(data);
        setFeedback({
          id: data.id,
          event_id: eventId,
          rating: data.rating || 0,
          comment: data.comment || "",
          flagged_users: data.flagged_users || [],
        });
      } else {
        setExistingFeedback(null);
        setFeedback({
          event_id: eventId,
          rating: 0,
          comment: "",
          flagged_users: [],
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load existing feedback",
        variant: "destructive",
      });
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    fetchExistingFeedback(event.id);
  };

  const handleStarClick = (rating: number) => {
    setFeedback((prev) => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedEvent || feedback.rating === 0) return;

    setSubmitting(true);

    try {
      if (existingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from("feedback")
          .update({
            rating: feedback.rating.trim(),
            comment: feedback.comment.trim(),
            flagged_users: feedback.flagged_users.trim(),
          })
          .eq("id", existingFeedback.id);

        if (error) throw error;

        toast({
          title: "Feedback updated!",
          description: "Your feedback has been updated successfully.",
        });
      } else {
        // Create new feedback
        const { error } = await supabase.from("feedback").insert({
          event_id: selectedEvent.id,
          user_id: profile.id,
          rating: feedback.rating,
          comment: feedback.comment,
          flagged_users: feedback.flagged_users,
        });

        if (error) throw error;

        toast({
          title: "Feedback submitted!",
          description: "Thank you for your feedback.",
        });
      }

      setSelectedEvent(null);
      fetchAttendedEvents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-script">
              Event Feedback
            </h1>
            <p className="text-muted-foreground mt-1">
              Share your experience from attended events
            </p>
          </div>

          {selectedEvent ? (
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ← Back
                  </Button>
                  <span>Feedback for: <span className="font-script">{selectedEvent.name}</span></span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      How would you rate this event? *
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleStarClick(star)}
                          className="p-1 transition-transform duration-200 hover:scale-110"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= feedback.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-none text-muted-foreground hover:text-yellow-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Additional Comments (Optional)
                    </label>
                    <Textarea
                      value={feedback.comment}
                      onChange={(e) =>
                        setFeedback((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      placeholder="Share your thoughts about the event, food, atmosphere, etc."
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedEvent(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={feedback.rating === 0 || submitting}
                      className="text-background"
                    >
                      {submitting
                        ? "Submitting..."
                        : existingFeedback
                        ? "Update Feedback"
                        : "Submit Feedback"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* {attendedEvents.length === 0 ? ( */}
              {dummyEvent.length === 0 ? (
                <Card className="shadow-card border-border">
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No events to review
                    </h3>
                    <p className="text-muted-foreground">
                      Attend some events to share your feedback
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {/* {attendedEvents.map((event) => ( */}
                  {dummyEvent.map((event) => (
                    <Card
                      key={event.id}
                      className="shadow-card border-border hover:shadow-lg transition-shadow cursor-pointer transition-shadow hover:bg-secondary transition-all duration-300"
                      onClick={() => handleEventSelect(event)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {event.cover_photo_url && (
                            <img
                              src={event.cover_photo_url}
                              alt={event.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground font-script">
                              {event.name}
                            </h3>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(event.date_time).toLocaleDateString()}
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location_name}
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className="mt-2 bg-primary"
                            >
                              Click to leave feedback
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feedback;
