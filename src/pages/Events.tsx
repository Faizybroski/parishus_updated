import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Plus,
  Heart,
  UserCheck,
  Edit,
  Trash2,
  Eye,
  Share2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  cover_photo_url?: string;
  tags?: string[];
  max_attendees: number;
  creator_id: string;
  is_mystery_dinner: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
  };
  restaurants?: {
    name: string;
    city: string;
    state_province: string;
  };
  rsvps?: {
    id: string;
    status: string;
    user_id: string;
  }[];
  rsvp_count?: number;
  user_rsvp?: {
    id: string;
    status: string;
  }[];
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userProfileId, setUserProfileId] = useState<string | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const getUserProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        setUserProfileId(profile?.id || null);
        return profile?.id || null;
      } else {
        setUserProfileId(null);
        return null;
      }
    };

    getUserProfile().then((profileId) => {
      if (profileId) {
        fetchEvents(profileId);
        fetchMyEvents(profileId);
      }
    });
  }, [user]);

  useEffect(() => {
    if (userProfileId) {
      fetchEvents(userProfileId);
      fetchMyEvents(userProfileId);
    }
  }, [activeTab, userProfileId]);

  // Add effect to refresh events when user navigates back to the page
  useEffect(() => {
    const handleFocus = () => {
      if (userProfileId) {
        fetchEvents(userProfileId);
        fetchMyEvents(userProfileId);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && userProfileId) {
        fetchEvents(userProfileId);
        fetchMyEvents(userProfileId);
      }
    };

    // Add storage event listener for cross-tab communication
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "eventUpdated" && userProfileId) {
        fetchEvents(userProfileId);
        fetchMyEvents(userProfileId);
        // Clear the storage item after handling
        localStorage.removeItem("eventUpdated");
      }
    };

    // Add popstate listener for browser navigation
    const handlePopState = () => {
      if (userProfileId) {
        setTimeout(() => {
          fetchEvents(userProfileId);
          fetchMyEvents(userProfileId);
        }, 100);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [userProfileId]);

  // Add interval-based refresh to ensure data stays current
  useEffect(() => {
    if (!userProfileId) return;

    const refreshInterval = setInterval(() => {
      fetchEvents(userProfileId);
      fetchMyEvents(userProfileId);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [userProfileId]);

  const fetchEvents = async (profileId?: string) => {
    const currentProfileId = profileId || userProfileId;
    if (!currentProfileId) return;

    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          profiles:creator_id (
            first_name,
            last_name,
            profile_photo_url
          ),
          rsvps (
            id,
            status,
            user_id
          ),
          restaurants:restaurant_id (
            name,
            city,
            state_province
          )
        `
        )
        .eq("status", "active")
        .neq("creator_id", currentProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const eventsWithCounts =
        data?.map((event) => ({
          ...event,
          rsvp_count:
            event.rsvps?.filter((r) => r.status === "confirmed").length || 0,
          user_rsvp:
            event.rsvps?.filter((r) => r.user_id === currentProfileId) || [],
        })) || [];

      setEvents(eventsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEvents = async (profileId?: string) => {
    const currentProfileId = profileId || userProfileId;
    if (!user || !currentProfileId) return;

    try {
      console.log(
        "Fetching events created by user:",
        user.id,
        "profile:",
        currentProfileId
      );

      // Fetch events created by the user
      const { data: userEvents, error: userError } = await supabase
        .from("events")
        .select(
          `
          *,
          profiles:creator_id (
            first_name,
            last_name,
            profile_photo_url
          ),
          rsvps (
            id,
            status,
            user_id
          ),
          restaurants:restaurant_id (
            name,
            city,
            state_province
          )
        `
        )
        .eq("creator_id", currentProfileId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (userError) {
        console.error("User events error:", userError);
        throw userError;
      }

      console.log("User events:", userEvents);

      const eventsWithCounts = (userEvents || []).map((event) => ({
        ...event,
        rsvp_count:
          event.rsvps?.filter((r) => r.status === "confirmed").length || 0,
        user_rsvp:
          event.rsvps?.filter((r) => r.user_id === currentProfileId) || [],
      }));

      setMyEvents(eventsWithCounts);
    } catch (error: any) {
      console.error("Error fetching my events:", error);
    }
  };
  const shareEvent = async (
    name: string,
    description: string,
    eventId: string
  ) => {
    try {
      await navigator.share({
        title: name,
        text: description,
        url: window.location.origin + `/event/${eventId}/details`,
      });
    } catch (error) {
      navigator.clipboard.writeText(
        window.location.origin + `/event/${eventId}/details`
      );
      toast({
        title: "Link copied!",
        description: "Event link copied to clipboard",
      });
    }
  };
  const handleRSVP = async (eventId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to RSVP for events",
        variant: "destructive",
      });
      return;
    }

    const event =
      events.find((e) => e.id === eventId) ||
      myEvents.find((e) => e.id === eventId);
    if (!event) return;

    const hasRSVP = event?.user_rsvp && event.user_rsvp.length > 0;

    if (hasRSVP) {
      toast({
        title: "Remove RSVP?",
        description: "Are you sure you want to remove your RSVP?",
        action: (
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  if (!userProfileId) throw new Error("Profile not found");

                  const { error } = await supabase
                    .from("rsvps")
                    .delete()
                    .eq("event_id", eventId)
                    .eq("user_id", userProfileId);

                  if (error) throw error;

                  toast({
                    title: "RSVP removed",
                    description: "You're no longer attending this event",
                  });

                  fetchEvents();
                  fetchMyEvents();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to remove RSVP",
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
    } else {
      toast({
        title: "Confirm RSVP?",
        description: "Are you sure you want to RSVP to this event?",
        action: (
          <div className="flex gap-2">
            <Button
              onClick={async () => {
                try {
                  if (!userProfileId) throw new Error("Profile not found");

                  const { error } = await supabase.from("rsvps").insert({
                    event_id: eventId,
                    user_id: userProfileId,
                    status: "confirmed",
                  });
                  if (error) throw error;

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
                  const { data: restaurantData, error: restaurantError } =
                    await supabase
                      .from("restaurants")
                      .select("*")
                      .eq("name", locationName)
                      .single();
                  if (restaurantError) throw restaurantError;

                  const { id, name, longitude, latitude } = restaurantData;

                  const { data: visit, error: visitError } = await supabase
                    .from("restaurant_visits")
                    .insert({
                      user_id: user.id,
                      restaurant_id: id,
                      restaurant_name: name,
                      latitude: longitude,
                      longitude: latitude,
                      visited_at: new Date().toISOString(),
                    })
                    .select()
                    .single();
                  if (visitError) throw visitError;

                  const { data: sameRestaurantVisits } = await supabase
                    .from("restaurant_visits")
                    .select("user_id")
                    .eq("restaurant_id", id)
                    .neq("user_id", userProfileId);

                  for (const match of sameRestaurantVisits || []) {
                    const otherUserId = match.user_id;
                    const userAId =
                      userProfileId < otherUserId ? userProfileId : otherUserId;
                    const userBId =
                      userProfileId < otherUserId ? otherUserId : user.id;

                    const { data: existingCrossedPath } = await supabase
                      .from("crossed_paths_log")
                      .select("*")
                      .eq("user_a_id", userAId)
                      .eq("user_b_id", userBId)
                      .eq("restaurant_id", id)
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
                        restaurant_id: id,
                        restaurant_name: name,
                        location_lat: longitude,
                        location_lng: latitude,
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
                          location_name: name,
                          location_lat: longitude,
                          location_lng: latitude,
                          is_active: true,
                        });
                      }
                    }
                  }

                  toast({
                    title: "RSVP confirmed!",
                    description: "You're now attending this event",
                  });

                  fetchEvents();
                  fetchMyEvents();
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to add RSVP",
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
                fetchEvents();
                fetchMyEvents();
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

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      event.location_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const EventCards = ({
    events,
    showActions = false,
  }: {
    events: Event[];
    showActions?: boolean;
  }) => {
    if (events.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            {showActions
              ? "You haven't created or joined any events yet"
              : "No events available at the moment"}
          </p>
          <Button
            onClick={() => navigate("/create-event")}
            className="bg-secondary hover:bg-secondary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            {showActions ? "Create Your First Event" : "Create Event"}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const eventDate = new Date(event.date_time);
          const isCreator = event.creator_id === userProfileId;
          const rsvps = event.rsvps || [];
          const hasRSVP = rsvps.some((rsvp) => rsvp.user_id === userProfileId);
          const confirmedRSVPs = rsvps.filter(
            (rsvp) => rsvp.status === "confirmed"
          );
          const spotsLeft = event.max_attendees - confirmedRSVPs.length;
          const isUpcoming = eventDate > new Date();

          return (
            <Card
              key={event.id}
              className="flex flex-col h-full bg-[#0A0A0A] border border-primary rounded-sm overflow-hidden shadow-sm"
            >
              {/* Image with Overlay */}
              <div className="relative w-full flex items-center justify-center bg-black flex-shrink-0 h-48">
                {/* Image or Fallback */}
                <img
                  src={event.cover_photo_url}
                  alt={event.name}
                  className="w-full h-full object-contain"
                />

                {/* Black Overlay */}
                {/* <div className="absolute inset-0 bg-black/70 z-10" /> */}
              </div>

              {/* Footer Section */}
              <CardContent className="flex flex-col flex-grow space-y-3 p-4">
                {/* Text Content */}
                <div className="inset-0 pl-2 flex flex-col justify-end">
                  <h3 className="text-primary text-xl font-bold line-clamp-1">
                    {event.name}
                  </h3>
                  {event.description && (
                    <p className="text-primary/90 text-sm mt-1 line-clamp-1">
                      {event.description}
                    </p>
                  )}
                </div>

                {/* Date & Time */}
                <div className="text-sm flex items-center text-white pl-2 pt-4 pb-1 border-t-2 border-[#1E1E1E]">
                  <Calendar className="h-5 w-5 text-primary/90 mr-3" />
                  <span>
                    {new Date(event.date_time).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {" - "}
                    {new Date(event.date_time).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* RSVP Count */}
                {event.max_attendees && (
                  // <div className="flex text-sm font-medium py-4 pl-2 border-t-2 border-b-2 border-[#1E1E1E] text-white">
                  //   <Users className="h-5 w-5 text-muted-foreground mr-3" />
                  //   {event.rsvp_count || 0}/{event.max_attendees} RSVPed
                  // </div>
                  <div className="text-sm font-medium py-4 px-2 border-t-2 border-b-2 border-[#1E1E1E] text-white">
                    {/* Top content */}
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-primary/90 mr-3" />
                      {event.rsvp_count || 0}/{event.max_attendees} RSVPed
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            ((event.rsvp_count || 0) / event.max_attendees) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {typeof event.is_paid !== "undefined" && (
                  <div className="text-sm font-medium py-2 text-white">
                    {event.is_paid
                      ? `💵 Paid Event – $${event.event_fee}`
                      : "🆓 Free Event"}
                  </div>
                )}
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-primary/90 mr-3" />

                  {/* Location */}
                  <div className="text-sm flex flex-col text-white">
                    <span className="">
                      {event.location_name || "Location not specified"}
                    </span>
                    {event.restaurants && (
                      <span className="text-sm text-gray-400 line-clamp-1">
                        {event.restaurants.name} - {event.restaurants.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Spacer and Button */}
                <div className="flex-grow" />

                <div className="flex space-x-2">
                  {/* Details Button */}
                  <Button
                    onClick={() => navigate(`/event/${event.id}/details`)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-black rounded-sm"
                  >
                    See details
                  </Button>

                  {/* Edit Button (only for creators) */}
                  {isCreator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/event/${event.id}/edit`)}
                      className="text-white border-[#1E1E1E]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Delete Button (only for creators) */}
                  {isCreator && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteEvent && deleteEvent(event.id)}
                      className="text-red-500 hover:text-red-600 border-[#1E1E1E]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {!event.is_paid && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        shareEvent(event.name, event.description, event.id)
                      }
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  )}

                  {/* RSVP Button (for all events with available spots) */}
                  {/* {spotsLeft > 0 && !isCreator && (
            <Button
              onClick={() => handleRSVP(event.id)}
              variant={hasRSVP ? "default" : "outline"}
              size="sm"
              className={
                hasRSVP 
                  ? "bg-green-600 hover:bg-green-600/90" 
                  : "text-white border-[#1E1E1E]"
              }
            >
              {hasRSVP ? (
                <UserCheck className="h-4 w-4" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </Button>
          )} */}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-peach-gold border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Events</h1>
              <p className="text-muted-foreground mt-1">
                Manage your created events
              </p>
            </div>
            <Button
              onClick={() => navigate("/create-event")}
              className="bg-secondary hover:bg-secondary/90 mt-4 sm:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search my events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <EventCards
              events={myEvents.filter(
                (event) =>
                  event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  event.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  event.location_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
              )}
              showActions
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
