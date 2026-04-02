import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/cards/Pill";
import { EventCard } from "@/components/cards/EventCard";
import { FAQ } from "@/components/faq/FAQ";
import heroImage from "/images/Landing Page 1.png";
import tapasEventImage from "@/assets/images/Carousel 2.png";
import coffeeEventImage from "@/assets/images/Carousel 3.png";
import teaEventImage from "@/assets/images/Carousel 1.png";
import ParishLogo from "@/components/ui/logo";
import {
  Calendar,
  MapPin,
  Users,
  Check,
  Coffee,
  UtensilsCrossed,
  Heart,
  Sparkles,
  Globe,
  Shield,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  Share,
  Share2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AuthPage from "@/components/auth/AuthPage";
import AuthLogin from "@/components/authLogin/AuthLogin";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoaderText } from "@/components/loader/Loader";
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

export const ParishUsLanding: React.FC = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [attendeeCounts, setAttendeeCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    try {
      // 1. Get admin IDs
      const { data: adminProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin"]);

      if (profileError) throw profileError;

      const adminIds = adminProfiles?.map((p) => p.id) || [];
      if (adminIds.length === 0) return setEvents([]);

      const now = new Date().toISOString();

      // 2. Fetch upcoming events first
      const { data: upcomingEvents, error: upcomingError } = await supabase
        .from("events")
        .select("*")
        .in("creator_id", adminIds)
        .eq("status", "active")
        .gte("date_time", now)
        .order("date_time", { ascending: true })
        .limit(3);

      if (upcomingError) throw upcomingError;

      let finalEvents = upcomingEvents || [];

      // 3. If not enough upcoming, fetch recent past events
      if (finalEvents.length < 3) {
        const remaining = 3 - finalEvents.length;

        const { data: pastEvents, error: pastError } = await supabase
          .from("events")
          .select("*")
          .in("creator_id", adminIds)
          .eq("status", "active")
          .lt("date_time", now)
          .order("date_time", { ascending: false }) // most recent past first
          .limit(remaining);

        if (pastError) throw pastError;

        finalEvents = [...finalEvents, ...(pastEvents || [])];
      }

      setEvents(finalEvents);

      // 4. Fetch attendee counts
      const counts: Record<string, number> = {};
      for (const event of finalEvents) {
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

  useEffect(() => {
    fetchEvents();
  }, []);

  if (showAuth) {
    return <AuthPage />;
  }

  if (showLogin) {
    return <AuthLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-surface border-b border-primary">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="cursor-pointer flex items-center space-x-1 shrink-0">
              <img
                className="w-10 h-8 mr-2 object-contain"
                src="https://udlsywpejkcnrygeeqvd.supabase.co/storage/v1/object/public/Parish/Parishus%20logo.png"
                alt="Logo"
              />
              <h1
                className="text-2xl font-bold bg-gradient-primary bg-clip-text text-black whitespace-nowrap font-script"
                style={{
                  fontSize: "30px",
                }}
              >
                Parish
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium ">
            <a href="#how">How it works</a>
            <a href="#events">Events</a>
            <a href="#faq">FAQ</a>
            <Link to={"/contact-us"}>Contact Us</Link>
          </nav>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <Link to={"/login"}>
              <Button variant="outline" size="default">
                Sign In
              </Button>
            </Link>
            <Link to={"/auth"}>
              <Button variant="default" size="default">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[linear-gradient(to_top_left,_primary_0%,_transparent_25%)]">
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-10 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary text-muted-foreground border border-primary/20 mb-6 animate-slide-in">
                <Sparkles className="w-4 h-4 mr-2 text-muted-foreground" />
                Every week in your city
              </div>

              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-foreground mb-6">
                Strangers become <span className="text-[#d2bdad]">friends</span>{" "}
                through curated{" "}
                <span className="text-[#d2bdad]">gatherings</span> — one great
                conversation at a time.
                {/* Strangers become <span className="text-[#d2bdad]">friends</span>{" "}
                over
                <span className="text-[#d2bdad]"> dinner</span> or coffee — one
                great conversation at a time. */}
              </h1>

              <div className="mb-6 lg:hidden">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl ">
                  <img
                    src={heroImage}
                    alt="People enjoying dinner together at Parish event"
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute inset-0" />
                </div>
              </div>

              <ul className="text-xl text-foreground/80 leading-relaxed">
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-primary" />
                  Small, curated groups (5-6)
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-primary" />
                  Matched by vibe + interests
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-primary" />
                  Dinners, coffee, or tea - every week
                </li>
              </ul>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                Come hungry for food, stay for the conversations.
              </p>

              <div className="flex flex-wrap mt-5 gap-4 mb-8">
                <Link to={"/auth"}>
                  <Button variant="default" size="default">
                    Reserve My Spot
                  </Button>
                </Link>
                <Link to={"/auth"}>
                  <Button variant="outline" size="default" className="border ">
                    Host a Table
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary text-muted-foreground border border-primary/20">
                  Weekly dinners • coffees • teas
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ">
                <img
                  src={heroImage}
                  alt="People enjoying dinner together at Parish event"
                  className="w-full h-auto object-contain"
                />
                <div className="absolute inset-0 " />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-script">
              How Parish works
            </h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Three simple steps to meaningful connections
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="w-8 h-8" />,
                title: "Create your profile",
                description:
                  "Tell us your vibe — choose your interests, conversation style, and availability so we can match you with the right table.",
                color: "bg-primary",
              },
              {
                icon: <Heart className="w-8 h-8" />,
                title: "Get matched to a table",
                description:
                  "We place you in a small group of 5–6 people with shared interests and fresh perspectives for balanced, lively conversations.",
                color: "bg-primary",
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "RSVP & show up",
                description:
                  "If it's a paid event, you'll check out securely. If it's free, just RSVP and attend. Everyone pays their own bill at the venue.",
                color: "bg-primary",
              },
            ].map((step, index) => (
              <div key={index} className="group">
                <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-xl transition-all duration-300 hover:border-primary/30">
                  <div
                    className={`w-16 h-16 rounded-2xl ${step.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  >
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {step.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-5xl mx-auto mt-12">
            <div className="p-4 rounded-xl bg-muted border border-secondary/20 text-center">
              <p className="text-xl text-muted-foreground font-medium">
                💡 We match groups by interests and conversation style to create
                engaging, pressure-free dinners and coffee meetups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Showcase */}
      <section id="events" className="py-20 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-script">
                Events
              </h2>
              <p className="text-xl text-foreground/70">
                Choose your perfect gathering
              </p>
            </div>
            <Link to={"/auth"}>
              <Button variant="outline" className="hidden sm:flex">
                See Full Calendar →
              </Button>
            </Link>
          </div>

          {/* <div className="flex flex-wrap gap-5 px-4 my-5"> */}
          <div className="w-full px-4 my-5">
            {loading ? (
              // Array.from({ length: 3 }).map((_, i) => (
              //   <div
              //     key={i}
              //     className=" h-[420px] w-full sm:w-[90%] md:w-[45%] lg:w-[30%] max-w-[420px] rounded-xl animate-pulse bg-muted "
              //   />
              // ))
              <div className="flex items-center justify-center bg-background">
                <LoaderText text="Loading" />
              </div>
            ) : events.length === 0 ? (
              <div className="flex items-center justify-center bg-background">
                <div className="flex items-center justify-center bg-background">
                  <div className="flex flex-col justify-center items-center text-center max-w-2xl px-2 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight text-primary font-script">
                      No Upcoming Events
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl mb-2 text-gray-200 text-center">
                      Stay tuned! New events will be announced soon.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // <div className="">
              // <div className="relative">
              <div className="relative w-full overflow-hidden">
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
                  // className="rounded-xl overflow-visible"
                  className="rounded-xl w-full"
                >
                  {events.map((event) => (
                    // const attendeeCount = attendeeCounts[event.id] || 0;

                    // return (
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
                            <h2 className="font-script text-xl sm:text-2xl md:text-4xl lg:text-4xl p-1 font-bold text-white line-clamp-1 leading-[1.35]">
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
                                  {event.location_name ||
                                    "Location not specified"}
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
                                  },
                                )}{" "}
                                -{" "}
                                {new Date(event.date_time).toLocaleTimeString(
                                  "en-US",
                                  {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>

                              <div className="flex items-center justify-center lg:justify-start gap-2 text-gray-300 text-sm">
                                <Users className="w-4 h-4" />
                                <span>
                                  {attendeeCounts[event.id]} attending
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center lg:justify-start justify-center gap-3 mt-4 w-full">
                              <Link to={"/auth"}>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-full transition group"
                                >
                                  <Share2 className="h-5 w-5 text-[#d2bdad] icon-animate" />
                                </Button>
                              </Link>
                              <Link to={`/auth`}>
                                <Button className="w-full group sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg font-semibold bg-primary text-black hover:bg-gray-200 rounded-full flex items-center justify-center gap-2 transition-all">
                                  RSVP
                                  <ChevronRight className="w-5 h-5 icon-animate" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                  <div className="hidden lg:block swiper-pagination"></div>
                </Swiper>
              </div>
              // </div>
            )}
          </div>

          <div className="text-center">
            <Link to={"/auth"}>
              <Button variant="default" size="default">
                Create Your Event
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Admin & Host Section */}
      <section className="py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-script">
                Made for hosts & admins
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  "Create paid or free events with seats, venue, and date/time",
                  "Automatic routing to payment portal for paid events",
                  "Guests RSVP in one tap. Free events bypass checkout",
                  "Recurring gatherings can be scheduled by Admin",
                  "Get your events listed and brought to life",
                ].map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0" />
                    <p className="text-foreground/80 leading-relaxed">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Link to={"/auth"}>
                  <Button variant="default" size="default">
                    Start Hosting
                  </Button>
                </Link>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border shadow-parish">
              <h3 className="text-2xl font-bold text-foreground mb-6">
                Fast RSVP flow
              </h3>
              <div className="space-y-4 mb-6">
                {[
                  "Choose an event",
                  "Confirm or pay",
                  "Get your seat confirmation by email/text",
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold font-script">
                      {index + 1}
                    </div>
                    <span className="text-foreground">{step}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-muted border border-secondary/20">
                <p className="text-sm text-muted-foreground font-medium">
                  💡 Tip: We match groups by interests and conversation style
                  for balanced, lively tables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Parish */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8 font-script">
                Mornings, evenings — better with company
              </h2>
              <div className="space-y-6 mb-8">
                {[
                  {
                    icon: <Coffee className="w-6 h-6" />,
                    text: "Update your routine with meaningful social time",
                    color: "bg-primary",
                  },
                  {
                    icon: <Users className="w-6 h-6" />,
                    text: "Meet like‑minded people without the pressure",
                    color: "bg-primary",
                  },
                  {
                    icon: <Globe className="w-6 h-6" />,
                    text: "Discover great restaurants and cafés near you",
                    color: "bg-primary",
                  },
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full ${benefit.color} text-white flex items-center justify-center flex-shrink-0`}
                    >
                      {benefit.icon}
                    </div>
                    <p className="text-lg text-foreground">{benefit.text}</p>
                  </div>
                ))}
              </div>
              <Link to={"/auth"}>
                <Button variant="default" size="default">
                  Join Your First Parish
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-border">
                  <div className="text-center p-8">
                    <Coffee className="w-16 h-16 text-primary mx-auto mb-4" />
                    <p className="text-lg text-foreground/80">
                      Beautiful moments start with simple connections
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-8 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-script">
              Got questions? We've got answers
            </h2>
            <p className="text-xl text-foreground/70">
              Everything you need to know about Parish
            </p>
          </div>
          <FAQ />
        </div>
      </section>

      {/* Support Callout */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4 font-script">
            Still have questions?
          </h3>
          <p className="text-xl text-foreground/70 mb-8">
            We're happy to help you get started
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to={"/contact-us"}>
              <Button variant="default" size="default">
                Contact Support
              </Button>
            </Link>
            <Link to={"/auth"}>
              <Button variant="outline" size="default">
                Browse Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary border-b border-border py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center">
              <ParishLogo />
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/80">
              <Link to="/contact-us">Contact Us</Link>
              <Link to="/refund-policy">Refund Policy</Link>
              <Link to="/safety-guidelines">Safety Guidelines</Link>
              <Link to="/terms-conditions">Terms & Conditions</Link>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </nav>

            {/* Copyright */}
            <p className="text-center">© {new Date().getFullYear()} Parish</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
