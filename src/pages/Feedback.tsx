import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, Calendar, MapPin } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

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
  const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData>({
    event_id: '',
    rating: 0,
    comment: '',
    flagged_users: []
  });
  const [existingFeedback, setExistingFeedback] = useState<FeedbackData | null>(null);
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
        .from('rsvps')
        .select(`
          event_id,
          events!inner (
            id,
            name,
            date_time,
            location_name,
            cover_photo_url
          )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'confirmed')
        .lt('events.date_time', new Date().toISOString());

      if (error) {
        console.error('Error fetching attended events:', error);
        setAttendedEvents([]);
        return;
      }

      const events = data?.map((rsvp: any) => rsvp.events).filter(Boolean) || [];
      setAttendedEvents(events);
    } catch (error: any) {
      console.error('Error in fetchAttendedEvents:', error);
      setAttendedEvents([]);
      toast({
        title: "Error",
        description: "Failed to load attended events",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingFeedback = async (eventId: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setExistingFeedback(data);
        setFeedback({
          id: data.id,
          event_id: eventId,
          rating: data.rating || 0,
          comment: data.comment || '',
          flagged_users: data.flagged_users || []
        });
      } else {
        setExistingFeedback(null);
        setFeedback({
          event_id: eventId,
          rating: 0,
          comment: '',
          flagged_users: []
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load existing feedback",
        variant: "destructive"
      });
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    fetchExistingFeedback(event.id);
  };

  const handleStarClick = (rating: number) => {
    setFeedback(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !selectedEvent || feedback.rating === 0) return;

    setSubmitting(true);

    try {
      if (existingFeedback) {
        // Update existing feedback
        const { error } = await supabase
          .from('feedback')
          .update({
            rating: feedback.rating.trim(),
            comment: feedback.comment.trim(),
            flagged_users: feedback.flagged_users.trim()
          })
          .eq('id', existingFeedback.id);

        if (error) throw error;

        toast({
          title: "Feedback updated!",
          description: "Your feedback has been updated successfully.",
        });
      } else {
        // Create new feedback
        const { error } = await supabase
          .from('feedback')
          .insert({
            event_id: selectedEvent.id,
            user_id: profile.id,
            rating: feedback.rating,
            comment: feedback.comment,
            flagged_users: feedback.flagged_users
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
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Event Feedback</h1>
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
                  <span>Feedback for: {selectedEvent.name}</span>
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
                          className={`p-1 transition-colors ${
                            star <= feedback.rating
                              ? 'text-peach-gold'
                              : 'text-muted-foreground hover:text-peach-gold/70'
                          }`}
                        >
                          <Star className={`h-8 w-8 ${star <= feedback.rating ? 'fill-current' : ''}`} />
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
                      onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value}))}
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
                      className="bg-peach-gold hover:bg-peach-gold/90 text-background"
                    >
                      {submitting ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {attendedEvents.length === 0 ? (
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
                  {attendedEvents.map((event) => (
                    <Card key={event.id} className="shadow-card border-border hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEventSelect(event)}>
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
                            <h3 className="text-lg font-semibold text-foreground">
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
                            <Badge variant="secondary" className="mt-2">
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