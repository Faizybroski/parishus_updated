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
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const ParishUsLanding: React.FC = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
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
  });

  if (showAuth) {
    return <AuthPage />;
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="cursor-pointer flex items-center space-x-1 shrink-0">
              <img
                className="w-10 h-8 mr-2 object-contain"
                src="/Parishus logo.png"
                alt="Logo"
              />
              <h1
                className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent whitespace-nowrap"
                style={{
                  fontSize: "30px",
                  color: "#9dc0b3",
                  fontFamily: "Sergio Trendy",
                }}
              >
                Parish
              </h1>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#how" className="text-white transition-colors">
              How it works
            </a>
            <a href="#events" className="text-white  transition-colors">
              Events
            </a>
            <a href="#faq" className="text-white  transition-colors">
              FAQ
            </a>
            <a
              onClick={() => navigate("contact-us")}
              className="text-white cursor-pointer transition-colors"
            >
              Contact Us
            </a>
          </nav>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <Button
              variant="default"
              size="default"
              className="bg-[#9dc0b3]"
              onClick={() => setShowAuth(true)}
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[linear-gradient(to_top_left,_#4b1603_0%,_transparent_25%)] bg-black">
        <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-6 animate-slide-in">
                <Sparkles className="w-4 h-4 mr-2" />
                Every week in your city
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-foreground mb-6">
                Strangers become <span className="text-primary">friends</span>{" "}
                over
                <span className="text-primary"> dinner</span> or coffee — one
                great conversation at a time.
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
                  <Check className="h-5 w-5 mr-2 text-[#e4c29a]" />
                  Small, curated groups (5-6)
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-[#e4c29a]" />
                  Matched by vibe + interests
                </li>
                <li className="flex items-center">
                  <Check className="h-5 w-5 mr-2 text-[#e4c29a]" />
                  Dinners, coffee, or tea - every week
                </li>
              </ul>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">
                Come hungry for food, stay for the conversations.
              </p>

              <div className="flex flex-wrap mt-5 gap-4 mb-8">
                <Button
                  variant="default"
                  size="default"
                  onClick={() => setShowAuth(true)}
                >
                  Reserve My Spot
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="border border-[#e4c29a]"
                  onClick={() => setShowAuth(true)}
                >
                  Host a Table
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20">
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
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
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
                color: "bg-secondary",
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "RSVP & show up",
                description:
                  "If it's a paid event, you'll check out securely. If it's free, just RSVP and attend. Everyone pays their own bill at the venue.",
                color: "bg-accent",
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

          <div className="max-w-2xl mx-auto mt-12">
            <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20 text-center">
              <p className="text-sm text-secondary font-medium">
                💡 We match groups by interests and conversation style to create
                engaging, pressure-free dinners and coffee meetups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Events Showcase */}
      <section id="events" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Events
              </h2>
              <p className="text-xl text-foreground/70">
                Choose your perfect gathering
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden sm:flex"
              onClick={() => setShowAuth(true)}
            >
              See Full Calendar →
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[420px] w-full sm:w-[20rem] lg:w-[25rem] rounded-xl animate-pulse bg-muted"
                />
              ))
            ) : events.length === 0 ? (
              <Card className="flex flex-col items-center justify-center h-[420px] border border-dashed border-secondary bg-muted/20 text-center">
                <div className="text-secondary mb-3">
                  <Calendar className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold text-muted-foreground">
                  No Upcoming Events
                </h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                  Stay tuned! New events will be announced soon.
                </p>
              </Card>
            ) : (
              events.map((event) => (
                <Card
                  key={event.id}
                  className="relative flex flex-col bg-[#0A0A0A] w-full sm:w-[20rem] lg:w-[25rem] h-[420px] border border-secondary overflow-hidden group hover:shadow-xl transition"
                >
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
                    {/* Top Section */}
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

                    {/* Bottom Buttons */}
                    <div className="flex gap-2 w-full mt-auto">
                      <Button
                        onClick={() => navigate(`/auth`)}
                        className="flex-grow px-4 py-4 text-lg font-medium bg-secondary text-black hover:bg-secondary/90 flex items-center gap-2 justify-center"
                      >
                        RSVP
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="text-center">
            <Button
              variant="default"
              size="default"
              onClick={() => setShowAuth(true)}
            >
              Create Your Event
            </Button>
          </div>
        </div>
      </section>

      {/* Admin & Host Section */}
      <section className="py-20 border-y border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Made for hosts & admins
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  "Create paid or free events with seats, venue, and date/time",
                  "Automatic routing to payment portal for paid events",
                  "Guests RSVP in one tap. Free events bypass checkout",
                  "Weekly recurring dinners/coffee/tea can be scheduled by Admin",
                  "Attendees always pay their own bill at the venue",
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
                <Button
                  variant="default"
                  size="default"
                  onClick={() => setShowAuth(true)}
                >
                  Start Hosting
                </Button>
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
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-foreground">{step}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                <p className="text-sm text-secondary font-medium">
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
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
                Mornings, evenings — better with company
              </h2>
              <div className="space-y-6 mb-8">
                {[
                  {
                    icon: <Coffee className="w-6 h-6" />,
                    text: "Update your routine with meaningful social time",
                    color: "bg-secondary",
                  },
                  {
                    icon: <Users className="w-6 h-6" />,
                    text: "Meet like‑minded people without the pressure",
                    color: "bg-primary",
                  },
                  {
                    icon: <Globe className="w-6 h-6" />,
                    text: "Discover great restaurants and cafés near you",
                    color: "bg-accent",
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
              <Button
                variant="default"
                size="default"
                onClick={() => setShowAuth(true)}
              >
                Join Your First Parish
              </Button>
            </div>

            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center border border-border">
                  <div className="text-center p-8">
                    <Coffee className="w-16 h-16 text-secondary mx-auto mb-4" />
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
      <section id="faq" className="py-20 border-t border-border bg-card/30">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
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
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Still have questions?
          </h3>
          <p className="text-xl text-foreground/70 mb-8">
            We're happy to help you get started
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="default"
              size="default"
              onClick={() => navigate("contact-us")}
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setShowAuth(true)}
            >
              Browse Events
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark-surface border-b border-border py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center">
              <ParishLogo />
            </div>

            {/* Links */}
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/80">
              <Link to="/contact-us" className="text-white">
                Contact Us
              </Link>
              <Link to="/refund-policy" className="text-white">
                Refund Policy
              </Link>
              <Link to="/safety-guidelines" className="text-white">
                Safety Guidelines
              </Link>
              <Link to="/terms-conditions" className="text-white">
                Terms & Conditions
              </Link>
              <Link to="/privacy-policy" className="text-white">
                Privacy Policy
              </Link>
            </nav>

            {/* Copyright */}
            <p className="text-white text-center">
              © {new Date().getFullYear()} Parish
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
