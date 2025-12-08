import React, { useState, useEffect, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import PriceFilter from "@/components/filter/PriceFilter";
import ParishLogo from "@/components/ui/logo";
import { LoaderText } from "@/components/loader/Loader";
import { useZoomWidth } from "@/hooks/use-width";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  Turtle,
  ChevronDown,
  Edit,
  Users,
  MapPin,
  Plus,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";

interface Event {
  id: string;
  name: string;
  description: string;
  date_time: string;
  location_name: string;
  location_address?: string;
  cover_photo_url?: string;
  city: string;
  tags?: string[];
  max_attendees: number;
  creator_id: string;
  is_mystery_dinner: boolean;
  profiles?: {
    first_name?: string;
    last_name?: string;
    profile_photo_url?: string;
    role?: "admin" | "user";
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

const OurExploreEvents = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [loading, setLoading] = useState(false);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [adminEvents, setAdminEvents] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [trending, setTrending] = useState("All");
  const [timeframe, setTimeframe] = useState("All");
  const [city, setCity] = useState("All");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFeatured, setShowFeatured] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userProfileId, setUserProfileId] = useState<string | null>(null);
  // const [userProfileId, setUserProfileId] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [attendeeCounts, setAttendeeCounts] = useState({});
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showCityList, setShowCityList] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const invitedUser = location.state?.invitedUser || null;
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 200]); // min and max
  const maxPrice = 1000; // or whatever ceiling you want
  const width = useZoomWidth();

  const trendingOptions = [
    "All",
    // "Trending",
    "Newest",
    "Largest",
  ];
  const timeframeOptions = ["All", "Today", "This Month", "Right Now"];
  const cityOptions = [
    "All",
    "Near Me",
    "New York City",
    "Miami",
    "Washington DC",
    "Boston",
    "Atlanta",
  ];
  const cityFilterMap: Record<string, string> = {
    "New York City": "New York",
    Miami: "Miami",
    "Washington DC": "Washington",
    Boston: "Boston",
    Atlanta: "Atlanta",
  };
  // const [filters, setFilters] = useState({
  //   trending: "Newest",
  //   timeframe: "All",
  //   city: "All",
  // });
  // const [searchParams, setSearchParams] = useSearchParams();
  // const [filtersReady, setFiltersReady] = useState(false);

  // const filters = {
  //   trending: searchParams.get("trending") || "Newest",
  //   timeframe: searchParams.get("timeframe") || "All",
  //   city: searchParams.get("city") || "All",
  // };

  // const [filtersReady, setFiltersReady] = useState(false);
  // const [filters, setFilters] = useState({
  //   trending: "Newest",
  //   timeframe: "All",
  //   city: "All",
  // });
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = useMemo(
    () => ({
      trending: searchParams.get("trending") || "Newest",
      timeframe: searchParams.get("timeframe") || "All",
      city: searchParams.get("city") || "All",
    }),
    []
  ); // <-- empty deps so it only runs once

  const [filters, setFilters] = useState(initialFilters);

  // const sliderData = [
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
  //     title: "Wheels of NYC - Fall Edition",
  //     location: "63 Flushing Ave, Brooklyn, NY",
  //     dateTime: "Saturday September 27, 11:00 AM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
  //     title: "Dionysus: Casino Royale Night",
  //     location: "Luxury Hall, NYC",
  //     dateTime: "Saturday September 27, 10:00 PM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
  //     title: "Wheels of NYC - Fall Edition",
  //     location: "63 Flushing Ave, Brooklyn, NY",
  //     dateTime: "Saturday September 27, 11:00 AM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
  //     title: "Dionysus: Casino Royale Night",
  //     location: "Luxury Hall, NYC",
  //     dateTime: "Saturday September 27, 10:00 PM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
  //     title: "Wheels of NYC - Fall Edition",
  //     location: "63 Flushing Ave, Brooklyn, NY",
  //     dateTime: "Saturday September 27, 11:00 AM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
  //     title: "Dionysus: Casino Royale Night",
  //     location: "Luxury Hall, NYC",
  //     dateTime: "Saturday September 27, 10:00 PM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
  //     title: "Wheels of NYC - Fall Edition",
  //     location: "63 Flushing Ave, Brooklyn, NY",
  //     dateTime: "Saturday September 27, 11:00 AM",
  //   },
  //   {
  //     image:
  //       "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
  //     title: "Dionysus: Casino Royale Night",
  //     location: "Luxury Hall, NYC",
  //     dateTime: "Saturday September 27, 10:00 PM",
  //   },
  // ];

  // useEffect(() => {
  //   const getUserProfile = async () => {
  //     if (user) {
  //       const { data: profile } = await supabase
  //         .from("profiles")
  //         .select("id")
  //         .eq("user_id", user.id)
  //         .single();
  //       setUserProfileId(profile?.id || null);
  //       return profile?.id || null;
  //     } else {
  //       setUserProfileId(null);
  //       return null;
  //     }
  //   };

  //   getUserProfile().then((profileId) => {
  //     if (profileId) {
  //       fetchEvents(profileId);
  //     }
  //   });
  // }, [user]);

  // useEffect(() => {
  //   if (userProfileId) {
  //     fetchEvents(userProfileId, filters);
  //     fetchAdminEvents();
  //   }
  //   // }, [userProfileId, filters]);
  // }, [userProfileId]);

  // useEffect(() => {
  //   if (!filtersReady || !userProfileId) return;
  //   fetchEvents(userProfileId, filters);
  //   fetchAdminEvents();
  // }, [filtersReady, userProfileId, searchParams.toString()]);

  // const handleFilterChange = (key, value) => {
  //   setFilters((prev) => ({ ...prev, [key]: value }));
  // };

  // const handleFilterChange = (key, value) => {
  //   const newParams = new URLSearchParams(searchParams);
  //   newParams.set(key, value);
  //   setSearchParams(newParams);
  // };

  // const handleFilterChange = (key, value) => {
  //   const newFilters = { ...filters, [key]: value };
  //   setFilters(newFilters);

  //   const newParams = new URLSearchParams();
  //   Object.entries(newFilters).forEach(([k, v]) => {
  //     if (v) newParams.set(k, v);
  //   });
  //   setSearchParams(newParams);
  // };

  // useEffect(() => {
  //   // Ensure default query params exist
  //   const newParams = new URLSearchParams(searchParams);
  //   let changed = false;

  //   if (!newParams.has("trending")) {
  //     newParams.set("trending", "Newest");
  //     changed = true;
  //   }
  //   if (!newParams.has("timeframe")) {
  //     newParams.set("timeframe", "All");
  //     changed = true;
  //   }
  //   if (!newParams.has("city")) {
  //     newParams.set("city", "All");
  //     changed = true;
  //   }

  //   if (changed) {
  //     setSearchParams(newParams);
  //   } else {
  //     // ✅ Mark filters ready only after defaults are ensured
  //     setFiltersReady(true);
  //   }
  // }, []);

  // // ✅ Fetch events only once when everything is ready
  // useEffect(() => {
  //   if (!filtersReady || !userProfileId) return;
  //   const currentFilters = {
  //     trending: searchParams.get("trending") || "Newest",
  //     timeframe: searchParams.get("timeframe") || "All",
  //     city: searchParams.get("city") || "All",
  //   };
  //   fetchEvents(userProfileId, currentFilters);
  //   fetchAdminEvents();
  // }, [filtersReady, userProfileId, searchParams.toString()]);

  // useEffect(() => {
  //   // Wait for searchParams to exist before marking ready
  //   const urlFilters = {
  //     trending: searchParams.get("trending") || "Newest",
  //     timeframe: searchParams.get("timeframe") || "All",
  //     city: searchParams.get("city") || "All",
  //   };

  //   // Apply them to state
  //   setFilters(urlFilters);

  //   // ✅ Mark filters initialized AFTER setting them
  //   setFiltersReady(true);
  // }, []);

  // useEffect(() => {
  //   if (!filtersReady || !userProfileId) return;
  //   fetchEvents(userProfileId, filters);
  //   fetchAdminEvents();
  // }, [filtersReady, userProfileId, filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const newParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newParams.set(k, v);
    });
    setSearchParams(newParams);
  };

  useEffect(() => {
    const newFilters = {
      trending: searchParams.get("trending") || "Newest",
      timeframe: searchParams.get("timeframe") || "All",
      city: searchParams.get("city") || "All",
    };
    setFilters(newFilters);
  }, [searchParams]);

  // ✅ Fetch only when filters or userProfileId change
  useEffect(() => {
    if (!profile?.id) return;

    // your fetchEvents logic here
    fetchEvents(profile.id, filters);
    fetchAdminEvents();
  }, [profile?.id, filters]);

  // const getUserProfileId = async () => {
  //   if (!user) return null;
  //   const { data } = await supabase
  //     .from("profiles")
  //     .select("id")
  //     .eq("user_id", user.id)
  //     .single();
  //   return data?.id || null;
  // };

  const fetchAdminEvents = async () => {
    try {
      setFeaturedLoading(true);
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
        .neq("explore", false)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      console.log(eventData);

      setAdminEvents(eventData || []);

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
      setFeaturedLoading(false);
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

        // await fetchEvents();
        await fetchAdminEvents();
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

  const fetchEvents = async (
    profileId?: string,
    filters?: {
      trending?: string;
      timeframe?: string;
      city?: string;
    }
  ) => {
    const currentProfileId = profileId || userProfileId;
    if (!currentProfileId) return;

    setEventsLoading(true);

    try {
      // const { data, error } = await supabase
      //   .from("dummyevents")
      //   .select(
      //     `
      //       *,
      //       profiles:creator_id (
      //         first_name,
      //         last_name,
      //         profile_photo_url,
      //         role
      //       )
      //     `
      //   )
      //   .eq("status", "active")

      //   .neq("is_mystery_dinner", true)
      //   .neq("is_private", true)
      //   .neq("explore", false)
      //   .order("date_time", { ascending: false });

      // ,
      //     rsvps (
      //       id,
      //       status,
      //       user_id
      //     )

      let query = supabase
        .from("events")
        .select(
          `
        *,
        profiles:creator_id (
          first_name,
          last_name,
          profile_photo_url,
          role
        ),
          rsvps (
            id,
            status,
            user_id
          )
        `
        )
        .eq("status", "active")
        .neq("is_mystery_dinner", true)
        .neq("is_private", true)
        .neq("explore", false);

      // 🔥 Trending
      if (filters?.trending === "Newest") {
        query = query.order("created_at", { ascending: false });
      } else if (filters?.trending === "Largest") {
        query = query.order("max_attendees", { ascending: false });
      }
      // else if (filters?.trending === "Trending") {
      //   query = query.order("rsvp_count", { ascending: false });
      // }
      else {
        query = query.order("date_time", { ascending: false });
      }

      // 🕒 Timeframe
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).toISOString();

      if (filters?.timeframe === "Today") {
        query = query
          .gte("date_time", `${today}T00:00:00Z`)
          .lte("date_time", `${today}T23:59:59Z`);
      } else if (filters?.timeframe === "This Month") {
        query = query
          .gte("date_time", startOfMonth)
          .lte("date_time", endOfMonth);
      } else if (filters?.timeframe === "Right Now") {
        query = query
          .lte("date_time", now.toISOString())
          .gte("eventEndDateTime", now.toISOString());
      } else if (filters?.timeframe === "This Week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

        query = query
          .gte("date_time", startOfWeek.toISOString())
          .lte("date_time", endOfWeek.toISOString());
      }

      // 🏙️ City
      // if (filters?.city && filters.city !== "All") {
      //   query = query.ilike("location_address", `%${filters.city}%`);
      // }

      if (
        filters?.city &&
        filters.city !== "All" &&
        filters.city !== "Near Me"
      ) {
        const cityKey = cityFilterMap[filters.city] || filters.city;
        query = query.ilike("location", `%${cityKey}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredEvents = data || [];

      if (filters?.city === "Near Me") {
        const getDistanceKm = (lat1, lon1, lat2, lon2) => {
          const R = 6371;
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) ** 2;
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        // Get user’s current location
        const userLoc = await new Promise<{ lat: number; lng: number } | null>(
          (resolve) => {
            if (!navigator.geolocation) return resolve(null);
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                }),
              () => resolve(null),
              { enableHighAccuracy: true }
            );
          }
        );

        if (userLoc) {
          filteredEvents = filteredEvents.filter((event) => {
            if (!event.location_lat || !event.location_lng) return false;
            const distance = getDistanceKm(
              userLoc.lat,
              userLoc.lng,
              event.location_lat,
              event.location_lng
            );
            return distance <= 50; // Within 50 km radius
          });
        }
      }

      const eventsWithCounts =
        filteredEvents?.map((event) => ({
          ...event,
          rsvp_count:
            event.rsvps?.filter((r) => r.status === "confirmed").length || 0,
          user_rsvp:
            event.rsvps?.filter((r) => r.user_id === currentProfileId) || [],
        })) || [];

      setEvents(eventsWithCounts);
      setEventsLoading(false);
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

  // const NavControls = ({
  //   trending,
  //   setTrending,
  //   timeframe,
  //   setTimeframe,
  //   city,
  //   setCity,
  //   trendingOptions,
  //   timeframeOptions,
  //   cityOptions,
  //   openDropdown,
  //   setOpenDropdown,
  // }) => {
  //   return (
  //     <div className="flex items-center gap-5 bg-white/20 rounded-full px-4 py-2 backdrop-blur-md">
  //       {[
  //         { label: trending, options: trendingOptions, setter: setTrending },
  //         { label: timeframe, options: timeframeOptions, setter: setTimeframe },
  //         { label: city, options: cityOptions, setter: setCity, city: true },
  //       ].map((menu, idx) => (
  //         <div key={idx} className="relative">
  //           <button
  //             className="px-3 py-1 flex items-center gap-1 text-sm font-semibold text-white hover:text-gray-200"
  //             onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
  //           >
  //             {idx === 2 && <span className="opacity-70">in</span>}
  //             {menu.label}
  //             <ChevronDown className="w-4 h-4" />
  //           </button>

  //           {openDropdown === idx && (
  //             <div className="absolute left-0 mt-2 bg-white text-black rounded-lg shadow-md z-40 min-w-[160px]">
  //               {menu.options.map((opt) => (
  //                 <div
  //                   key={opt}
  //                   onClick={() => {
  //                     menu.setter(opt);
  //                     setOpenDropdown(null);
  //                   }}
  //                   className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
  //                 >
  //                   {opt}
  //                 </div>
  //               ))}
  //               {menu.city && (
  //                 <input
  //                   type="text"
  //                   placeholder="Enter a City"
  //                   className="w-full px-4 py-2 border-t border-gray-300 outline-none text-sm"
  //                   onKeyDown={(e) => {
  //                     const target = e.target as HTMLInputElement;
  //                     if (e.key === "Enter" && target.value) {
  //                       menu.setter(target.value);
  //                       target.value = "";
  //                       setOpenDropdown(null);
  //                     }
  //                   }}
  //                 />
  //               )}
  //             </div>
  //           )}
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  const NavControls = ({
    filters,
    setFilters,
    trendingOptions,
    timeframeOptions,
    cityOptions,
    openDropdown,
    setOpenDropdown,
  }) => {
    const menus = [
      { key: "trending", label: filters.trending, options: trendingOptions },
      { key: "timeframe", label: filters.timeframe, options: timeframeOptions },
      { key: "city", label: filters.city, options: cityOptions, city: true },
    ];

    return (
      <div className="flex items-center gap-5 bg-white/20 rounded-full px-4 py-2 backdrop-blur-md">
        {menus.map((menu, idx) => (
          <div key={idx} className="relative">
            <button
              className="px-3 py-1 flex items-center gap-1 text-sm font-semibold text-white hover:text-gray-200"
              onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
            >
              {menu.key === "city" && <span className="opacity-70">in</span>}
              {menu.label}
              <ChevronDown className="w-4 h-4" />
            </button>

            {openDropdown === idx && (
              <div className="absolute left-0 mt-2 bg-white text-black rounded-lg shadow-md z-40 min-w-[160px]">
                {menu.options.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      setFilters(menu.key, opt);
                      setOpenDropdown(null);
                    }}
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {opt}
                  </div>
                ))}

                {menu.city && (
                  <input
                    type="text"
                    placeholder="Enter a City"
                    className="w-full px-4 py-2 border-t border-gray-300 outline-none text-sm"
                    onKeyDown={(e) => {
                      const target = e.target as HTMLInputElement;
                      if (e.key === "Enter" && target.value.trim()) {
                        setFilters("city", target.value.trim());
                        target.value = "";
                        setOpenDropdown(null);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  return (
    // <div className="min-h-screen bg-background text-white pt-16">
    //   <div className="w-full relative -mt-[2px]">
    //     <nav className="absolute top-0 left-0 w-full z-20 h-[80px] hidden sm:block">
    //       <div
    //         className="absolute inset-0 z-0"
    //         style={{
    //           backgroundImage: adminEvents.length
    //             ? `url(${adminEvents[currentSlide]?.cover_photo_url})`
    //             : "none",
    //           backgroundSize: "cover",
    //           backgroundPosition: "center",
    //           filter: "brightness(0.5) blur(8px)",
    //         }}
    //       ></div>

    //       <div className="relative z-10 backdrop-blur-md bg-black/40">
    //         <div className="flex items-center justify-center px-6 py-5">

    //           <NavControls
    //             filters={filters}
    //             setFilters={handleFilterChange}
    //             openDropdown={openDropdown}
    //             setOpenDropdown={setOpenDropdown}
    //             trendingOptions={trendingOptions}
    //             timeframeOptions={timeframeOptions}
    //             cityOptions={cityOptions}
    //           />
    //         </div>
    //       </div>
    //     </nav>

    //     <div
    //       className="sm:pt-[80px] touch-pan-y"
    //       style={{ touchAction: "pan-y" }}
    //     >
    //       <Carousel
    //         showThumbs
    //         autoPlay
    //         infiniteLoop
    //         showStatus={false}
    //         interval={4000}
    //         showArrows
    //         onChange={(index) => setCurrentSlide(index)}
    //         swipeable={false}
    //         emulateTouch={false}
    //         className="rounded-b-xl overflow-hidden"
    //       >
    //         {adminEvents.map((event, index) => (
    //           <div
    //             key={index}
    //             className="relative rounded-xl flex flex-col font-sans lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 gap-6 lg:gap-10 min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh]"
    //             style={{ touchAction: "pan-y" }}
    //           >
    //             <div
    //               className="absolute inset-0 z-0"
    //               style={{
    //                 backgroundImage: `url(${event.cover_photo_url})`,
    //                 backgroundSize: "cover",
    //                 backgroundPosition: "center",
    //                 // filter: "brightness(0.4) blur(10px)",
    //                 filter: "brightness(0.35) blur(8px)",
    //               }}
    //             ></div>
    //             <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-b from-neutral-100/20 via-neutral-200/5 to-transparent backdrop-blur-lg"></div>

    //             <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full p-7 gap-8">

    //               <div className="w-full sm:w-[70%] md:w-[60%] lg:w-[30%] max-w-[500px]">
    //                 <img
    //                   src={event.cover_photo_url}
    //                   alt={`Event ${index + 1}`}
    //                   className="w-full h-auto rounded-xl shadow-2xl object-cover"
    //                 />
    //               </div>

    //               <div className="text-white flex flex-col justify-center items-center lg:items-start text-center lg:text-left max-w-2xl px-2 sm:px-0">
    //                 <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
    //                   {event.name}
    //                 </h2>
    //                 <p className="text-base sm:text-lg md:text-xl mb-2 text-gray-200">
    //                   {event.location_name}
    //                 </p>
    //                 <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6">
    //                   {new Date(event.date_time).toLocaleDateString("en-US", {
    //                     month: "short",
    //                     day: "numeric",
    //                   })}{" "}
    //                   -{" "}
    //                   {new Date(event.date_time).toLocaleTimeString("en-US", {
    //                     hour: "numeric",
    //                     minute: "2-digit",
    //                   })}
    //                 </p>
    //                 <Link to={`/rsvp/${event.id}/details`}>
    //                   <button className="bg-white text-black px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200">
    //                     Get Tickets
    //                   </button>
    //                 </Link>
    //               </div>
    //             </div>
    //           </div>
    //         ))}
    //       </Carousel>
    //     </div>
    //   </div>

    <div className="min-h-screen bg-background text-white relative overflow-hidden">
      <div className="relative z-10 pt-16">
        <div className="w-full relative -mt-[2px]">
          {/* ✅ Page Navbar */}
          <nav className="absolute top-0 left-0 w-full z-20 h-[80px] hidden sm:block">
            {/* Background synced with carousel */}
            {adminEvents.length > 0 && (
              <div
                className="absolute inset-0 z-0 transition-all duration-700"
                style={{
                  backgroundImage: `url(${adminEvents[currentSlide]?.cover_photo_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "brightness(0.4) blur(8px)",
                }}
              />
            )}

            {/* Foreground (NavControls container) */}
            <div className="relative z-10 bg-black/40 backdrop-blur-md transition-all duration-700">
              <div className="flex items-center justify-center px-6 py-5">
                <NavControls
                  filters={filters}
                  setFilters={handleFilterChange}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                  trendingOptions={trendingOptions}
                  timeframeOptions={timeframeOptions}
                  cityOptions={cityOptions}
                />
              </div>
            </div>
          </nav>

          {/* CAROUSEL SECTION */}
          <div
            className="sm:pt-[80px] touch-pan-y"
            style={{ touchAction: "pan-y" }}
          >
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
              className="rounded-b-xl overflow-hidden"
            >
              <>
                {featuredLoading && (
                  <div className="w-full flex items-center justify-center py-20">
                    <LoaderText text="Loading Featured Events..." />
                  </div>
                )}
                {!featuredLoading && adminEvents.length === 0 && (
                  <div
                    className="relative rounded-xl flex flex-col font-sans lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 gap-6 lg:gap-10 min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh]"
                    style={{ touchAction: "pan-y" }}
                  >
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full p-7 gap-8">
                      <div className="flex flex-col justify-center items-center lg:items-start text-center lg:text-left max-w-2xl px-2 sm:px-0">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight text-primary font-script">
                          No Featured Events Available
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl mb-2 text-gray-200 text-center lg:text-center md:text-center sm:text-center ">
                          Please check back later for upcoming events.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {!featuredLoading &&
                  adminEvents.length > 0 &&
                  adminEvents.map((event, index) => (
                    <div
                      key={index}
                      className="relative rounded-xl flex flex-col font-sans lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 gap-6 lg:gap-10 min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh]"
                      style={{ touchAction: "pan-y" }}
                    >
                      {/* Carousel background image */}
                      <div
                        className="absolute inset-0 z-0"
                        style={{
                          backgroundImage: `url(${event.cover_photo_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "brightness(0.35) blur(0px)",
                        }}
                      />
                      <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-b from-neutral-100/20 via-neutral-200/5 to-transparent backdrop-blur-lg"></div>

                      {/* Carousel content */}
                      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full p-7 gap-8">
                        <div className="w-full sm:w-[70%] md:w-[60%] lg:w-[30%] max-w-[500px]">
                          <img
                            src={event.cover_photo_url}
                            alt={`Event ${index + 1}`}
                            className="w-full h-auto rounded-xl shadow-2xl object-cover"
                          />
                        </div>

                        <div className="text-white flex flex-col justify-center items-center lg:items-start text-center lg:text-left max-w-2xl px-2 sm:px-0">
                          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
                            {event.name}
                          </h2>
                          <p className="text-base sm:text-lg md:text-xl mb-2 text-gray-200">
                            {event.location_name}
                          </p>
                          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6">
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
                          <Link to={`/rsvp/${event.id}/details`}>
                            <button className="bg-white text-black px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200">
                              RSVP
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
              </>
            </Carousel>
          </div>
        </div>
      </div>

      <div className=" w-full z-50 bg-black/80 backdrop-blur-md flex sm:hidden">
        <button
          className="flex-1 py-3 text-center font-semibold text-white"
          onClick={() => setFilterOpen(true)}
        >
          Filter
        </button>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#111] rounded-lg p-6 w-[90%] max-w-md">
            {/* ✅ Mobile-friendly filter controls */}
            <div className="flex flex-col gap-4 text-white text-sm">
              {/* Trending */}
              <div>
                <label className="block mb-1 text-gray-400">Trending</label>
                {/* <select
                  value={trending}
                  onChange={(e) => setTrending(e.target.value)}
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {trendingOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select> */}
                <select
                  value={filters.trending}
                  // onChange={(e) =>
                  //   setFilters({ ...filters, trending: e.target.value })
                  // }
                  onChange={(e) =>
                    handleFilterChange("trending", e.target.value)
                  }
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {trendingOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block mb-1 text-gray-400">Timeframe</label>
                {/* <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {timeframeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select> */}
                <select
                  value={filters.timeframe}
                  // onChange={(e) =>
                  //   setFilters({ ...filters, timeframe: e.target.value })
                  // }
                  onChange={(e) =>
                    handleFilterChange("timeframe", e.target.value)
                  }
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {timeframeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              {/* <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter a City"
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                /> */}
              {/* <div>
                <label className="block mb-1 text-gray-400">City</label>

                <input
                  type="text"
                  value={filters.city}
                  // onChange={(e) =>
                  //   setFilters({ ...filters, city: e.target.value })
                  // }
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  placeholder="Enter a City"
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div> */}
              <div>
                <label className="block mb-1 text-gray-400">City</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.city}
                    onChange={(e) => handleFilterChange("city", e.target.value)}
                    onFocus={() => setShowCityList(true)}
                    onBlur={() => setTimeout(() => setShowCityList(false), 150)}
                    placeholder="Enter or select a city"
                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white"
                  />

                  {showCityList && (
                    <ul className="absolute z-50 bg-white text-black rounded-lg mt-1 shadow-md w-full max-h-48 overflow-y-auto">
                      {cityOptions
                        .filter((city) =>
                          city
                            .toLowerCase()
                            .includes(filters.city.toLowerCase())
                        )
                        .map((city) => (
                          <li
                            key={city}
                            onMouseDown={() => {
                              handleFilterChange("city", city);
                              setShowCityList(false);
                            }}
                            className={`px-4 py-2 hover:bg-gray-200 cursor-pointer ${
                              filters.city === city
                                ? "bg-gray-100 font-semibold"
                                : ""
                            }`}
                          >
                            {city}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            {/* <div className="mt-6">
              <PriceFilter
                onApply={(selectedRange) => {
                  setPriceRange(selectedRange);
                  setFilterOpen(false);
                }}
                onClose={() => setFilterOpen(false)} // 👈 pass this too
              />
            </div> */}
            <button
              onClick={() => {
                fetchEvents(userProfileId, filters);
                setFilterOpen(false);
              }}
              className="mt-4 w-full bg-white text-black px-6 py-2 rounded-full font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {eventsLoading ? (
        <div className="w-full flex items-center justify-center py-20">
          <LoaderText text="Loading Events..." />
        </div>
      ) : events.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center py-20 text-center px-4">
          <h2 className="text-2xl font-semibold mb-4 text-primary">
            No Events Found
          </h2>
          <p className="text-gray-400">
            Try adjusting your filters or check back later for new events!
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-5 px-4 my-5">
          {events.map((event, index) => (
            <Link
              key={index}
              to={`/event/${event.id}/details`}
              className="block relative font-sans font-serif rounded-[4%] overflow-hidden shadow-md border border-gray-200 hover:border-gray-700 hover:bg-white/10 hover:cursor-pointer transition-all duration-300 w-full sm:w-[90%] md:w-[45%] lg:w-[32%] max-w-[475px]"
            >
              <div className="relative  w-full h-[35rem] overflow-hidden rounded-[4%]">
                {/* Image */}
                <img
                  className="w-full h-full object-cover"
                  src={event.cover_photo_url}
                  alt={event.name}
                />

                {/* Title container with black bg + gradient top */}
                <div className="absolute inset-x-0 bottom-0">
                  <div className="relative bg-black">
                    <div className="absolute -top-[17.5rem] left-0 right-0 h-[17.5rem] bg-gradient-to-t from-black/60 via-black/20 to-transparent z-9"></div>
                    <span className="absolute -top-12 left-5 border border-white/20 text-white text-sm px-3 py-2 rounded shadow-md z-20">
                      {new Date(event.date_time).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {" • "}
                      {new Date(event.date_time).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>

                    <div className="pl-5 pt-1 flex flex-col gap-2 relative z-10">
                      <h3 className="text-2xl text-white font-script">
                        {event.name}
                      </h3>
                      <p className="text-white pb-7 text-sm">
                        {event.location_name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OurExploreEvents;
