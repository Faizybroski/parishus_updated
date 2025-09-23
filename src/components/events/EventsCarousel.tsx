import React, { useState, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Star,
  Share,
  Share2,
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

const EventsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [events, setEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [attendeeCounts, setAttendeeCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [userProfileId, setUserProfileId] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  useEffect(() => {
    let isMounted = true;
    const onPointerDown = () => setIsDragging(true);
    const onPointerUp = () => setIsDragging(false);
    const loadData = async () => {
      const profileId = await getUserProfileId();
      if (isMounted) setUserProfileId(profileId);

      await fetchEvents();

      if (user) await fetchUserRSVPs();
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const getUserProfileId = async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    return data?.id || null;
  };

  const fetchEvents = async () => {
    try {
      const { data: adminProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin"]);

      if (profileError) throw profileError;

      const adminIds = adminProfiles?.map((p) => p.id) || [];
      if (adminIds.length === 0) return setEvents([]);

      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .in("creator_id", adminIds)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setEvents(eventData || []);

      const counts = {};
      for (const event of eventData || []) {
        const { count } = await supabase
          .from("rsvps")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id)
          .eq("status", "confirmed");
        counts[event.id] = count || 0;
      }

      setAttendeeCounts(counts);
    } catch (err) {
      console.error("Fetch Events Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRSVPs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("rsvps")
      .select("*")
      .eq("user_id", user.id);
    if (error) console.error("Fetch RSVP Error:", error);
    else setRsvps(data || []);
  };

  const getRSVPStatus = (eventId) => {
    const rsvp = rsvps.find((r) => r.event_id === eventId);
    return rsvp?.response_status || null;
  };

  const isEventCreator = (event) => {
    return user && event.creator_id === user.id;
  };

  const handleRSVP = async (eventId) => {
    if (!user) {
      return toast({
        title: "Authentication required",
        description: "Please log in to RSVP for events",
        variant: "destructive",
      });
    }

    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const hasRSVP = rsvps.some(
      (r) => r.event_id === eventId && r.response_status === "yes"
    );

    const confirmAction = async () => {
      try {
        if (!userProfileId) throw new Error("Profile not found");

        if (hasRSVP) {
          await supabase
            .from("rsvps")
            .delete()
            .eq("event_id", eventId)
            .eq("user_id", userProfileId);
          toast({
            title: "RSVP removed",
            description: "You're no longer attending this event",
          });
        } else {
          await supabase.from("rsvps").insert({
            event_id: eventId,
            user_id: userProfileId,
            response_status: "yes",
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

          const { id, name, longitude, latitude } = restaurantData;

          await supabase.from("restaurant_visits").insert({
            user_id: user.id,
            restaurant_id: id,
            restaurant_name: name,
            latitude,
            longitude,
            visited_at: new Date().toISOString(),
          });

          const { data: sameRestaurantVisits } = await supabase
            .from("restaurant_visits")
            .select("user_id")
            .eq("restaurant_id", id)
            .neq("user_id", userProfileId);

          for (const match of sameRestaurantVisits || []) {
            const otherUserId = match.user_id;
            const [userAId, userBId] =
              userProfileId < otherUserId
                ? [userProfileId, otherUserId]
                : [otherUserId, userProfileId];

            const { data: existingPath } = await supabase
              .from("crossed_paths_log")
              .select("*")
              .eq("user_a_id", userAId)
              .eq("user_b_id", userBId)
              .eq("restaurant_id", id)
              .single();

            if (existingPath) {
              await supabase
                .from("crossed_paths_log")
                .update({
                  cross_count: existingPath.cross_count + 1,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingPath.id);
            } else {
              await supabase.from("crossed_paths_log").insert({
                user_a_id: userAId,
                user_b_id: userBId,
                restaurant_id: id,
                restaurant_name: name,
                location_lat: latitude,
                location_lng: longitude,
                cross_count: 1,
              });

              const { data: directPath } = await supabase
                .from("crossed_paths")
                .select("*")
                .eq("user1_id", userAId)
                .eq("user2_id", userBId)
                .single();

              if (!directPath) {
                await supabase.from("crossed_paths").insert({
                  user1_id: userAId,
                  user2_id: userBId,
                  location_name: name,
                  location_lat: latitude,
                  location_lng: longitude,
                  is_active: true,
                });
              }
            }
          }

          toast({
            title: "RSVP confirmed!",
            description: "You're now attending this event",
          });
        }

        await fetchEvents();
        await fetchUserRSVPs();
      } catch (error) {
        toast({
          title: "Error",
          description: error.message || "RSVP failed",
          variant: "destructive",
        });
      }
    };

    toast({
      title: hasRSVP ? "Remove RSVP?" : "Confirm RSVP?",
      description: hasRSVP
        ? "Do you want to cancel your RSVP?"
        : "Do you want to RSVP to this event?",
      action: (
        <div className="flex gap-2">
          <Button onClick={confirmAction}>Yes</Button>
          <Button variant="outline">No</Button>
        </div>
      ),
    });
  };

  if (loading) {
    return <div className="h-96 rounded-xl animate-pulse bg-muted" />;
  }

  if (events.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-center text-muted-foreground bg-muted rounded-xl">
        <div>
          <h3 className="text-2xl font-semibold mb-2">No Events Found</h3>
          <Button onClick={() => navigate("/create-event")}>
            Create Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <p className="text-muted-foreground">
            Discover unique dining experiences
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="outline" onClick={scrollPrev}>
            <ChevronLeft />
          </Button>
          <Button size="icon" variant="outline" onClick={scrollNext}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-1">
          {events.map((event) => {
            const rsvpStatus = getRSVPStatus(event.id);
            const isCreator = isEventCreator(event);
            const attendeeCount = attendeeCounts[event.id] || 0;

            return (
              <div
                key={event.id}
                className="embla__slide px-2 flex-shrink-0 min-w-0 w-full sm:w-1/2 md:w-1/3"
              >
                <div
                  className={`overflow-hidden ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  ref={emblaRef}
                />

                <div className="flex flex-wrap gap-4 px-2">
                  <Card className="relative flex bg-[#0A0A0A] flex-col w-full sm:w-[20rem] lg:w-[25rem] h-[420px] border border-secondary overflow-hidden group hover:shadow-xl transition">
                    {/* Background */}
                    <div className="relative w-full flex items-center justify-center bg-black flex-shrink-0 h-48">
                      <img
                        src={event.cover_photo_url}
                        alt={event.name}
                        className="max-h-full w-full object-contain"
                      />
                    </div>

                    {/* Card Content */}
                    <CardContent className="flex flex-col flex-grow p-4 text-white">
                      {/* Title */}
                      <div className="mb-4">
                        <h3 className="text-2xl text-secondary/90 font-bold truncate">
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className="text-secondary/90 text-sm mt-1 line-clamp-1 truncate">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 text-secondary/90 mr-3" />
                        <span>
                          {new Date(event.date_time).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                          {" - "}
                          {new Date(event.date_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      {/* <div className="text-center rounded-lg p-3 pb-3">
                          <MapPin className="w-5 h-5 text-white" />
                          <p
                            className="text-[1.5rem] font-bold mt-1 truncate text-center max-w-[350px]"
                            title={event.location_name}
                          >
                            {event.location_name}
                          </p>
                        </div>  */}
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 text-secondary/90" />
                        {/* Location */}
                        <div className="text-sm flex flex-col ml-2">
                          <span className="truncate">
                            {event.location_name || "Location not specified"}
                          </span>
                          {/* Address */}
                          {event.location_address && (
                            <span className="text-sm text-gray-500 line-clamp-1 truncate">
                              {event.location_address}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Push buttons to bottom */}
                      <div className="flex gap-2 mt-auto">
                        {!event.is_paid && (
                          <Button 
                          onClick={() => navigate(`/event/${event.id}/details`)}
                          className="w-12 px-4 py-3 border border-secondary font-medium bg-transparent text-white hover:bg-secondary/20">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                        onClick={() => navigate(`/rsvp/${event.id}/details`)}
                        className="flex-grow px-4 py-3 text-lg font-medium bg-secondary text-black hover:bg-secondary/90 flex items-center gap-2 justify-center rounded-lg">
                          {rsvpStatus === "yes" ? "Un-RSVP" : "RSVP"}
                          <ChevronRight className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EventsCarousel;
