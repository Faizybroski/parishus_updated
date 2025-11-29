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

const EventsCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [events, setEvents] = useState([]);

  const dummyEvents = [
    {
      id: 1,
      name: "Boston Jazz Night",
      description:
        "Join us for an unforgettable night of smooth jazz and great company in the heart of Boston.",
      cover_photo_url:
        "https://images.unsplash.com/photo-1628258334105-2a0b3d6efee1?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location_name: "The Jazz Lounge",
      location_address: "225 Northern Ave, Boston, MA 02210, USA",
      date_time: "2025-12-10T19:00:00",
    },
    {
      id: 2,
      name: "Miami Beach Yoga Retreat",
      description:
        "A full day of relaxation, yoga, and meditation on the sunny Miami Beach.",
      cover_photo_url:
        "https://images.unsplash.com/photo-1554331808-4e46e8ee8041?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location_name: "Miami Beach",
      location_address: "123 Ocean Drive, Miami, FL 33139, USA",
      date_time: "2025-12-15T08:30:00",
    },
    {
      id: 3,
      name: "Atlanta Food Festival Atlanta Food Festival Atlanta Food Festival Atlanta Food Festival",
      description:
        "Taste the best of Atlanta! Food trucks, live music, and fun for the whole family. An elegant evening of dinner, dancing, and charity in Washington DC. Taste the best of Atlanta! Food trucks, live music, and fun for the whole family. An elegant evening of dinner, dancing, and charity in Washington DC.",
      cover_photo_url:
        "https://images.unsplash.com/photo-1519068737630-e5db30e12e42?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location_name: "Piedmont Park",
      location_address: "1320 Monroe Dr NE, Atlanta, GA 30306, USA",
      date_time: "2025-12-20T12:00:00",
    },
    {
      id: 4,
      name: "New York City Tech Meetup",
      description:
        "Networking event for tech enthusiasts and startup founders in NYC.",
      cover_photo_url:
        "https://images.unsplash.com/photo-1564910443496-5fd2d76b47fa?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location_name: "NYC Tech Hub",
      location_address: "50 Broad St, New York, NY 10004, USA",
      date_time: "2025-12-18T18:00:00",
    },
    {
      id: 5,
      name: "Washington DC Winter Gala",
      description:
        "An elegant evening of dinner, dancing, and charity in Washington DC.",
      cover_photo_url:
        "https://images.unsplash.com/photo-1526374870839-e155464bb9b2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location_name: "DC Grand Hall",
      location_address: "600 Pennsylvania Ave NW, Washington, DC 20001, USA",
      date_time: "2025-12-22T20:00:00",
    },
  ];
  const [dummmyevents, setdummyEvents] = useState(dummyEvents);
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

      // setAttendeeCounts(counts);
      const attendeeCounts = {
        1: 34,
        2: 50,
        3: 120,
        4: 75,
        5: 40,
      };

      setAttendeeCounts(attendeeCounts);
      // setAttendeeCounts(counts);
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

  // const getRSVPStatus = (eventId) => {
  //   const statuses = ["yes", "no", "yes", "pending", "yes"];
  //   return statuses[eventId - 1];
  // };
  //   const getRSVPStatus = (eventId) => {
  //   const rsvp = rsvps.find((r) => r.event_id === eventId);
  //   return rsvp?.response_status || null;
  // };

  // -------------------TESTING/DEVELOPMENT/DUMMY---------------------------------------------------------------------------------------------

  const getRSVPStatus = (eventId) => {
    // Just a dummy random example
    const statuses = ["yes", "no"];
    return statuses[eventId % 2];
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
    return (
      <div className="flex items-center justify-center bg-background">
        <LoaderText text="Loading" />
      </div>
    );
  }

  // if (events.length === 0) {
  if (dummmyevents.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center text-center text-muted-foreground bg-background rounded-xl">
        <div>
          <h3 className="text-2xl font-semibold mb-2">No Featured Events yet</h3>
          {/* <Link to={"/create-event"}>
            <Button>Create Event</Button>
          </Link> */}
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
      </div>

      {/* <div className="overflow-hidden" ref={emblaRef}>

        <div className="sm:pt-10 touch-pan-y" style={{ touchAction: "pan-y" }}>
          <Carousel
            showThumbs={true}
            autoPlay={true}
            infiniteLoop={true}
            showStatus={false}
            interval={4000}
            showArrows
            onChange={(index) => setCurrentSlide(index)}
            swipeable={false}
            emulateTouch={false}
            className="rounded-xl overflow-hidden"
          >
            //  {events.map((event) => { 
            {dummmyevents.map((event) => {
              const rsvpStatus = getRSVPStatus(event.id);
              const attendeeCount = attendeeCounts[event.id] || 0;

              return (
                <div
                  key={event.id}
                  className="relative rounded-xl overflow-hidden min-h-[75vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center"
                  style={{ touchAction: "pan-y" }}
                >
                  <div
                    className="absolute inset-0 z-0"
                    style={{
                      backgroundImage: `url(${event.cover_photo_url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: "brightness(0.35) blur(8px)",
                    }}
                  ></div>

                  <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-b from-neutral-100/20 via-neutral-200/5 to-transparent backdrop-blur-lg"></div>

                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full px-4 sm:px-8 lg:px-16 py-10 gap-6 sm:gap-10 text-white">
                    
                    <div className="w-full sm:w-[80%] md:w-[55%] lg:w-[25%] flex justify-center">
                      <img
                        src={event.cover_photo_url}
                        alt={event.name}
                        className="w-full max-w-[400px] h-auto rounded-2xl shadow-2xl object-cover aspect-[4/5]"
                        loading="lazy"
                      />
                    </div>

                    <div className="w-full lg:w-[50%] text-center lg:text-left flex flex-col items-center lg:items-start">
                      
                      <h2 className="font-script text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-snug text-white line-clamp-2 pb-2">
                        {event.name}
                      </h2>

                      <div className="w-full mb-4 min-h-[80px] sm:min-h-[90px] md:min-h-[100px] max-h-[120px] overflow-hidden">
                        {event.description && (
                          <p className="text-sm sm:text-base md:text-lg text-gray-200 line-clamp-3 sm:line-clamp-4">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="w-full space-y-2 mb-4">
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

                        <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-300 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{attendeeCount} attending</span>
                        </div>
                      </div>

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
      </div> */}
      <div className="relative">
        <Swiper
          modules={[Navigation, Autoplay, Pagination]}
          spaceBetween={20}
          slidesPerView={1}
          loop={true}
          navigation={{
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          }}
          pagination={{
            el: ".swiper-pagination",
            clickable: true,
            type: "bullets",
          }}
          autoplay={{ delay: 2000 }}
          className="rounded-xl overflow-visible"
        >
          <div className="swiper-pagination"></div>
          {dummmyevents.map((event) => {
            const rsvpStatus = getRSVPStatus(event.id);
            const attendeeCount = attendeeCounts[event.id] || 0;

            return (
              <SwiperSlide key={event.id}>
                <div className="relative rounded-xl overflow-hidden min-h-[75vh] flex items-center justify-center">
                  {/* Background */}
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${event.cover_photo_url})`,
                      filter: "brightness(0.35) blur(8px)",
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-b from-neutral-100/20 via-neutral-200/5 to-transparent backdrop-blur-lg"></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full px-3 sm:px-6 lg:px-16 py-6 sm:py-10 pb-14 sm:pb-20 gap-4 sm:gap-6 lg:gap-10 text-white">
                    {/* Event Image */}
                    <div className="w-full sm:w-[80%] md:w-[55%] lg:w-[25%] flex justify-center">
                      <img
                        src={event.cover_photo_url}
                        alt={event.name}
                        className="w-full max-w-[100px] lg:max-w-[400px] md:max-w-[400px] sm:max-w-[400px] h-auto rounded-2xl shadow-2xl object-cover aspect-[4/5]"
                        loading="lazy"
                      />
                    </div>

                    {/* Text Content */}
                    <div className="w-full lg:w-[50%] h-full text-center lg:text-left flex flex-col items-center lg:items-start space-y-3 sm:space-y-4">
                      <h2
                        className="font-script text-xl sm:text-2xl md:text-4xl lg:text-4xl p-1 font-bold text-white line-clamp-1 leading-[1.35]"
                      >
                        {event.name}
                      </h2>
                      {/* <div className="w-full min-h-[60px] sm:min-h-[80px] md:min-h-[100px] max-h-[110px] overflow-hidden"> */}
                        {event.description && (
                          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 line-clamp-2 sm:line-clamp-3">
                            {event.description}
                          </p>
                        )}
                      {/* </div> */}
                      <div className="w-full space-y-1">
                        <div className="text-gray-100 text-sm sm:text-base">
                          <p className="font-medium truncate">
                            {event.location_name || "Location not specified"}
                          </p>
                          {event.location_address && (
                            <p className="text-gray-300 truncate hidden lg:flex md:flex sm:flex">
                              {event.location_address}
                            </p>
                          )}
                        </div>

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

                        <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-300 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{attendeeCount} attending</span>
                        </div>
                      </div>
                      <div className="flex items-center lg:justify-start justify-center gap-3 mt-4 w-full">
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
                          <Button className="w-full group sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold bg-primary text-black hover:bg-gray-200 rounded-full flex items-center justify-center gap-2 transition-all">
                            {rsvpStatus === "yes" ? "Cancel RSVP" : "RSVP"}
                            <ChevronRight className="w-5 h-5 icon-animate" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
          <div className="swiper-pagination"></div>
        </Swiper>
      </div>
    </div>
  );
};

export default EventsCarousel;
