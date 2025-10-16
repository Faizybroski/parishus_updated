import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
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
import { LoaderText } from "@/components/loader/Loader";
import { useNavigate, Link, useLocation } from "react-router-dom";
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
  // const [events, setEvents] = useState([]);
  const [dummyEvents, setDummyEvents] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [attendeeCounts, setAttendeeCounts] = useState({});
  const [currentSlide, setCurrentSlide] = useState(0);
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

      const dummyEvents = [
        {
          id: 1,
          name: "The Fifth Seat Dinner",
          description:
            "A private fine dining experience featuring Toronto’s best chefs. Join us for an evening of conversation and creativity.",
          date_time: "2025-10-22T19:00:00Z",
          location_name: "Canoe Restaurant, Toronto",
          location_address: "66 Wellington St W, Toronto, ON",
          cover_photo_url:
            "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 2,
          name: "Sunset Rooftop Meetup",
          description:
            "A golden-hour networking event with a skyline view of Vancouver. Drinks, jazz, and connection await.",
          date_time: "2025-10-25T18:30:00Z",
          location_name: "The Roof, Vancouver",
          location_address: "123 Granville St, Vancouver, BC",
          cover_photo_url:
            "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 3,
          name: "Midnight Coffee Circle",
          description:
            "A cozy night for creatives and thinkers. Bring your ideas, stories, and favorite blend — inspiration guaranteed.",
          date_time: "2025-10-28T23:00:00Z",
          location_name: "Pilot Coffee Roasters, Ottawa",
          location_address: "150 Elgin St, Ottawa, ON",
          cover_photo_url:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        },
        {
          id: 5,
          name: "Art & Soul Gala",
          description:
            "An evening celebrating local artists, live performances, and a touch of glamour. Dress code: creative formal.",
          date_time: "2025-11-10T20:00:00Z",
          location_name: "Art Gallery of Alberta, Edmonton",
          location_address: "2 Sir Winston Churchill Square, Edmonton, AB",
          cover_photo_url:
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80",
        },
      ];

      // setEvents(eventData || []);
      setDummyEvents(dummyEvents);

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

  // TESTING/DEVELOPMENT/DUMMY-----------------------------------------------------

  const getRSVPStatus = (eventId) => {
    const statuses = ["yes", "no", "yes", "pending", "yes"];
    return statuses[eventId - 1];
  };
  // -------------------TESTING/DEVELOPMENT/DUMMY---------------------------------------------------------------------------------------------
  // const getRSVPStatus = (eventId) => {
  //   const rsvp = rsvps.find((r) => r.event_id === eventId);
  //   return rsvp?.response_status || null;
  // };

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
    return (
      <div className="flex items-center justify-center bg-background">
        <LoaderText text="Loading" />
      </div>
    );
  }

  // if (events.length === 0) {
  if (dummyEvents.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-center text-muted-foreground bg-background rounded-xl">
        <div>
          <h3 className="text-2xl font-semibold mb-2">No Events Found</h3>
          <Link to={"/create-event"}>
            <Button>Create Event</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header & Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Featured Events</h2>
          <p className="text-muted-foreground">
            Discover unique dining experiences
          </p>
        </div>
        {/* <div className="flex gap-2">
          <Button size="icon" variant="outline" onClick={scrollPrev}>
            <ChevronLeft />
          </Button>
          <Button size="icon" variant="outline" onClick={scrollNext}>
            <ChevronRight />
          </Button>
        </div> */}
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        {/* <div className="flex gap-1">
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
                  <Card className="relative flex flex-col w-full sm:w-[20rem] lg:w-[25rem] h-[420px] border border-secondary overflow-hidden group hover:shadow-xl transition">
                    
                    <div className="relative w-full flex items-center justify-center bg-primary flex-shrink-0 h-48">
                      <img
                        src={event.cover_photo_url}
                        alt={event.name}
                        className="max-h-full w-full object-contain"
                      />
                    </div>

                    
                    <CardContent className="flex flex-col flex-grow p-4 text-muted-foreground">
                      
                      <div className="mb-4">
                        <h3 className="text-2xl text-black font-bold truncate">
                          {event.name}
                        </h3>
                        {event.description && (
                          <p className=" text-sm mt-1 line-clamp-1 truncate">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center mb-2">
                        <Calendar className="h-5 w-5 mr-3" />
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
                      
                      <div className="flex items-center">
                        <MapPin className="w-5 h-5 " />
                        
                        <div className="text-sm flex flex-col ml-2">
                          <span className="truncate">
                            {event.location_name || "Location not specified"}
                          </span>
                          
                          {event.location_address && (
                            <span className="text-sm text-gray-500 line-clamp-1 truncate">
                              {event.location_address}
                            </span>
                          )}
                        </div>
                      </div>

                      
                      <div className="flex gap-2 mt-auto">
                        {!event.is_paid && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              navigate(`/event/${event.id}/details`)
                            }
                            className=""
                          >
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        )}
                        <Button
                          onClick={() => navigate(`/rsvp/${event.id}/details`)}
                          className="flex-grow px-4 py-3 text-lg font-medium text-black flex items-center gap-2 justify-center rounded-lg"
                        >
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
        </div> */}
        <div className="sm:pt-10 touch-pan-y" style={{ touchAction: "pan-y" }}>
          <Carousel
            showThumbs
            autoPlay
            infiniteLoop
            showStatus={false}
            interval={4000}
            showArrows
            onChange={(index) => setCurrentSlide(index)}
            swipeable={false}
            emulateTouch={false}
            className="rounded-xl overflow-hidden"
          >
            {/* {events.map((event) => { */}
            {dummyEvents.map((event) => {
              const rsvpStatus = getRSVPStatus(event.id);
              // DEVELOPMENT/DUMMY/TESTING---------------------------
              const attendeeCount = attendeeCounts[event.id] || 0;
              // const attendeeCount = {
              //   1: 24,
              //   2: 48,
              //   3: 12,
              //   4: 36,
              //   5: 60,
              // };

              return (
                <div
                  key={event.id}
                  className="relative rounded-xl overflow-hidden min-h-[75vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center"
                  style={{ touchAction: "pan-y" }}
                >
                  {/* Background with blur */}
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      backgroundImage: `url(${event.cover_photo_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "brightness(0.35) blur(8px)",
                    }}
                  ></div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-b from-neutral-100/20 via-neutral-200/5 to-transparent backdrop-blur-lg"></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full px-4 sm:px-8 lg:px-16 py-10 gap-6 sm:gap-10 text-white">
                    {/* Event Image */}
                    <div className="w-full sm:w-[80%] md:w-[55%] lg:w-[25%] flex justify-center">
                      <img
                        src={event.cover_photo_url}
                        alt={event.name}
                        className="w-full max-w-[400px] h-auto rounded-2xl shadow-2xl object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Text Content - Fixed Height Container */}
                    <div className="w-full lg:w-[50%] text-center lg:text-left flex flex-col items-center lg:items-start">
                      {/* Title */}
                      <h2 className="font-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-snug text-white line-clamp-2 pb-2">
                        {event.name}
                      </h2>

                      {/* Description Container with Fixed Height */}
                      <div className="w-full mb-4 min-h-[80px] sm:min-h-[90px] md:min-h-[100px] max-h-[120px] overflow-hidden">
                        {event.description && (
                          <p className="text-sm sm:text-base md:text-lg text-gray-200 line-clamp-3 sm:line-clamp-4">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="w-full space-y-2 mb-4">
                        {/* Location */}
                        <div className="text-gray-100 text-sm sm:text-base">
                          <p className="font-medium truncate">
                            {event.location_name || "Location not specified"}
                          </p>
                          {event.location_address && (
                            <p className="text-gray-300 truncate">
                              {event.location_address}
                            </p>
                          )}
                        </div>

                        {/* Date & Time */}
                        <p className="text-gray-200 text-sm sm:text-base">
                          {new Date(event.date_time).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}{" "}
                          -{" "}
                          {new Date(event.date_time).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>

                        {/* Attendees */}
                        <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-300 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{attendeeCount} attending</span>
                        </div>
                      </div>

                      {/* Buttons - Always at bottom */}
                      <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3 mt-4 w-full">
                        <Link to={`/event/${event.id}/details`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-full transition group"
                          >
                            <Share2 className="h-5 w-5 text-[#d2bdad] icon-animate" />
                          </Button>
                        </Link>
                        <Link to={`/rsvp/${event.id}/details`}>
                          <Button className="w-full group sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold bg-white text-black hover:bg-gray-200 rounded-full flex items-center justify-center gap-2 transition-all">
                            {rsvpStatus === "yes" ? "Cancel RSVP" : "RSVP"}
                            <ChevronRight className="w-5 h-5 icon-animate" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Carousel>
        </div>
      </div>
    </div>
  );
};

export default EventsCarousel;
